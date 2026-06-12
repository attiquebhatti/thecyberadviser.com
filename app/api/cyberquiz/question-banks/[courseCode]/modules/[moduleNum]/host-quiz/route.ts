import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '@/lib/cyberquiz/db';
import { requireAuthUser } from '@/lib/cyberquiz/auth';

const COURSE_META: Record<string, { code: string }> = {
  'EDU210': { code: 'EDU-210' }, 'EDU220': { code: 'EDU-220' }, 'EDU330': { code: 'EDU-330' },
  'PRISMA-ACCESS': { code: 'PRISMA' }, 'PRISMA-SDWAN': { code: 'SD-WAN' },
  'XDR-ENGINEER': { code: 'XDR-ENG' }, 'XDR-ANALYST': { code: 'XDR-ANL' },
  'XSOAR': { code: 'XSOAR' }, 'XSIAM-ENGINEER': { code: 'XSIAM-E' }, 'XSIAM-ANALYST': { code: 'XSIAM-A' },
};

export async function POST(req: NextRequest, { params }: { params: { courseCode: string; moduleNum: string } }) {
  const auth = requireAuthUser(req);
  if ('error' in auth) return auth.error;

  const code = params.courseCode.toUpperCase();
  const moduleNum = parseInt(params.moduleNum);
  if (isNaN(moduleNum)) return NextResponse.json({ error: 'Invalid module number' }, { status: 400 });

  let count = 20;
  try { const body = await req.json(); count = Math.min(Math.max(parseInt(body.count) || 20, 5), 60); } catch { /* */ }

  try {
    const [allQs] = await pool.query(
      `SELECT * FROM question_banks WHERE course_code = ? AND module_num = ? ORDER BY RAND() LIMIT ?`,
      [code, moduleNum, count]
    ) as any[];

    if (!allQs.length) return NextResponse.json({ error: 'No questions found for this module' }, { status: 404 });

    const modName   = allQs[0].module_name || `Module ${moduleNum}`;
    const meta      = COURSE_META[code] || {};
    const quizId    = uuidv4();
    const quizTitle = `${meta.code || code} M${moduleNum}: ${modName} (${allQs.length} Qs)`;

    await pool.query(
      `INSERT INTO quizzes (id, host_id, title, subject, grade_level, is_public) VALUES (?, ?, ?, ?, ?, 0)`,
      [quizId, auth.user.id, quizTitle, 'Palo Alto Networks', modName]
    );

    for (let i = 0; i < allQs.length; i++) {
      const q = allQs[i];
      const options = [
        { text: q.option_a, is_correct: q.correct_letter === 'A' },
        { text: q.option_b, is_correct: q.correct_letter === 'B' },
        { text: q.option_c, is_correct: q.correct_letter === 'C' },
        { text: q.option_d, is_correct: q.correct_letter === 'D' },
      ];
      await pool.query(
        `INSERT INTO questions (id, quiz_id, type, question_text, options, correct_answer, explanation, time_limit_seconds, points, difficulty, order_index)
         VALUES (?, ?, 'multiple_choice', ?, ?, ?, ?, 30, 10, ?, ?)`,
        [uuidv4(), quizId, q.question_text, JSON.stringify(options), q.correct_text || '', q.explanation || '', q.difficulty || 'Intermediate', i]
      );
    }

    return NextResponse.json({ quiz_id: quizId, question_count: allQs.length, title: quizTitle }, { status: 201 });
  } catch (err: any) {
    console.error('host-quiz error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
