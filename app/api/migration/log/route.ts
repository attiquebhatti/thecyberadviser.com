import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/cyberquiz/auth';
import { recordMigrationRun } from '@/lib/unified-migrator/usage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Records one Config Migration run for the signed-in user (Insights dashboard).
export async function POST(req: NextRequest) {
  const auth = requireAuthUser(req);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  let body: any;
  try { body = await req.json(); } catch { body = {}; }

  try {
    await recordMigrationRun({
      userId: user.id,
      userEmail: user.email,
      userName: user.displayName || user.email,
      sourceVendor: String(body.sourceVendor || ''),
      targetVendor: String(body.targetVendor || ''),
      fileName: String(body.fileName || ''),
      automatedRate: typeof body.automatedRate === 'number' ? body.automatedRate : null,
      flagged: typeof body.flagged === 'number' ? body.flagged : null,
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[migration/log] failed:', err?.message || err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
