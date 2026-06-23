// ────────────────────────────────────────────────────────────────
// Stripe billing — CyberQuiz Educator/Pro subscriptions
// ────────────────────────────────────────────────────────────────
//
// On successful checkout the user's profiles.tier is upgraded (limit
// enforcement is a separate follow-up). Keys/prices come from env so
// the owner controls them (start in Stripe test mode):
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
//   STRIPE_PRICE_EDUCATOR, STRIPE_PRICE_PRO,
//   NEXT_PUBLIC_SITE_URL (for success/cancel redirects)
//

import Stripe from 'stripe';
import { pool } from '@/lib/cyberquiz/db';

export type PaidTier = 'educator' | 'pro';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Stripe is not configured (STRIPE_SECRET_KEY missing).');
  if (!_stripe) _stripe = new Stripe(key, { apiVersion: '2024-06-20' as any });
  return _stripe;
}

export function priceForTier(tier: PaidTier): string {
  const id = tier === 'pro' ? process.env.STRIPE_PRICE_PRO : process.env.STRIPE_PRICE_EDUCATOR;
  if (!id) throw new Error(`No Stripe price configured for tier "${tier}".`);
  return id;
}

export function tierForPrice(priceId: string | undefined): PaidTier | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_PRO) return 'pro';
  if (priceId === process.env.STRIPE_PRICE_EDUCATOR) return 'educator';
  return null;
}

let columnsEnsured = false;

/** Add stripe_customer_id / stripe_subscription_id to profiles if absent. */
export async function ensureBillingColumns(): Promise<void> {
  if (columnsEnsured) return;
  const [cols] = (await pool.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'profiles'
         AND COLUMN_NAME IN ('stripe_customer_id','stripe_subscription_id','tier')`
  )) as any[];
  const have = new Set((cols as any[]).map((c) => c.COLUMN_NAME));
  if (!have.has('stripe_customer_id'))
    await pool.query(`ALTER TABLE profiles ADD COLUMN stripe_customer_id VARCHAR(64) NULL`);
  if (!have.has('stripe_subscription_id'))
    await pool.query(`ALTER TABLE profiles ADD COLUMN stripe_subscription_id VARCHAR(64) NULL`);
  if (!have.has('tier'))
    await pool.query(`ALTER TABLE profiles ADD COLUMN tier VARCHAR(32) NOT NULL DEFAULT 'free'`);
  columnsEnsured = true;
}

export async function getBilling(userId: string): Promise<{ tier: string; customerId: string | null; subId: string | null } | null> {
  await ensureBillingColumns();
  const [[row]] = (await pool.query(
    `SELECT tier, stripe_customer_id AS customerId, stripe_subscription_id AS subId FROM profiles WHERE id = ?`,
    [userId]
  )) as any[];
  return row || null;
}

export async function setCustomerId(userId: string, customerId: string): Promise<void> {
  await ensureBillingColumns();
  await pool.query(`UPDATE profiles SET stripe_customer_id = ? WHERE id = ?`, [customerId, userId]);
}

/** Set the user's tier + subscription id (called from the webhook). */
export async function applySubscription(userId: string, tier: string, subId: string | null): Promise<void> {
  await ensureBillingColumns();
  await pool.query(`UPDATE profiles SET tier = ?, stripe_subscription_id = ? WHERE id = ?`, [tier, subId, userId]);
}

export async function userIdForCustomer(customerId: string): Promise<string | null> {
  await ensureBillingColumns();
  const [[row]] = (await pool.query(`SELECT id FROM profiles WHERE stripe_customer_id = ? LIMIT 1`, [customerId])) as any[];
  return row?.id ?? null;
}
