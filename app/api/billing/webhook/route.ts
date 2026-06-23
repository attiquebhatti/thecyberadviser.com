import { NextRequest, NextResponse } from 'next/server';
import {
  getStripe,
  applySubscription,
  userIdForCustomer,
  tierForPrice,
} from '@/lib/billing/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Stripe webhook — keeps profiles.tier in sync with subscription state.
// Configure the endpoint URL + STRIPE_WEBHOOK_SECRET in the Stripe dashboard.
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get('stripe-signature');
  if (!secret || !sig) {
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 400 });
  }

  let event;
  try {
    const raw = await req.text(); // raw body required for signature verification
    event = getStripe().webhooks.constructEvent(raw, sig, secret);
  } catch (err: any) {
    console.error('[billing/webhook] signature verification failed:', err?.message || err);
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as any;
        const userId = s.metadata?.userId || s.client_reference_id;
        const tier = s.metadata?.tier;
        if (userId && tier) await applySubscription(userId, tier, s.subscription || null);
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as any;
        const userId = sub.metadata?.userId || (await userIdForCustomer(sub.customer));
        if (userId) {
          const priceId = sub.items?.data?.[0]?.price?.id;
          const tier = tierForPrice(priceId);
          const active = sub.status === 'active' || sub.status === 'trialing';
          await applySubscription(userId, active && tier ? tier : 'free', sub.id);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as any;
        const userId = sub.metadata?.userId || (await userIdForCustomer(sub.customer));
        if (userId) await applySubscription(userId, 'free', null);
        break;
      }
    }
    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('[billing/webhook] handler failed:', err?.message || err);
    return NextResponse.json({ error: 'Handler error.' }, { status: 500 });
  }
}
