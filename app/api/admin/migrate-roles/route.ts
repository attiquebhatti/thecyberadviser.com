import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/cyberquiz/db';
import { requireAuthUser } from '@/lib/cyberquiz/auth';
import { isEnvAdmin } from '@/lib/cyberquiz/admin';

export const dynamic = 'force-dynamic';

// Adds the profiles.role column if missing. Gated to the bootstrap env admin
// (ADMIN_EMAIL) so it can be run before any DB roles exist. Idempotent.
export async function POST(req: NextRequest) {
  const auth = requireAuthUser(req);
  if ('error' in auth) return auth.error;
  if (!isEnvAdmin(auth.user.email)) {
    return NextResponse.json({ error: 'Forbidden — bootstrap admin only' }, { status: 403 });
  }

  try {
    const [[col]] = await pool.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'profiles' AND COLUMN_NAME = 'role'`
    ) as any[];

    if (!col) {
      await pool.query(
        `ALTER TABLE profiles ADD COLUMN role ENUM('standard','admin') NOT NULL DEFAULT 'standard'`
      );
    }

    // Ensure the bootstrap admin email is flagged admin in the DB too.
    const adminEmail = (process.env.ADMIN_EMAIL || process.env.ATC_ADMIN_EMAIL || '').toLowerCase();
    if (adminEmail) {
      await pool.query("UPDATE profiles SET role = 'admin' WHERE LOWER(email) = ?", [adminEmail]);
    }

    return NextResponse.json({ ok: true, columnAdded: !col });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
