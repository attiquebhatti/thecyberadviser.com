import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/cyberquiz/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [[session]] = await pool.query(
      'SELECT s.*, q.title AS quiz_title FROM sessions s LEFT JOIN quizzes q ON q.id = s.quiz_id WHERE s.id = ?',
      [params.id]
    ) as any[];
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const [players]   = await pool.query('SELECT * FROM players WHERE session_id = ? ORDER BY score DESC', [params.id]) as any[];
    const [questions] = await pool.query('SELECT * FROM questions WHERE quiz_id = ? ORDER BY order_index', [session.quiz_id ?? '']) as any[];
    const [answers]   = await pool.query('SELECT * FROM answers WHERE session_id = ?', [params.id]) as any[];

    return NextResponse.json({ session, players, questions, answers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
