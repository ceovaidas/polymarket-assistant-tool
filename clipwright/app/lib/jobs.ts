import { supabaseAdmin } from '@/lib/supabase/admin';
import { getTask } from '@/lib/kie';

/** Pull the provider status for a job and store it. Refunds once if the job failed. */
export async function syncJob(jobId: string) {
  const db = supabaseAdmin();
  const { data: job } = await db.from('jobs').select('*').eq('id', jobId).single();
  if (!job || !job.provider_task_id || job.status === 'success' || job.status === 'failed') return job;
  const t = await getTask(job.provider_task_id);
  if (t.state === 'success' && t.urls[0]) {
    await db.from('jobs').update({ status: 'success', result_url: t.urls[0], updated_at: new Date().toISOString() }).eq('id', jobId);
  } else if (t.state === 'fail') {
    await db.from('jobs').update({ status: 'failed', error: t.error || 'Generation failed', updated_at: new Date().toISOString() }).eq('id', jobId);
    await db.rpc('add_credits', { p_user: job.user_id, p_amount: job.cost, p_reason: 'refund', p_job: jobId });
  } else if (job.status === 'queued') {
    await db.from('jobs').update({ status: 'running', updated_at: new Date().toISOString() }).eq('id', jobId);
  }
  return (await db.from('jobs').select('*').eq('id', jobId).single()).data;
}
