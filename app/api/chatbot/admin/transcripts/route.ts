import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/cyberquiz/db';
import { requireAdminUser } from '@/lib/chatbot/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET — list transcripts, optionally filtered by ?course=<id>.
export async function GET(req: NextRequest) {
  const auth = requireAdminUser(req);
  if ('error' in auth) return auth.error;

  const courseId = req.nextUrl.searchParams.get('course');
  const where = courseId ? 'WHERE t.cohort_id = ?' : '';
  const params = courseId ? [parseInt(courseId, 10)] : [];

  const [rows] = await pool.query(
    `SELECT t.id, t.cohort_id, t.session_number, t.title, t.file_name, t.status,
            t.processing_error, t.created_at, t.processed_at,
            CHAR_LENGTH(t.raw_text) AS text_length,
            COUNT(ch.id) AS chunk_count
     FROM atc_transcripts t
     LEFT JOIN atc_chunks ch ON ch.transcript_id = t.id
     ${where}
     GROUP BY t.id
     ORDER BY t.session_number ASC, t.created_at ASC`,
    params
  ) as any[];

  return NextResponse.json(rows);
}
