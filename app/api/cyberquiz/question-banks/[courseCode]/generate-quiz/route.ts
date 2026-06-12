import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '@/lib/cyberquiz/db';
import { requireAuthUser } from '@/lib/cyberquiz/auth';

const COURSE_META: Record<string, { code?: string }> = {
  'EDU210': { code: 'EDU-210' }, 'EDU220': { code: 'EDU-220' }, 'EDU330': { code: 'EDU-330' },
  'PRISMA-ACCESS': { code: 'PRISMA' }, 'PRISMA-SDWAN': { code: 'SD-WAN' },
  'XDR-ENGINEER': { code: 'XDR-ENG' }, 'XDR-ANALYST': { code: 'XDR-ANL' },
  'XSOAR': { code: 'XSOAR' }, 'XSIAM-ENGINEER': { code: 'XSIAM-E' }, 'XSIAM-ANALYST': { code: 'XSIAM-A' },
};

export async function POST(req: NextRequest, { params }: { params: { courseCode: string } }) {
  const auth = requireAuthUser(req);
  if ('error' in auth) return auth.error;

  const { count = 20, difficulty } = await req.json();
  const questionCount = Math.min(Math.max(parseInt(count) || 20, 5), 100);
  const courseCode = params.courseCode.toUpperCase();

  const conditions = ['course_code = ?'];
  const qParams: unknown[] = [courseCode];
  if (difficulty && difficulty !== 'All') { conditions.push('difficulty = ?'); qParams.push(difficulty); }

  try {
    const [allQs] = await pool.query(
      `SELECT * FROM question_banks WHERE ${conditions.join(' AND ')} ORDER BY RAND() LIMIT ?`,
      [...qParams, questionCount]
    ) as any[];
    if (allQs.length === 0)
      return NextResponse.json({ error: 'No questions found for that course / difficulty' }, { status: 404 });

    const meta = COURSE_META[courseCode] || {};
    const quizId    = uuidv4();
    const quizTitle = `${meta.code || courseCode} — ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} (${allQs.length} Qs)`;

    await pool.query(
      'INSERT INTO quizzes (id, host_id, title, subject, grade_level, is_public) VALUES (?, ?, ?, ?, ?, 0)',
      [quizId, auth.user.id, quizTitle, 'Palo Alto Networks', allQs[0]?.course_name || courseCode]
    );

    for (let i = 0; i < allQs.length; i++) {
      const q = allQs[i];
      await pool.query(
        `INSERT INTO questions (id, quiz_id, type, question_text, options, correct_answer, explanation, time_limit_seconds, points, difficulty, order_index)
         VALUES (?, ?, 'multiple_choice', ?, ?, ?, ?, 30, 10, ?, ?)`,
        [uuidv4(), quizId, q.question_text,
         JSON.stringify([
           { text: q.option_a, is_correct: q.correct_letter === 'A' },
           { text: q.option_b, is_correct: q.correct_letter === 'B' },
           { text: q.option_c, is_correct: q.correct_letter === 'C' },
           { text: q.option_d, is_correct: q.correct_letter === 'D' },
         ]),
         q.correct_text || '', q.explanation || '', q.difficulty || 'Intermediate', i]
      );
    }

    const [[newQuiz]] = await pool.query('SELECT * FROM quizzes WHERE id = ?', [quizId]) as any[];
    return NextResponse.json({ ...newQuiz, question_count: allQs.length }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
