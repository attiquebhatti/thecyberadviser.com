import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/cyberquiz/db';
import { requireAuthUser } from '@/lib/cyberquiz/auth';

export async function GET(req: NextRequest, { params }: { params: { courseCode: string; moduleNum: string } }) {
  const auth = requireAuthUser(req);
  if ('error' in auth) return auth.error;

  const code = params.courseCode.toUpperCase();
  const moduleNum = parseInt(params.moduleNum);
  if (isNaN(moduleNum)) return NextResponse.json({ error: 'Invalid module number' }, { status: 400 });

  try {
    const [questions] = await pool.query(
      `SELECT id, module_num, module_name, difficulty, question_text,
              option_a, option_b, option_c, option_d, correct_letter, explanation
       FROM question_banks
       WHERE course_code = ? AND module_num = ?
       ORDER BY question_bank_id`,
      [code, moduleNum]
    ) as any[];

    if (!questions.length) return NextResponse.json({ error: 'No questions found for this module' }, { status: 404 });
    return NextResponse.json({ questions, module_name: questions[0].module_name });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
