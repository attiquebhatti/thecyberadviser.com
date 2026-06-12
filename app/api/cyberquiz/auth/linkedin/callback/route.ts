import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '@/lib/cyberquiz/db';
import { makeToken } from '@/lib/cyberquiz/auth';

const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

async function findOrCreate(email: string, displayName: string) {
  const clean = email.toLowerCase().trim();
  const [[existing]] = await pool.query('SELECT * FROM profiles WHERE email = ?', [clean]) as any[];
  if (existing) return existing;
  const id = uuidv4();
  await pool.query('INSERT INTO profiles (id, email, display_name) VALUES (?, ?, ?)', [id, clean, displayName.trim() || clean.split('@')[0]]);
  const [[user]] = await pool.query('SELECT * FROM profiles WHERE id = ?', [id]) as any[];
  return user;
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.redirect(`${siteUrl()}/tools/cyberquiz/auth?oauthError=linkedin_denied`);

  try {
    const cbUrl = `${siteUrl()}/api/cyberquiz/auth/linkedin/callback`;
    const tok = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'authorization_code', code, client_id: process.env.CQ_LINKEDIN_CLIENT_ID!, client_secret: process.env.CQ_LINKEDIN_CLIENT_SECRET!, redirect_uri: cbUrl }).toString(),
    }).then(r => r.json());
    if (!tok.access_token) return NextResponse.redirect(`${siteUrl()}/tools/cyberquiz/auth?oauthError=linkedin_token`);

    const info = await fetch('https://api.linkedin.com/v2/userinfo', { headers: { Authorization: `Bearer ${tok.access_token}` } }).then(r => r.json());
    const name = info.name || `${info.given_name || ''} ${info.family_name || ''}`.trim();
    const user = await findOrCreate(info.email, name);
    return NextResponse.redirect(`${siteUrl()}/tools/cyberquiz/auth?oauthToken=${encodeURIComponent(makeToken(user))}`);
  } catch {
    return NextResponse.redirect(`${siteUrl()}/tools/cyberquiz/auth?oauthError=linkedin_failed`);
  }
}
