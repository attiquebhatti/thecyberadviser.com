import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/cyberquiz/db';

export async function POST(req: NextRequest) {
  const secret = process.env.CQ_SEED_SECRET;
  if (!secret || req.headers.get('x-seed-secret') !== secret)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { questions } = await req.json();
  if (!Array.isArray(questions))
    return NextResponse.json({ error: 'Provide { questions: [...] } in the request body' }, { status: 400 });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS question_banks (
        id INT AUTO_INCREMENT PRIMARY KEY, course_code VARCHAR(32) NOT NULL,
        course_name VARCHAR(128) NOT NULL, question_bank_id VARCHAR(16) NOT NULL,
        difficulty VARCHAR(32) NOT NULL DEFAULT 'Intermediate', domain VARCHAR(255) NOT NULL DEFAULT '',
        question_text TEXT NOT NULL, option_a TEXT NOT NULL, option_b TEXT NOT NULL,
        option_c TEXT NOT NULL, option_d TEXT NOT NULL, correct_letter CHAR(1) NOT NULL,
        correct_text TEXT NOT NULL DEFAULT '', explanation TEXT NOT NULL DEFAULT '',
        reference_url VARCHAR(512) NOT NULL DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_course_code (course_code), INDEX idx_difficulty (difficulty)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await pool.query('DELETE FROM question_banks');

    const BATCH = 50;
    let inserted = 0;
    for (let i = 0; i < questions.length; i += BATCH) {
      const batch = questions.slice(i, i + BATCH);
      const values = batch.map((q: any) => [
        q.course_code, q.course_name, q.question_bank_id,
        q.difficulty || 'Intermediate', q.domain || '',
        q.question_text, q.option_a, q.option_b, q.option_c, q.option_d,
        q.correct_letter, q.correct_text || '', q.explanation || '', q.reference_url || '',
      ]);
      await pool.query(
        `INSERT INTO question_banks (course_code,course_name,question_bank_id,difficulty,domain,question_text,option_a,option_b,option_c,option_d,correct_letter,correct_text,explanation,reference_url) VALUES ?`,
        [values]
      );
      inserted += batch.length;
    }
    return NextResponse.json({ ok: true, inserted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
