import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { pool } from '@/lib/cyberquiz/db';
import { makeToken, formatUser } from '@/lib/cyberquiz/auth';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password)
    return NextResponse.json({ error: 'email and password required' }, { status: 400 });

  try {
    const [[user]] = await pool.query(
      'SELECT * FROM profiles WHERE email = ?', [email.toLowerCase().trim()]
    ) as any[];
    if (!user) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

    if (!user.password_hash)
      return NextResponse.json({ error: 'This account uses Google sign-in. Please click "Continue with Google" instead.' }, { status: 401 });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

    return NextResponse.json({ token: makeToken(user), user: formatUser(user) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 500 });
  }
}
