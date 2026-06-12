import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '@/lib/cyberquiz/db';
import { makeToken, formatUser } from '@/lib/cyberquiz/auth';

export async function POST(req: NextRequest) {
  const { email, password, displayName } = await req.json();
  if (!email || !password)
    return NextResponse.json({ error: 'email and password required' }, { status: 400 });

  try {
    const [existing] = await pool.query('SELECT id FROM profiles WHERE email = ?', [email]) as any[];
    if (existing.length > 0)
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

    const hash = await bcrypt.hash(password, 12);
    const id   = uuidv4();
    const name = (displayName?.trim()) || email.split('@')[0];

    await pool.query(
      'INSERT INTO profiles (id, email, password_hash, display_name) VALUES (?, ?, ?, ?)',
      [id, email.toLowerCase().trim(), hash, name]
    );
    const [[user]] = await pool.query('SELECT * FROM profiles WHERE id = ?', [id]) as any[];
    return NextResponse.json({ token: makeToken(user), user: formatUser(user) }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Signup failed' }, { status: 500 });
  }
}
