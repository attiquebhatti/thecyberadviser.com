import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/cyberquiz/db';

export async function GET(_req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const [[session]] = await pool.query(
      "SELECT * FROM sessions WHERE join_code = ? AND status IN ('lobby','active')",
      [params.code.toUpperCase()]
    ) as any[];
    if (!session) return NextResponse.json({ error: 'Session not found or already ended' }, { status: 404 });
    return NextResponse.json(session);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
