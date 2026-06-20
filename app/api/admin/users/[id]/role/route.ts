import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/cyberquiz/db';
import { requireSiteAdmin, isEnvAdmin } from '@/lib/cyberquiz/admin';

export const dynamic = 'force-dynamic';

// PATCH — change a user's role (standard <-> admin). Admin only.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireSiteAdmin(req);
  if ('error' in auth) return auth.error;

  try {
    const { role } = await req.json();
    if (role !== 'standard' && role !== 'admin') {
      return NextResponse.json({ error: "role must be 'standard' or 'admin'." }, { status: 400 });
    }

    const [[target]] = await pool.query('SELECT id, email FROM profiles WHERE id = ?', [params.id]) as any[];
    if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    // The bootstrap super-admin (ADMIN_EMAIL) can never be demoted.
    if (isEnvAdmin(target.email) && role !== 'admin') {
      return NextResponse.json({ error: 'The site owner account cannot be demoted.' }, { status: 400 });
    }

    await pool.query('UPDATE profiles SET role = ? WHERE id = ?', [role, params.id]);
    return NextResponse.json({ ok: true, id: params.id, role });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update role.' }, { status: 500 });
  }
}
