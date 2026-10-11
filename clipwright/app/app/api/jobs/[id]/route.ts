import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { syncJob } from '@/lib/jobs';

/** Job status for the signed-in owner. Also syncs with the provider in case a callback was missed. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const { data: own } = await supabase.from('jobs').select('id').eq('id', id).single(); // RLS: only own jobs
  if (!own) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  const job = await syncJob(id);
  return NextResponse.json({ id, status: job?.status, resultUrl: job?.result_url, error: job?.error });
}
