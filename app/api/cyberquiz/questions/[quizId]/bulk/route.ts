import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '@/lib/cyberquiz/db';
import { requireAuthUser } from '@/lib/cyberquiz/auth';

export async function POST(req: NextRequest, { params }: { params: { quizId: string } }) {
  const auth = requireAuthUser(req);
  if ('error' in auth) return auth.error;

  const { questions } = await req.json();
  if (!Array.isArray(questions))
    return NextResponse.json({ error: 'questions must be an array' }, { status: 400 });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[quiz]] = await conn.query('SELECT id FROM quizzes WHERE id = ? AND host_id = ?', [params.quizId, auth.user.id]) as any[];
    if (!quiz) { await conn.rollback(); return NextResponse.json({ error: 'Quiz not found' }, { status: 404 }); }

    await conn.query('DELETE FROM questions WHERE quiz_id = ?', [params.quizId]);

    const saved = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const id = q.id && q.id !== 'new' ? q.id : uuidv4();
      await conn.query(
        `INSERT INTO questions (id, quiz_id, order_index, type, question_text, image_url, options, correct_answer, explanation, time_limit_seconds, points, difficulty)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE order_index=VALUES(order_index), type=VALUES(type), question_text=VALUES(question_text),
           image_url=VALUES(image_url), options=VALUES(options), correct_answer=VALUES(correct_answer),
           explanation=VALUES(explanation), time_limit_seconds=VALUES(time_limit_seconds), points=VALUES(points), difficulty=VALUES(difficulty)`,
        [id, params.quizId, i, q.type || 'multiple_choice', q.question_text || '', q.image_url ?? null,
         q.options ? JSON.stringify(q.options) : null, q.correct_answer ?? null, q.explanation ?? null,
         q.time_limit_seconds ?? 20, q.points ?? 1000, q.difficulty ?? 'medium']
      );
      saved.push({ ...q, id, order_index: i });
    }
    await conn.commit();
    return NextResponse.json(saved);
  } catch (err: any) {
    await conn.rollback();
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    conn.release();
  }
}
