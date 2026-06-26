import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/cyberquiz/db';
import { getLocalRowsByCourse } from '@/lib/cyberquiz/local-question-bank';

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
    if (rows.length > 0) return NextResponse.json(rows);

    const localRows = getLocalRowsByCourse(code);
    const modules = [...new Map(localRows.map((row) => [
      row.module_num,
      {
        module_num: row.module_num,
        module_name: row.module_name,
        total_questions: localRows.filter((item) => item.module_num === row.module_num).length,
      },
    ])).values()].sort((a, b) => a.module_num - b.module_num);
    return NextResponse.json(modules);
  } catch (err: any) {
    if (err.code === 'ER_NO_SUCH_TABLE' || err.code === 'ER_BAD_FIELD_ERROR') return NextResponse.json([]);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
