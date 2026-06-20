import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { pool } from '@/lib/cyberquiz/db';
import { requireAdminUser } from '@/lib/chatbot/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET — full transcript detail including raw_text (for the review/edit screen).
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdminUser(req);
  if ('error' in auth) return auth.error;

  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid transcript id.' }, { status: 400 });

  const [[row]] = await pool.query(
    `SELECT t.*, COUNT(ch.id) AS chunk_count
     FROM atc_transcripts t LEFT JOIN atc_chunks ch ON ch.transcript_id = t.id
     WHERE t.id = ? GROUP BY t.id`,
    [id]
  ) as any[];
  if (!row) return NextResponse.json({ error: 'Transcript not found.' }, { status: 404 });
  return NextResponse.json(row);
}

// PATCH — edit the extracted text or title before publishing.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdminUser(req);
  if ('error' in auth) return auth.error;

  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid transcript id.' }, { status: 400 });

  try {
    const body = await req.json();
    const fields: string[] = [];
    const values: any[] = [];
    if (body.rawText !== undefined)       { fields.push('raw_text = ?');       values.push(String(body.rawText)); }
    if (body.title !== undefined)         { fields.push('title = ?');          values.push(String(body.title).trim()); }
    if (body.sessionNumber !== undefined) { fields.push('session_number = ?'); values.push(parseInt(body.sessionNumber, 10)); }
    if (fields.length === 0) return NextResponse.json({ error: 'No fields to update.' }, { status: 400 });

    values.push(id);
    await pool.query(`UPDATE atc_transcripts SET ${fields.join(', ')} WHERE id = ?`, values);

    const [[row]] = await pool.query('SELECT id, status, title, session_number, CHAR_LENGTH(raw_text) AS text_length FROM atc_transcripts WHERE id = ?', [id]) as any[];
    return NextResponse.json(row);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Update failed.' }, { status: 500 });
  }
}

// DELETE — remove the transcript, its file on disk, and (via FK cascade) its chunks.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdminUser(req);
  if ('error' in auth) return auth.error;

  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid transcript id.' }, { status: 400 });

  try {
    const [[row]] = await pool.query('SELECT file_path FROM atc_transcripts WHERE id = ?', [id]) as any[];
    if (row?.file_path) {
      await fs.unlink(row.file_path).catch(() => { /* file may already be gone */ });
    }
    await pool.query('DELETE FROM atc_transcripts WHERE id = ?', [id]);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Delete failed.' }, { status: 500 });
  }
}
