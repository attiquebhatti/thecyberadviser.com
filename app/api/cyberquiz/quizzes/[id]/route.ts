import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/cyberquiz/db';
import { requireAuthUser } from '@/lib/cyberquiz/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuthUser(req);
  if ('error' in auth) return auth.error;
  try {
    const [[quiz]] = await pool.query('SELECT * FROM quizzes WHERE id = ? AND host_id = ?', [params.id, auth.user.id]) as any[];
    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    return NextResponse.json(quiz);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuthUser(req);
  if ('error' in auth) return auth.error;
  const body = await req.json();
  const allowed = ['title', 'subject', 'grade_level', 'is_public', 'is_starred', 'play_count'];
  const updates: string[] = [];
  const values: unknown[]  = [];
  for (const key of allowed) {
    if (body[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(typeof body[key] === 'boolean' ? (body[key] ? 1 : 0) : body[key]);
    }
  }
  if (updates.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  values.push(params.id, auth.user.id);
  try {
    const [result] = await pool.query(`UPDATE quizzes SET ${updates.join(', ')} WHERE id = ? AND host_id = ?`, values) as any[];
    if (result.affectedRows === 0) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    const [[quiz]] = await pool.query('SELECT * FROM quizzes WHERE id = ?', [params.id]) as any[];
    return NextResponse.json(quiz);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuthUser(req);
  if ('error' in auth) return auth.error;
  try {
    const [result] = await pool.query('DELETE FROM quizzes WHERE id = ? AND host_id = ?', [params.id, auth.user.id]) as any[];
    if (result.affectedRows === 0) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
