import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/cyberquiz/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [[session]] = await pool.query(
      'SELECT s.*, q.title AS quiz_title FROM sessions s LEFT JOIN quizzes q ON q.id = s.quiz_id WHERE s.id = ?',
      [params.id]
    ) as any[];
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    return NextResponse.json(session);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
