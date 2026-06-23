import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/cyberquiz/auth';
import { getStripe, priceForTier, getBilling, setCustomerId, type PaidTier } from '@/lib/billing/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Creates a Stripe Checkout Session for a CyberQuiz subscription tier.
export async function POST(req: NextRequest) {
  const auth = requireAuthUser(req);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  let body: any;
  try { body = await req.json(); } catch { body = {}; }
  const tier = body.tier as PaidTier;
  if (tier !== 'educator' && tier !== 'pro') {
    return NextResponse.json({ error: 'Invalid tier.' }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const base = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;

    // Reuse or create the Stripe customer for this user.
    const billing = await getBilling(user.id);
    let customerId = billing?.customerId || undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.displayName || undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await setCustomerId(user.id, customerId);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceForTier(tier), quantity: 1 }],
      client_reference_id: user.id,
      metadata: { userId: user.id, tier },
      subscription_data: { metadata: { userId: user.id, tier } },
      success_url: `${base}/tools/cyberquiz/dashboard?upgraded=${tier}`,
      cancel_url: `${base}/tools/cyberquiz?checkout=cancelled`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('[billing/checkout] failed:', err?.message || err);
    return NextResponse.json({ error: err?.message || 'Could not start checkout.' }, { status: 500 });
  }
}
