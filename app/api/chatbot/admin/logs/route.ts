import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/cyberquiz/db';
import { requireAdminUser } from '@/lib/chatbot/auth';

export const dynamic = 'force-dynamic';

// GET — filterable question logs across all courses.
// Filters: ?course=<id> &feedback=1|-1|0(none) &from=YYYY-MM-DD &to=YYYY-MM-DD &limit &offset
export async function GET(req: NextRequest) {
  const auth = requireAdminUser(req);
  if ('error' in auth) return auth.error;

  const sp = req.nextUrl.searchParams;
  const where: string[] = [];
  const params: any[] = [];

  const course = sp.get('course');
  if (course) { where.push('q.cohort_id = ?'); params.push(parseInt(course, 10)); }

  const feedback = sp.get('feedback');
  if (feedback === '1' || feedback === '-1') { where.push('q.feedback = ?'); params.push(parseInt(feedback, 10)); }
  else if (feedback === '0') { where.push('q.feedback IS NULL'); }

  const from = sp.get('from');
  if (from) { where.push('q.created_at >= ?'); params.push(`${from} 00:00:00`); }
  const to = sp.get('to');
  if (to) { where.push('q.created_at <= ?'); params.push(`${to} 23:59:59`); }

  const limit = Math.min(parseInt(sp.get('limit') || '50', 10), 200);
  const offset = parseInt(sp.get('offset') || '0', 10);
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM atc_question_logs q ${whereSql}`, params
  ) as any[];

  const [rows] = await pool.query(
    `SELECT q.id, q.cohort_id, q.user_id, q.question, q.response, q.sources,
            q.feedback, q.feedback_text, q.created_at,
            c.name AS course_name, c.course_code,
            p.email AS user_email, p.display_name AS user_name
     FROM atc_question_logs q
     LEFT JOIN atc_cohorts c ON c.id = q.cohort_id
     LEFT JOIN profiles p ON p.id = q.user_id
     ${whereSql}
     ORDER BY q.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  ) as any[];

  return NextResponse.json({ total, rows });
}
