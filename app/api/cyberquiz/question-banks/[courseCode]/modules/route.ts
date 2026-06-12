import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/cyberquiz/db';

export async function GET(_req: NextRequest, { params }: { params: { courseCode: string } }) {
  const code = params.courseCode.toUpperCase();
  try {
    const [rows] = await pool.query(
      `SELECT module_num, module_name, COUNT(*) AS total_questions
       FROM question_banks
       WHERE course_code = ? AND module_num IS NOT NULL
       GROUP BY module_num, module_name
       ORDER BY module_num`,
      [code]
    ) as any[];
    return NextResponse.json(rows);
  } catch (err: any) {
    if (err.code === 'ER_NO_SUCH_TABLE' || err.code === 'ER_BAD_FIELD_ERROR') return NextResponse.json([]);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
