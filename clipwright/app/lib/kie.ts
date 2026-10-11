import { env } from '@/lib/env';

const BASE = 'https://api.kie.ai/api/v1/jobs';

export type KieState = 'waiting' | 'queuing' | 'generating' | 'success' | 'fail';

/** Start a video task. Returns the provider task id. */
export async function createVideoTask(model: string, input: Record<string, unknown>, callBackUrl: string): Promise<string> {
  const res = await fetch(`${BASE}/createTask`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env('KIE_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, input, callBackUrl }),
  });
  const json = (await res.json().catch(() => ({}))) as { code?: number; msg?: string; data?: { taskId?: string } };
  if (!res.ok || json.code !== 200 || !json.data?.taskId) throw new Error(json.msg || `Provider error ${res.status}`);
  return json.data.taskId;
}

/** Ask the provider for the real status (never trust a callback body on its own). */
export async function getTask(taskId: string): Promise<{ state: KieState; urls: string[]; error?: string }> {
  const res = await fetch(`${BASE}/recordInfo?taskId=${encodeURIComponent(taskId)}`, {
    headers: { Authorization: `Bearer ${env('KIE_API_KEY')}` },
    cache: 'no-store',
  });
  const json = (await res.json().catch(() => ({}))) as { data?: { state?: KieState; resultJson?: string; failMsg?: string } };
  const d = json.data || {};
  let urls: string[] = [];
  try { urls = (JSON.parse(d.resultJson || '{}').resultUrls as string[]) || []; } catch { urls = []; }
  return { state: d.state || 'waiting', urls, error: d.failMsg || undefined };
}
