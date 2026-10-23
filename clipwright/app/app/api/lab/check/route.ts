import { NextResponse } from 'next/server';
import { z } from 'zod';
import type Anthropic from '@anthropic-ai/sdk';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { analyzeVideo, labAllowed, LAB_BUCKET } from '@/lib/lab/worker';
import { structuredCall } from '@/lib/anthropic';
import { LAB_RULES, CHECK_RULES } from '@/lib/lab/rules';
import { Check } from '@/lib/lab/schema';

export const maxDuration = 300;

const Body = z.object({
  path: z.string().regex(/^[0-9a-f-]{36}\/check\/[0-9a-f-]{36}\.(mp4|mov|webm)$/),
  title: z.string().trim().max(120).default(''),
  context: z.string().trim().max(600).default(''),
});

/** Virality check of the user's own video. The video is deleted right after it is read. */
export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!labAllowed(user)) return NextResponse.json({ error: 'Laboratorija šiai paskyrai neįjungta.' }, { status: 403 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Įkelk video.' }, { status: 400 });
  const b = parsed.data;
  if (!b.path.startsWith(`${user.id}/`)) return NextResponse.json({ error: 'Ne tavo failas.' }, { status: 403 });

  const storage = supabaseAdmin().storage.from(LAB_BUCKET);
  const { data: signed } = await storage.createSignedUrl(b.path, 600);
  if (!signed) return NextResponse.json({ error: 'Video nerastas.' }, { status: 404 });

  try {
    let analysis;
    try {
      analysis = await analyzeVideo({ video_url: signed.signedUrl, timeline: true });
    } finally {
      await storage.remove([b.path]);
    }

    const content: Anthropic.Beta.BetaContentBlockParam[] = [];
    for (const f of analysis.timeline) {
      if (!f.frame) continue;
      content.push({ type: 'text', text: `${f.t} s` });
      content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: f.frame } });
    }
    content.push({
      type: 'text',
      text: [
        `Check this video before it is posted. Frames above are evenly spaced; the times are seconds.`,
        `Duration: ${analysis.duration} s. Shot changes at: ${analysis.scenes.map((s) => s.start).join(', ')} s.`,
        `Speech (auto transcript): ${analysis.transcript || 'none'}`,
        `Music recognised: ${analysis.music || 'unknown (the user may add music later)'}`,
        `What the user says about it: ${b.context || 'nothing'}`,
      ].join('\n'),
    });

    const result = await structuredCall({ schema: Check, system: `${LAB_RULES}\n\n${CHECK_RULES}`, content });
    const { data: row, error } = await supabaseAdmin().from('lab_checks')
      .insert({ user_id: user.id, title: b.title || null, duration: analysis.duration, result })
      .select('id').single();
    if (error || !row) return NextResponse.json({ error: 'Nepavyko išsaugoti rezultato.' }, { status: 500 });
    return NextResponse.json({ id: row.id });
  } catch {
    return NextResponse.json({ error: 'Patikrinti nepavyko. Pabandyk dar kartą arba su kitu failu.' }, { status: 502 });
  }
}
