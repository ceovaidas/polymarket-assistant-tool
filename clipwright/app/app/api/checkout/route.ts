import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { PACKS } from '@/lib/pricing';
import { siteUrl } from '@/lib/env';

/** Starts a Stripe Checkout for a credit pack. Credits are added only by the webhook after payment. */
export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${siteUrl()}/login?next=/credits`, 303);
  const form = await req.formData();
  const pack = PACKS.find((p) => p.id === form.get('pack'));
  if (!pack) return NextResponse.json({ error: 'Unknown pack.' }, { status: 400 });

  const session = await stripe().checkout.sessions.create({
    mode: 'payment',
    customer_email: user.email,
    line_items: [{
      quantity: 1,
      price_data: { currency: 'usd', unit_amount: pack.usd * 100, product_data: { name: `${pack.credits.toLocaleString('en-US')} Clipwright credits` } },
    }],
    metadata: { user_id: user.id, pack_id: pack.id, credits: String(pack.credits) },
    success_url: `${siteUrl()}/credits?paid=1`,
    cancel_url: `${siteUrl()}/credits?cancelled=1`,
  });
  return NextResponse.redirect(session.url!, 303);
}
