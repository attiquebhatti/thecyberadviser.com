import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/cyberquiz/db';

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get('search');
  const limit  = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '48'), 100);
  const s = search ? `%${String(search).slice(0, 100)}%` : null;

  try {
    const [rows] = s
      ? await pool.query(
          `SELECT q.id, q.title, q.subject, q.grade_level, q.play_count, q.created_at,
                  p.display_name AS host_name,
                  (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) AS question_count
           FROM quizzes q JOIN profiles p ON p.id = q.host_id
           WHERE q.is_public = 1 AND (q.title LIKE ? OR q.subject LIKE ?)
           ORDER BY q.play_count DESC, q.created_at DESC LIMIT ?`, [s, s, limit]
        ) as any[]
      : await pool.query(
          `SELECT q.id, q.title, q.subject, q.grade_level, q.play_count, q.created_at,
                  p.display_name AS host_name,
                  (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) AS question_count
           FROM quizzes q JOIN profiles p ON p.id = q.host_id
           WHERE q.is_public = 1 ORDER BY q.play_count DESC, q.created_at DESC LIMIT ?`, [limit]
        ) as any[];
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
