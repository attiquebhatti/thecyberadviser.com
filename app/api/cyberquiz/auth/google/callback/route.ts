import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '@/lib/cyberquiz/db';
import { makeToken } from '@/lib/cyberquiz/auth';

const siteUrl  = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
const frontUrl = () => siteUrl();

async function findOrCreate(email: string, displayName: string) {
  const clean = email.toLowerCase().trim();
  const [[existing]] = await pool.query('SELECT * FROM profiles WHERE email = ?', [clean]) as any[];
  if (existing) return existing;
  const id = uuidv4();
  const name = displayName.trim() || clean.split('@')[0];
  await pool.query('INSERT INTO profiles (id, email, display_name) VALUES (?, ?, ?)', [id, clean, name]);
  const [[user]] = await pool.query('SELECT * FROM profiles WHERE id = ?', [id]) as any[];
  return user;
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.redirect(`${frontUrl()}/tools/cyberquiz/auth?oauthError=google_denied`);

  try {
    const cbUrl = `${siteUrl()}/api/cyberquiz/auth/google/callback`;
    const tok = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, grant_type: 'authorization_code', client_id: process.env.CQ_GOOGLE_CLIENT_ID!, client_secret: process.env.CQ_GOOGLE_CLIENT_SECRET!, redirect_uri: cbUrl }).toString(),
    }).then(r => r.json());

    if (!tok.access_token) return NextResponse.redirect(`${frontUrl()}/tools/cyberquiz/auth?oauthError=google_token`);

    const info = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo`, {
      headers: { Authorization: `Bearer ${tok.access_token}` },
    }).then(r => r.json());

    const user = await findOrCreate(info.email, info.name || '');
    const token = makeToken(user);
    return NextResponse.redirect(`${frontUrl()}/tools/cyberquiz/auth?oauthToken=${encodeURIComponent(token)}`);
  } catch (err) {
    console.error('[Google OAuth callback error]', err);
    return NextResponse.redirect(`${frontUrl()}/tools/cyberquiz/auth?oauthError=google_failed`);
  }
}
