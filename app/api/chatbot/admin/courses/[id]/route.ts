import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/cyberquiz/db';
import { requireAdminUser } from '@/lib/chatbot/auth';

export const dynamic = 'force-dynamic';

// PATCH — update editable fields of a course.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdminUser(req);
  if ('error' in auth) return auth.error;

  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid course id.' }, { status: 400 });

  try {
    const body = await req.json();
    const fields: string[] = [];
    const values: any[] = [];

    if (body.name !== undefined)           { fields.push('name = ?');            values.push(String(body.name).trim()); }
    if (body.courseCode !== undefined)     { fields.push('course_code = ?');     values.push(String(body.courseCode).trim().toUpperCase()); }
    if (body.instructorName !== undefined) { fields.push('instructor_name = ?'); values.push(String(body.instructorName).trim()); }
    if (body.isListed !== undefined)       { fields.push('is_listed = ?');       values.push(body.isListed ? 1 : 0); }
    if (body.expiresAt !== undefined)      { fields.push('expires_at = ?');      values.push(body.expiresAt ? new Date(body.expiresAt) : null); }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update.' }, { status: 400 });
    }

    values.push(id);
    await pool.query(`UPDATE atc_cohorts SET ${fields.join(', ')} WHERE id = ?`, values);

    const [[course]] = await pool.query('SELECT * FROM atc_cohorts WHERE id = ?', [id]) as any[];
    if (!course) return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
    return NextResponse.json(course);
  } catch (err: any) {
    console.error('chatbot admin update course error', err);
    return NextResponse.json({ error: err.message || 'Failed to update course.' }, { status: 500 });
  }
}

// DELETE — remove a course (cascades to its transcripts, chunks, and logs via FKs).
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdminUser(req);
  if ('error' in auth) return auth.error;

  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid course id.' }, { status: 400 });

  try {
    await pool.query('DELETE FROM atc_cohorts WHERE id = ?', [id]);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('chatbot admin delete course error', err);
    return NextResponse.json({ error: err.message || 'Failed to delete course.' }, { status: 500 });
  }
}
