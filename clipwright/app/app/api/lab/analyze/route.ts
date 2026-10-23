import { NextResponse } from 'next/server';
import { z } from 'zod';
import type Anthropic from '@anthropic-ai/sdk';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { analyzeVideo, labAllowed, LAB_BUCKET } from '@/lib/lab/worker';
import { structuredCall } from '@/lib/anthropic';
import { LAB_RULES } from '@/lib/lab/rules';
import { Template } from '@/lib/lab/schema';

export const maxDuration = 300;

const Body = z.union([
  z.object({ link: z.string().url().max(500) }),
  z.object({ path: z.string().regex(/^[0-9a-f-]{36}\/video\/[0-9a-f-]{36}\.(mp4|mov|webm)$/) }),
]);

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!labAllowed(user)) return NextResponse.json({ error: 'The Lab is not enabled for this account.' }, { status: 403 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Paste a reel link or upload a video.' }, { status: 400 });
  const body = parsed.data;
  const storage = supabaseAdmin().storage.from(LAB_BUCKET);
  if ('path' in body && !body.path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: 'Not your upload.' }, { status: 403 });
  }

  try {
    let analysis;
    if ('link' in body) {
      analysis = await analyzeVideo({ link: body.link });
    } else {
      const { data } = await storage.createSignedUrl(body.path, 600);
      if (!data) return NextResponse.json({ error: 'Upload not found.' }, { status: 404 });
      try {
        analysis = await analyzeVideo({ video_url: data.signedUrl });
      } finally {
        await storage.remove([body.path]); // the video itself is never kept
      }
    }

    const content: Anthropic.Beta.BetaContentBlockParam[] = [];
    for (const s of analysis.scenes) {
      if (!s.frame) continue;
      content.push({ type: 'text', text: `Scene ${s.n}: ${s.start}-${s.end} s (middle frame)` });
      content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: s.frame } });
    }
    content.push({
      type: 'text',
      text: [
        `Study this viral short video and turn it into a reusable format.`,
        `Duration: ${analysis.duration} s.`,
        `Public post data: ${JSON.stringify(analysis.meta)}`,
        `Speech (auto transcript): ${analysis.transcript || 'none'}`,
        `Music recognised: ${analysis.music || 'unknown'}`,
        `Copy the hook text and the beat structure 1:1. In "mirror", describe our sharper version that is generated`,
        `from scratch with new people, a new set and the user's {PRODUCT}; never reuse the original footage.`,
      ].join('\n'),
    });

    const template = await structuredCall({ schema: Template, system: LAB_RULES, content });
    const { data: row, error } = await supabaseAdmin().from('lab_templates').insert({
      user_id: user.id,
      source_link: 'link' in body ? body.link : null,
      source_meta: analysis.meta,
      analysis: {
        duration: analysis.duration, transcript: analysis.transcript, music: analysis.music,
        scenes: analysis.scenes.map(({ n, start, end }) => ({ n, start, end })),
      },
      template,
    }).select('id').single();
    if (error || !row) return NextResponse.json({ error: 'Could not save the template.' }, { status: 500 });
    return NextResponse.json({ id: row.id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || 'Analysis failed.' }, { status: 502 });
  }
}
