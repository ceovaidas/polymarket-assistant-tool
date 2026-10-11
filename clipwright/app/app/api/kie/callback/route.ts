import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { syncJob } from '@/lib/jobs';

function sameToken(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Provider calls this when a video finishes. We ignore the body and re-check the status ourselves. */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token') || '';
  const job = url.searchParams.get('job') || '';
  if (!process.env.KIE_CALLBACK_TOKEN || !sameToken(token, process.env.KIE_CALLBACK_TOKEN)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!/^[0-9a-f-]{36}$/i.test(job)) return NextResponse.json({ ok: false }, { status: 400 });
  await syncJob(job);
  return NextResponse.json({ ok: true });
}
