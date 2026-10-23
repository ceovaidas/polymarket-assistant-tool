'use client';

/** Uploads a file straight to private storage and returns its path. */
export async function uploadToLab(kind: 'video' | 'product' | 'clean', file: File): Promise<string> {
  const r = await fetch('/api/lab/upload', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, type: file.type }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Could not prepare the upload.');
  const put = await fetch(j.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
  if (!put.ok) throw new Error('Upload failed. Try again.');
  return j.path as string;
}

export const MAX_VIDEO_MB = 60;
