import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { LAB_BUCKET, labAllowed } from '@/lib/lab/worker';

const Body = z.object({
  kind: z.enum(['video', 'product', 'clean', 'check']),
  type: z.enum(['video/mp4', 'video/quicktime', 'video/webm', 'image/jpeg', 'image/png', 'image/webp']),
});
const EXT: Record<string, string> = {
  'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm',
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
};

/** Gives the browser a one-time URL to upload a file straight to private storage (no size limit on our server). */
export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!labAllowed(user)) return NextResponse.json({ error: 'The Lab is not enabled for this account.' }, { status: 403 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Unsupported file type.' }, { status: 400 });
  const { kind, type } = parsed.data;
  if (kind === 'product' !== type.startsWith('image/')) {
    return NextResponse.json({ error: kind === 'product' ? 'Upload a photo.' : 'Upload a video.' }, { status: 400 });
  }

  const path = `${user.id}/${kind}/${crypto.randomUUID()}.${EXT[type]}`;
  const { data, error } = await supabaseAdmin().storage.from(LAB_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return NextResponse.json({ error: 'Could not prepare the upload.' }, { status: 500 });
  return NextResponse.json({ path, uploadUrl: data.signedUrl });
}
