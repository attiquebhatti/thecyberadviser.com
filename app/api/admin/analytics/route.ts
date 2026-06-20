import { NextRequest, NextResponse } from 'next/server';
import { requireSiteAdmin } from '@/lib/cyberquiz/admin';
import { getInsights, isGaConfigured } from '@/lib/analytics/ga';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const auth = await requireSiteAdmin(req);
  if ('error' in auth) return auth.error;

  if (!isGaConfigured()) {
    return NextResponse.json({ configured: false });
  }

  const rangeDays = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get('days') || '28', 10), 1), 365);
  try {
    const insights = await getInsights(rangeDays);
    return NextResponse.json({ configured: true, insights });
  } catch (err: any) {
    return NextResponse.json({ configured: true, error: err.message || 'Failed to fetch GA data' }, { status: 502 });
  }
}
