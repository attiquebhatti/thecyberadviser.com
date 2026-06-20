import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { pool } from '@/lib/cyberquiz/db';
import { requireAdminUser } from '@/lib/chatbot/auth';
import { extractText, applyProductNameCorrections } from '@/lib/chatbot/extract';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

const ALLOWED = ['txt', 'vtt', 'pdf', 'docx'];

export async function POST(req: NextRequest) {
  const auth = requireAdminUser(req);
  if ('error' in auth) return auth.error;

  try {
    const form = await req.formData();
    const cohortId = parseInt(String(form.get('cohortId') || ''), 10);
    const sessionNumber = parseInt(String(form.get('sessionNumber') || ''), 10);
    const title = String(form.get('title') || '').trim();
    const file = form.get('file');

    if (isNaN(cohortId)) return NextResponse.json({ error: 'A course must be selected.' }, { status: 400 });
    if (isNaN(sessionNumber)) return NextResponse.json({ error: 'A session number is required.' }, { status: 400 });
    if (!(file instanceof File)) return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });

    // Validate the course exists.
    const [[course]] = await pool.query('SELECT id FROM atc_cohorts WHERE id = ?', [cohortId]) as any[];
    if (!course) return NextResponse.json({ error: 'Course not found.' }, { status: 404 });

    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED.includes(ext)) {
      return NextResponse.json({ error: `Unsupported file type .${ext}. Allowed: ${ALLOWED.join(', ')}` }, { status: 400 });
    }

    // Store the file outside public/, with a server-generated name (never user input).
    const uploadDir = path.join(process.cwd(), process.env.ATC_UPLOAD_DIR || 'uploads/chatbot', String(cohortId));
    await fs.mkdir(uploadDir, { recursive: true });
    const storedName = `${randomUUID()}.${ext}`;
    const filePath = path.join(uploadDir, storedName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    // Insert pending row.
    const [result] = await pool.query(
      `INSERT INTO atc_transcripts (cohort_id, session_number, title, file_name, file_path, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [cohortId, sessionNumber, title || file.name, file.name, filePath]
    ) as any[];
    const transcriptId = result.insertId;

    // Extract + correct text, then mark review_needed (no embedding until publish).
    try {
      const raw = await extractText(file, ext);
      const corrected = applyProductNameCorrections(raw);
      await pool.query(
        "UPDATE atc_transcripts SET raw_text = ?, status = 'review_needed' WHERE id = ?",
        [corrected, transcriptId]
      );
    } catch (err: any) {
      await pool.query(
        "UPDATE atc_transcripts SET status = 'failed', processing_error = ? WHERE id = ?",
        [String(err?.message || err).slice(0, 1000), transcriptId]
      );
      return NextResponse.json({ error: `Text extraction failed: ${err?.message || err}` }, { status: 500 });
    }

    const [[row]] = await pool.query('SELECT id, status, CHAR_LENGTH(raw_text) AS text_length FROM atc_transcripts WHERE id = ?', [transcriptId]) as any[];
    return NextResponse.json({ ok: true, transcript: row }, { status: 201 });
  } catch (err: any) {
    console.error('chatbot transcript upload error', err);
    return NextResponse.json({ error: err.message || 'Upload failed.' }, { status: 500 });
  }
}
