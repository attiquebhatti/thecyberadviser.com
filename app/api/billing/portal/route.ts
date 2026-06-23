import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/cyberquiz/auth';
import { getStripe, getBilling } from '@/lib/billing/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Opens the Stripe billing portal so a user can manage/cancel their plan.
export async function POST(req: NextRequest) {
  const auth = requireAuthUser(req);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  try {
    const billing = await getBilling(user.id);
    if (!billing?.customerId) {
      return NextResponse.json({ error: 'No subscription on file.' }, { status: 400 });
    }
    const base = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
    const session = await getStripe().billingPortal.sessions.create({
      customer: billing.customerId,
      return_url: `${base}/tools/cyberquiz/settings`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('[billing/portal] failed:', err?.message || err);
    return NextResponse.json({ error: err?.message || 'Could not open billing portal.' }, { status: 500 });
  }
}
