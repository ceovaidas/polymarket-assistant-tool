import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { MODELS, jobCost, type ModelId } from '@/lib/pricing';
import { createVideoTask } from '@/lib/kie';
import { env, siteUrl } from '@/lib/env';

const Body = z.object({
  model: z.enum(Object.keys(MODELS) as [ModelId, ...ModelId[]]),
  prompt: z.string().trim().min(5).max(2000),
  seconds: z.number().int(),
  firstFrameUrl: z.string().url().optional(),
  aspectRatio: z.enum(['9:16', '1:1', '16:9']).default('9:16'),
});

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to generate.' }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Check the prompt and length.' }, { status: 400 });
  const b = parsed.data;
  const m = MODELS[b.model];
  if (b.seconds < m.minSec || b.seconds > m.maxSec) {
    return NextResponse.json({ error: `Length must be ${m.minSec}–${m.maxSec} seconds for ${m.label}.` }, { status: 400 });
  }

  const cost = jobCost(b.model, b.seconds); // price is always computed on the server
  const db = supabaseAdmin();
  const { data: job, error: jobErr } = await db.from('jobs')
    .insert({ user_id: user.id, model: b.model, params: b, seconds: b.seconds, cost })
    .select('id').single();
  if (jobErr || !job) return NextResponse.json({ error: 'Could not create the job.' }, { status: 500 });

  const spend = await db.rpc('spend_credits', { p_user: user.id, p_cost: cost, p_job: job.id });
  if (spend.error) {
    await db.from('jobs').delete().eq('id', job.id);
    const low = spend.error.message.includes('insufficient_credits');
    return NextResponse.json({ error: low ? 'Not enough credits. Top up to continue.' : 'Could not charge credits.' }, { status: low ? 402 : 500 });
  }

  try {
    const input: Record<string, unknown> = {
      prompt: b.prompt, duration: b.seconds, resolution: '720p', aspect_ratio: b.aspectRatio, generate_audio: true,
    };
    if (b.firstFrameUrl) input.first_frame_url = b.firstFrameUrl;
    const callback = `${siteUrl()}/api/kie/callback?token=${encodeURIComponent(env('KIE_CALLBACK_TOKEN'))}&job=${job.id}`;
    const taskId = await createVideoTask(m.providerModel, input, callback);
    await db.from('jobs').update({ provider_task_id: taskId, status: 'running', updated_at: new Date().toISOString() }).eq('id', job.id);
    return NextResponse.json({ jobId: job.id, cost, balance: spend.data });
  } catch (e) {
    // Provider refused the task: give the credits back.
    await db.from('jobs').update({ status: 'failed', error: (e as Error).message }).eq('id', job.id);
    await db.rpc('add_credits', { p_user: user.id, p_amount: cost, p_reason: 'refund', p_job: job.id });
    return NextResponse.json({ error: 'The video service is busy. Your credits were returned.' }, { status: 502 });
  }
}
