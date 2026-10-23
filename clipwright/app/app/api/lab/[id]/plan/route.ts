import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { labAllowed, LAB_BUCKET } from '@/lib/lab/worker';
import { structuredCall } from '@/lib/anthropic';
import { LAB_RULES } from '@/lib/lab/rules';
import { Plan } from '@/lib/lab/schema';

export const maxDuration = 300;

const Body = z.object({
  productPath: z.string().regex(/^[0-9a-f-]{36}\/product\/[0-9a-f-]{36}\.(jpg|png|webp)$/),
  productNote: z.string().trim().max(600).default(''),
  angle: z.string().trim().max(300).default(''),
  extras: z.string().trim().max(1000).default(''),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!labAllowed(user)) return NextResponse.json({ error: 'The Lab is not enabled for this account.' }, { status: 403 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Add a product photo.' }, { status: 400 });
  const b = parsed.data;
  if (!b.productPath.startsWith(`${user.id}/`)) return NextResponse.json({ error: 'Not your upload.' }, { status: 403 });

  // RLS: only the owner can read the row.
  const { data: row } = await supabase.from('lab_templates').select('template').eq('id', id).single();
  if (!row) return NextResponse.json({ error: 'Template not found.' }, { status: 404 });

  const { data: signed } = await supabaseAdmin().storage.from(LAB_BUCKET).createSignedUrl(b.productPath, 600);
  if (!signed) return NextResponse.json({ error: 'Product photo not found.' }, { status: 404 });

  try {
    const plan = await structuredCall({
      schema: Plan,
      system: LAB_RULES,
      content: [
        { type: 'text', text: 'Reference 1, the product photo. Describe this exact product (colour, print, shape, size):' },
        { type: 'image', source: { type: 'url', url: signed.signedUrl } },
        {
          type: 'text',
          text: [
            `The viral format to remake:\n${JSON.stringify(row.template)}`,
            `Product notes from the user: ${b.productNote || 'none'}`,
            `New setting / angle: ${b.angle || 'pick the strongest angle from the template'}`,
            `Extra wishes: ${b.extras || 'none'}`,
            `Write the numbered build order. Keep the hook text and beat timing 1:1, apply "mirror.stronger",`,
            `and generate every shot from scratch with the user's product.`,
          ].join('\n'),
        },
      ],
    });
    await supabaseAdmin().from('lab_templates')
      .update({ plan, product_path: b.productPath, updated_at: new Date().toISOString() })
      .eq('id', id).eq('user_id', user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message || 'Could not write the plan.' }, { status: 502 });
  }
}
