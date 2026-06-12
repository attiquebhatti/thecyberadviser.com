import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/cyberquiz/db';
import { requireAuthUser } from '@/lib/cyberquiz/auth';

export async function GET(req: NextRequest, { params }: { params: { quizId: string } }) {
  const auth = requireAuthUser(req);
  if ('error' in auth) return auth.error;
  try {
    const [rows] = await pool.query('SELECT * FROM questions WHERE quiz_id = ? ORDER BY order_index', [params.quizId]) as any[];
    const parsed = rows.map((r: any) => ({
      ...r,
      options: r.options ? (typeof r.options === 'string' ? JSON.parse(r.options) : r.options) : [],
    }));
    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
