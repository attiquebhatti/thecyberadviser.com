import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/cyberquiz/db';
import { requireAuthUser } from '@/lib/chatbot/auth';

export const dynamic = 'force-dynamic';

// Open catalog — any logged-in site user (same account as CyberQuiz) can see and
// chat with any listed course. No enrollment code, no per-user gating.
export async function GET(req: NextRequest) {
  const auth = requireAuthUser(req);
  if ('error' in auth) return auth.error;

  const [rows] = await pool.query(
    `SELECT c.id, c.name, c.course_code, c.instructor_name,
            COUNT(DISTINCT t.id) AS session_count
     FROM atc_cohorts c
     LEFT JOIN atc_transcripts t ON t.cohort_id = c.id AND t.status = 'published'
     WHERE c.is_listed = 1
     GROUP BY c.id
     ORDER BY c.created_at DESC`
  ) as any[];

  return NextResponse.json(rows);
}
