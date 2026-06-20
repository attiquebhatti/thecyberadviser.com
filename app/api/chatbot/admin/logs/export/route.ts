import { NextRequest } from 'next/server';
import { pool } from '@/lib/cyberquiz/db';
import { requireAdminUser } from '@/lib/chatbot/auth';

export const dynamic = 'force-dynamic';

function csvCell(v: any): string {
  const s = v === null || v === undefined ? '' : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

// GET — same filters as the logs list, streamed as a CSV download.
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
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT q.created_at, c.course_code, c.name AS course_name,
            p.email AS user_email, q.question, q.response, q.feedback, q.feedback_text
     FROM atc_question_logs q
     LEFT JOIN atc_cohorts c ON c.id = q.cohort_id
     LEFT JOIN profiles p ON p.id = q.user_id
     ${whereSql}
     ORDER BY q.created_at DESC`,
    params
  ) as any[];

  const header = ['Date', 'Course Code', 'Course', 'User Email', 'Question', 'Response', 'Feedback', 'Feedback Text'];
  const lines = [header.map(csvCell).join(',')];
  for (const r of rows) {
    lines.push([
      r.created_at, r.course_code, r.course_name, r.user_email,
      r.question, r.response,
      r.feedback === 1 ? 'up' : r.feedback === -1 ? 'down' : '',
      r.feedback_text,
    ].map(csvCell).join(','));
  }
  const csv = '﻿' + lines.join('\r\n'); // BOM for Excel UTF-8

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="chatbot-logs-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
