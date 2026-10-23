import { env } from '@/lib/env';
import type { User } from '@supabase/supabase-js';

export type Analysis = {
  duration: number;
  meta: Record<string, unknown>;
  scenes: { n: number; start: number; end: number; frame: string }[];
  transcript: string;
  music: string;
};

async function call<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${env('LAB_WORKER_URL').replace(/\/$/, '')}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env('LAB_WORKER_TOKEN')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const json = (await res.json().catch(() => ({}))) as T & { detail?: string };
  if (!res.ok) throw new Error(json.detail || `Worker error ${res.status}`);
  return json;
}

export const analyzeVideo = (input: { link?: string; video_url?: string }) => call<Analysis>('/analyze', input);

export const cleanVideo = (input: {
  video_url: string; upload_url: string; confirm_rights: true; mirror: boolean;
  boxes: { x: number; y: number; w: number; h: number }[];
}) => call<{ ok: boolean }>('/clean', input);

/** The Lab spends the owner's Claude budget, so only emails in LAB_OWNER_EMAILS may use it. */
export function labAllowed(user: User | null): user is User {
  const allowed = (process.env.LAB_OWNER_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  return !!user?.email && allowed.includes(user.email.toLowerCase());
}

export const LAB_BUCKET = 'lab';
