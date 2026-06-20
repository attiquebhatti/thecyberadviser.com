import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/cyberquiz/db';
import { requireAuthUser } from '@/lib/chatbot/auth';

export const dynamic = 'force-dynamic';

// Open catalog — any logged-in site user (same account as CyberQuiz) can see and
// chat with any listed course. No enrollment code, no per-user gating.
export async function GET(req: NextRequest) {
  const auth = requireAuthUser(req);
  if ('error' in auth) return auth.error;

  // Fixed display order: EDU track → Cortex XDR → XSOAR → XSIAM → Prisma SASE.
  // Unlisted/new course codes fall to the end (high FIELD index = 0 sorts first,
  // so anything not listed gets pushed after via the IS NULL ordering trick).
  const [rows] = await pool.query(
    `SELECT c.id, c.name, c.course_code, c.instructor_name,
            COUNT(DISTINCT t.id) AS session_count
     FROM atc_cohorts c
     LEFT JOIN atc_transcripts t ON t.cohort_id = c.id AND t.status = 'published'
     WHERE c.is_listed = 1
     GROUP BY c.id
     ORDER BY FIELD(c.course_code,
       'EDU-210','EDU-220','EDU-330',
       'XDR-ENGINEER','XDR-ANALYST',
       'XSOAR',
       'XSIAM-ENGINEER','XSIAM-ANALYST',
       'PRISMA-ACCESS','PRISMA-SDWAN') = 0,
       FIELD(c.course_code,
       'EDU-210','EDU-220','EDU-330',
       'XDR-ENGINEER','XDR-ANALYST',
       'XSOAR',
       'XSIAM-ENGINEER','XSIAM-ANALYST',
       'PRISMA-ACCESS','PRISMA-SDWAN'),
       c.created_at DESC`
  ) as any[];

  return NextResponse.json(rows);
}
