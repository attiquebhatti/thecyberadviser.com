import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/cyberquiz/db';
import { requireAuthUser, formatUser } from '@/lib/cyberquiz/auth';

export async function GET(req: NextRequest) {
  const auth = requireAuthUser(req);
  if ('error' in auth) return auth.error;

  try {
    const [[user]] = await pool.query('SELECT * FROM profiles WHERE id = ?', [auth.user.id]) as any[];
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json(formatUser(user));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
