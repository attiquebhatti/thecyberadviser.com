import { NextRequest, NextResponse } from 'next/server';
import { requireSiteAdmin } from '@/lib/cyberquiz/admin';
import { getMigrationInsights } from '@/lib/unified-migrator/usage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Admin-only: aggregate Config Migration usage for the Insights dashboard.
export async function GET(req: NextRequest) {
  const auth = await requireSiteAdmin(req);
  if ('error' in auth) return auth.error;
  try {
    return NextResponse.json(await getMigrationInsights());
  } catch (err: any) {
    console.error('[migration/insights] failed:', err?.message || err);
    return NextResponse.json({ error: 'Failed to load migration insights' }, { status: 500 });
  }
}
