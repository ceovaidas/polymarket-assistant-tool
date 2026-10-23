import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { cleanVideo, labAllowed, LAB_BUCKET } from '@/lib/lab/worker';

export const maxDuration = 300;

const Box = z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1), w: z.number().min(0).max(1), h: z.number().min(0).max(1) });
const Body = z.object({
  path: z.string().regex(/^[0-9a-f-]{36}\/clean\/[0-9a-f-]{36}\.(mp4|mov|webm)$/),
  confirmRights: z.literal(true),
  mirror: z.boolean(),
  boxes: z.array(Box).max(6),
});

/** Mirror and/or blur areas on the user's OWN video (e.g. a generated clip with baked-in text). */
export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!labAllowed(user)) return NextResponse.json({ error: 'The Lab is not enabled for this account.' }, { status: 403 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Upload your video and confirm you own it.' }, { status: 400 });
  const b = parsed.data;
  if (!b.path.startsWith(`${user.id}/`)) return NextResponse.json({ error: 'Not your upload.' }, { status: 403 });

  const storage = supabaseAdmin().storage.from(LAB_BUCKET);
  const outPath = `${user.id}/cleaned/${crypto.randomUUID()}.mp4`;
  const [{ data: src }, { data: up }] = await Promise.all([
    storage.createSignedUrl(b.path, 900),
    storage.createSignedUploadUrl(outPath),
  ]);
  if (!src || !up) return NextResponse.json({ error: 'Upload not found.' }, { status: 404 });

  try {
    await cleanVideo({ video_url: src.signedUrl, upload_url: up.signedUrl, confirm_rights: true, mirror: b.mirror, boxes: b.boxes });
    const { data: out } = await storage.createSignedUrl(outPath, 3600, { download: 'clean.mp4' });
    return NextResponse.json({ url: out?.signedUrl });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || 'Processing failed.' }, { status: 502 });
  } finally {
    await storage.remove([b.path]);
  }
}
