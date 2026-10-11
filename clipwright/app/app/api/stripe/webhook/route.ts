import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { PACKS } from '@/lib/pricing';
import { env } from '@/lib/env';

/** Adds credits after a paid checkout. Signature-checked and idempotent (one grant per session). */
export async function POST(req: Request) {
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, req.headers.get('stripe-signature') || '', env('STRIPE_WEBHOOK_SECRET'));
  } catch {
    return NextResponse.json({ error: 'Bad signature' }, { status: 400 });
  }
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const s = event.data.object as Stripe.Checkout.Session;
    if (s.payment_status === 'paid') {
      const pack = PACKS.find((p) => p.id === s.metadata?.pack_id);
      const userId = s.metadata?.user_id;
      if (pack && userId) {
        const { error } = await supabaseAdmin().rpc('add_credits', { p_user: userId, p_amount: pack.credits, p_reason: 'purchase', p_session: s.id });
        if (error) return NextResponse.json({ error: 'retry' }, { status: 500 }); // Stripe retries
      }
    }
  }
  return NextResponse.json({ received: true });
}
