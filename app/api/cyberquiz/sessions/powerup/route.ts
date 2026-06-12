import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '@/lib/cyberquiz/db';

export async function POST(req: NextRequest) {
  const { session_id, player_id, powerup_type, cost, target_player_id } = await req.json();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[player]] = await conn.query('SELECT coins FROM players WHERE id = ?', [player_id]) as any[];
    if (!player || player.coins < cost) {
      await conn.rollback();
      return NextResponse.json({ error: 'Insufficient coins' }, { status: 400 });
    }
    await conn.query('UPDATE players SET coins = coins - ? WHERE id = ?', [cost, player_id]);
    await conn.query(
      'INSERT INTO powerup_events (id, session_id, player_id, powerup_type, cost, target_player_id) VALUES (?, ?, ?, ?, ?, ?)',
      [uuidv4(), session_id, player_id, powerup_type, cost, target_player_id ?? null]
    );
    await conn.commit();
    const [[updated]] = await pool.query('SELECT coins FROM players WHERE id = ?', [player_id]) as any[];
    return NextResponse.json({ ok: true, coins: updated.coins });
  } catch (err: any) {
    await conn.rollback();
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    conn.release();
  }
}
