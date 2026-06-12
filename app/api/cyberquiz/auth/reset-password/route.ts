import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '@/lib/cyberquiz/db';

const JWT_SECRET = process.env.CQ_JWT_SECRET || 'change-this-secret';

export async function POST(req: NextRequest) {
  const { token, newPassword } = await req.json();
  if (!token || !newPassword)
    return NextResponse.json({ error: 'token and newPassword are required' }, { status: 400 });
  if (newPassword.length < 8)
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });

  try {
    let payload: any;
    try { payload = jwt.verify(token, JWT_SECRET); }
    catch { return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 401 }); }

    if (payload.type !== 'password_reset')
      return NextResponse.json({ error: 'Invalid token type' }, { status: 401 });

    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE profiles SET password_hash = ? WHERE id = ?', [hash, payload.id]);
    return NextResponse.json({ message: 'Password updated successfully. You can now log in.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
