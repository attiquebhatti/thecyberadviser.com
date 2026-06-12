import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '@/lib/cyberquiz/db';
import { requireAuthUser } from '@/lib/cyberquiz/auth';

export async function GET(req: NextRequest) {
  const auth = requireAuthUser(req);
  if ('error' in auth) return auth.error;
  try {
    const [rows] = await pool.query('SELECT * FROM quizzes WHERE host_id = ? ORDER BY updated_at DESC', [auth.user.id]) as any[];
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAuthUser(req);
  if ('error' in auth) return auth.error;
  const { title = 'Untitled Quiz', subject = 'Other', grade_level = 'College', is_public = false } = await req.json();
  const id = uuidv4();
  try {
    await pool.query(
      'INSERT INTO quizzes (id, host_id, title, subject, grade_level, is_public) VALUES (?, ?, ?, ?, ?, ?)',
      [id, auth.user.id, title, subject, grade_level, is_public ? 1 : 0]
    );
    const [[quiz]] = await pool.query('SELECT * FROM quizzes WHERE id = ?', [id]) as any[];
    return NextResponse.json(quiz, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
