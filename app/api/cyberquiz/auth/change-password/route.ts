import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { pool } from '@/lib/cyberquiz/db';
import { requireAuthUser } from '@/lib/cyberquiz/auth';

export async function PATCH(req: NextRequest) {
  const auth = requireAuthUser(req);
  if ('error' in auth) return auth.error;

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword)
    return NextResponse.json({ error: 'currentPassword and newPassword are required' }, { status: 400 });
  if (newPassword.length < 8)
    return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });

  try {
    const [[user]] = await pool.query('SELECT password_hash FROM profiles WHERE id = ?', [auth.user.id]) as any[];
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });

    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE profiles SET password_hash = ? WHERE id = ?', [hash, auth.user.id]);
    return NextResponse.json({ message: 'Password changed successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
