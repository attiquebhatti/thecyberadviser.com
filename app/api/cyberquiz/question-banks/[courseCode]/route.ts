import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/cyberquiz/db';
import { requireAuthUser } from '@/lib/cyberquiz/auth';

export async function GET(req: NextRequest, { params }: { params: { courseCode: string } }) {
  const auth = requireAuthUser(req);
  if ('error' in auth) return auth.error;

  const difficulty = req.nextUrl.searchParams.get('difficulty');
  const limit  = parseInt(req.nextUrl.searchParams.get('limit')  ?? '50');
  const offset = parseInt(req.nextUrl.searchParams.get('offset') ?? '0');

  const conditions = ['course_code = ?'];
  const qParams: unknown[] = [params.courseCode.toUpperCase()];
  if (difficulty && difficulty !== 'All') { conditions.push('difficulty = ?'); qParams.push(difficulty); }
  const where = conditions.join(' AND ');

  try {
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM question_banks WHERE ${where}`, qParams) as any[];
    const [questions] = await pool.query(
      `SELECT id, question_bank_id, difficulty, domain, question_text, option_a, option_b, option_c, option_d, correct_letter, explanation
       FROM question_banks WHERE ${where} ORDER BY question_bank_id LIMIT ? OFFSET ?`,
      [...qParams, limit, offset]
    ) as any[];
    return NextResponse.json({ total, questions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
