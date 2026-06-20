import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/cyberquiz/db';
import { requireAdminUser } from '@/lib/chatbot/auth';

export const dynamic = 'force-dynamic';

// GET — list ALL courses (including unlisted) for the admin dashboard.
export async function GET(req: NextRequest) {
  const auth = requireAdminUser(req);
  if ('error' in auth) return auth.error;

  const [rows] = await pool.query(
    `SELECT c.id, c.name, c.course_code, c.instructor_name, c.is_listed,
            c.starts_at, c.expires_at, c.created_at,
            COUNT(DISTINCT t.id)                                          AS transcript_count,
            COUNT(DISTINCT CASE WHEN t.status='published' THEN t.id END)  AS published_count
     FROM atc_cohorts c
     LEFT JOIN atc_transcripts t ON t.cohort_id = c.id
     GROUP BY c.id
     ORDER BY c.created_at DESC`
  ) as any[];

  return NextResponse.json(rows);
}

// POST — create a new course.
export async function POST(req: NextRequest) {
  const auth = requireAdminUser(req);
  if ('error' in auth) return auth.error;

  try {
    const { name, courseCode, instructorName, expiresAt, isListed } = await req.json();

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: 'Course name is required.' }, { status: 400 });
    }
    if (!courseCode || !String(courseCode).trim()) {
      return NextResponse.json({ error: 'Course code is required.' }, { status: 400 });
    }

    const [result] = await pool.query(
      `INSERT INTO atc_cohorts (name, course_code, instructor_name, is_listed, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        String(name).trim(),
        String(courseCode).trim().toUpperCase(),
        (instructorName && String(instructorName).trim()) || 'Attique Bhatti',
        isListed === false ? 0 : 1,
        expiresAt ? new Date(expiresAt) : null,
      ]
    ) as any[];

    const [[course]] = await pool.query('SELECT * FROM atc_cohorts WHERE id = ?', [result.insertId]) as any[];
    return NextResponse.json(course, { status: 201 });
  } catch (err: any) {
    console.error('chatbot admin create course error', err);
    return NextResponse.json({ error: err.message || 'Failed to create course.' }, { status: 500 });
  }
}
