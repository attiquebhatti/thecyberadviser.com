import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/cyberquiz/db';
import { requireAuthUser, formatUser } from '@/lib/cyberquiz/auth';

export async function PATCH(req: NextRequest) {
  const auth = requireAuthUser(req);
  if ('error' in auth) return auth.error;

  const { displayName, avatarUrl } = await req.json();
  const updates: string[] = [];
  const values: unknown[]  = [];

  if (displayName !== undefined) { updates.push('display_name = ?'); values.push(displayName); }
  if (avatarUrl   !== undefined) { updates.push('avatar_url = ?');   values.push(avatarUrl);   }
  if (updates.length === 0)
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

  values.push(auth.user.id);
  try {
    await pool.query(`UPDATE profiles SET ${updates.join(', ')} WHERE id = ?`, values);
    const [[user]] = await pool.query('SELECT * FROM profiles WHERE id = ?', [auth.user.id]) as any[];
    return NextResponse.json(formatUser(user));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
