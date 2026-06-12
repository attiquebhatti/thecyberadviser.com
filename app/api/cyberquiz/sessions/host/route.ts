import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/cyberquiz/db';
import { requireAuthUser } from '@/lib/cyberquiz/auth';

export async function GET(req: NextRequest) {
  const auth = requireAuthUser(req);
  if ('error' in auth) return auth.error;
  try {
    const [rows] = await pool.query(
      `SELECT s.*, q.title AS quiz_title,
              (SELECT COUNT(*) FROM players p WHERE p.session_id = s.id) AS player_count
       FROM sessions s LEFT JOIN quizzes q ON q.id = s.quiz_id
       WHERE s.host_id = ? ORDER BY s.created_at DESC LIMIT 50`,
      [auth.user.id]
    ) as any[];
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
