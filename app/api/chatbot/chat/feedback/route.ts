import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/cyberquiz/db';
import { requireAuthUser } from '@/lib/chatbot/auth';

export const dynamic = 'force-dynamic';

// Thumbs up/down on a logged answer. Verifies the log belongs to the requesting user.
export async function POST(req: NextRequest) {
  const auth = requireAuthUser(req);
  if ('error' in auth) return auth.error;

  try {
    const { logId, feedback, feedbackText } = await req.json();
    const id = parseInt(String(logId), 10);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid log id.' }, { status: 400 });
    if (feedback !== 1 && feedback !== -1) return NextResponse.json({ error: 'feedback must be 1 or -1.' }, { status: 400 });

    const [[row]] = await pool.query('SELECT user_id FROM atc_question_logs WHERE id = ?', [id]) as any[];
    if (!row) return NextResponse.json({ error: 'Log entry not found.' }, { status: 404 });
    if (row.user_id !== auth.user.id) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

    await pool.query(
      'UPDATE atc_question_logs SET feedback = ?, feedback_text = ? WHERE id = ?',
      [feedback, feedbackText ? String(feedbackText).slice(0, 1000) : null, id]
    );
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Feedback failed.' }, { status: 500 });
  }
}
