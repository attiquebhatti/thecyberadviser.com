import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/cyberquiz/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const secret = process.env.CQ_SEED_SECRET;
  if (!secret || req.headers.get('x-seed-secret') !== secret)
    return NextResponse.json({ error: 'Forbidden — set CQ_SEED_SECRET and pass as x-seed-secret header' }, { status: 403 });

  let questions: any[];
  let truncate = true;
  try {
    const body = await req.json();
    questions = body.questions;
    if (body.truncate === false) truncate = false;
    if (!Array.isArray(questions)) throw new Error('questions must be an array');
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Provide { questions: [...] } in the request body' }, { status: 400 });
  }

  try {
    // Ensure base table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS question_banks (
        id               INT          AUTO_INCREMENT PRIMARY KEY,
        course_code      VARCHAR(32)  NOT NULL,
        course_name      VARCHAR(128) NOT NULL,
        question_bank_id VARCHAR(16)  NOT NULL,
        difficulty       VARCHAR(32)  NOT NULL DEFAULT 'Intermediate',
        domain           VARCHAR(255) NOT NULL DEFAULT '',
        question_text    TEXT         NOT NULL,
        option_a         TEXT         NOT NULL,
        option_b         TEXT         NOT NULL,
        option_c         TEXT         NOT NULL,
        option_d         TEXT         NOT NULL,
        correct_letter   CHAR(1)      NOT NULL,
        correct_text     TEXT         NOT NULL DEFAULT '',
        explanation      TEXT         NOT NULL DEFAULT '',
        reference_url    VARCHAR(512) NOT NULL DEFAULT '',
        created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_course_code (course_code),
        INDEX idx_difficulty  (difficulty)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    // Add module columns if missing
    const [[modNumCol]] = await pool.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'question_banks' AND COLUMN_NAME = 'module_num'`
    ) as any[];
    if (!modNumCol) {
      await pool.query(`ALTER TABLE question_banks ADD COLUMN module_num  INT          NULL DEFAULT NULL`);
      await pool.query(`ALTER TABLE question_banks ADD COLUMN module_name VARCHAR(255) NOT NULL DEFAULT ''`);
      await pool.query(`ALTER TABLE question_banks ADD INDEX idx_module_num (module_num)`);
    }

    // Delete only module rows on first chunk (keep existing whole-course questions)
    if (truncate) await pool.query('DELETE FROM question_banks WHERE module_num IS NOT NULL');

    const BATCH = 50;
    let inserted = 0;
    for (let i = 0; i < questions.length; i += BATCH) {
      const batch  = questions.slice(i, i + BATCH);
      const values = batch.map((q: any) => [
        q.course_code, q.course_name, q.question_bank_id || '',
        q.difficulty || 'Intermediate', q.domain || '',
        q.question_text, q.option_a, q.option_b, q.option_c, q.option_d,
        q.correct_letter, q.correct_text || '', q.explanation || '', q.reference_url || '',
        q.module_num, q.module_name || '',
      ]);
      await pool.query(
        `INSERT INTO question_banks
           (course_code, course_name, question_bank_id, difficulty, domain,
            question_text, option_a, option_b, option_c, option_d,
            correct_letter, correct_text, explanation, reference_url,
            module_num, module_name)
         VALUES ?`,
        [values]
      );
      inserted += batch.length;
    }

    return NextResponse.json({ ok: true, inserted, message: `Seeded ${inserted} module questions.` });
  } catch (err: any) {
    console.error('seed-modules error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
