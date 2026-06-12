import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { pool } from '@/lib/cyberquiz/db';

const JWT_SECRET = process.env.CQ_JWT_SECRET || 'change-this-secret';

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 });

  try {
    const [[user]] = await pool.query(
      'SELECT id, email FROM profiles WHERE email = ?', [email.toLowerCase().trim()]
    ) as any[];
    if (!user) return NextResponse.json({ message: 'If that email exists, a reset token has been generated.' });

    const resetToken = jwt.sign(
      { type: 'password_reset', id: user.id, email: user.email },
      JWT_SECRET, { expiresIn: '1h' }
    );
    return NextResponse.json({
      message: 'Reset token generated.',
      resetToken,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
