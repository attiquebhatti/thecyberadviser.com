import { NextRequest, NextResponse } from 'next/server';
import { requireSiteAdmin } from '@/lib/cyberquiz/admin';
import { listInquiries } from '@/lib/inquiries';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Admin-only: recent contact inquiries for the Insights dashboard.
export async function GET(req: NextRequest) {
  const auth = await requireSiteAdmin(req);
  if ('error' in auth) return auth.error;
  try {
    return NextResponse.json({ inquiries: await listInquiries(100) });
  } catch (err: any) {
    console.error('[admin/inquiries] failed:', err?.message || err);
    return NextResponse.json({ error: 'Failed to load inquiries' }, { status: 500 });
  }
}
