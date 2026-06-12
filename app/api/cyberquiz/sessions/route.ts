import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '@/lib/cyberquiz/db';
import { requireAuthUser } from '@/lib/cyberquiz/auth';

const CHARSET = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
function generateJoinCode(len = 6) {
  let code = '';
  for (let i = 0; i < len; i++) code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  return code;
}
async function uniqueJoinCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateJoinCode();
    const [[row]] = await pool.query("SELECT id FROM sessions WHERE join_code = ? AND status IN ('lobby','active')", [code]) as any[];
    if (!row) return code;
  }
  throw new Error('Could not generate unique join code');
}

export async function POST(req: NextRequest) {
  const auth = requireAuthUser(req);
  if ('error' in auth) return auth.error;
  const { quiz_id, game_mode = 'classic_blitz', settings = {} } = await req.json();
  try {
    const join_code = await uniqueJoinCode();
    const id = uuidv4();
    await pool.query(
      'INSERT INTO sessions (id, quiz_id, host_id, join_code, game_mode, settings) VALUES (?, ?, ?, ?, ?, ?)',
      [id, quiz_id ?? null, auth.user.id, join_code, game_mode, JSON.stringify(settings)]
    );
    const [[session]] = await pool.query('SELECT * FROM sessions WHERE id = ?', [id]) as any[];
    return NextResponse.json(session, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
