import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '@/lib/cyberquiz/db';
import { requireAuthUser } from '@/lib/cyberquiz/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuthUser(req);
  if ('error' in auth) return auth.error;
  try {
    const [[src]] = await pool.query('SELECT * FROM quizzes WHERE id = ? AND (is_public = 1 OR host_id = ?)', [params.id, auth.user.id]) as any[];
    if (!src) return NextResponse.json({ error: 'Quiz not found or not public' }, { status: 404 });

    const newId = uuidv4();
    await pool.query('INSERT INTO quizzes (id, host_id, title, subject, grade_level, is_public) VALUES (?, ?, ?, ?, ?, 0)',
      [newId, auth.user.id, `${src.title} (forked)`, src.subject, src.grade_level]);

    const [questions] = await pool.query('SELECT * FROM questions WHERE quiz_id = ? ORDER BY order_index', [src.id]) as any[];
    for (const q of questions) {
      await pool.query(
        `INSERT INTO questions (id, quiz_id, order_index, type, question_text, image_url, options, correct_answer, explanation, time_limit_seconds, points, difficulty)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), newId, q.order_index, q.type, q.question_text, q.image_url, JSON.stringify(q.options), q.correct_answer, q.explanation, q.time_limit_seconds, q.points, q.difficulty]
      );
    }
    const [[quiz]] = await pool.query('SELECT * FROM quizzes WHERE id = ?', [newId]) as any[];
    return NextResponse.json(quiz, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
