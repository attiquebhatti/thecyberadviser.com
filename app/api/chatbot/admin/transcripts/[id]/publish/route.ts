import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/cyberquiz/db';
import { requireAdminUser } from '@/lib/chatbot/auth';
import { publishTranscript } from '@/lib/chatbot/ingest';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

// POST — kick off chunk + embed + store. Returns immediately with status 'processing';
// the UI polls GET /transcripts/[id] to see it flip to 'published' or 'failed'.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdminUser(req);
  if ('error' in auth) return auth.error;

  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid transcript id.' }, { status: 400 });

  const [[t]] = await pool.query('SELECT id, raw_text FROM atc_transcripts WHERE id = ?', [id]) as any[];
  if (!t) return NextResponse.json({ error: 'Transcript not found.' }, { status: 404 });
  if (!t.raw_text || !t.raw_text.trim()) {
    return NextResponse.json({ error: 'Transcript has no text to publish.' }, { status: 400 });
  }

  // Embeddings run locally (Transformers.js) — no API key required to publish.
  await publishTranscript(id);
  return NextResponse.json({ ok: true, status: 'processing' });
}
