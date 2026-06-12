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
  if (!code) return NextResponse.redirect(`${siteUrl()}/tools/cyberquiz/auth?oauthError=facebook_denied`);

  try {
    const cbUrl = `${siteUrl()}/api/cyberquiz/auth/facebook/callback`;
    const tok = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${new URLSearchParams({ client_id: process.env.CQ_FACEBOOK_APP_ID!, client_secret: process.env.CQ_FACEBOOK_APP_SECRET!, redirect_uri: cbUrl, code })}`).then(r => r.json());
    if (!tok.access_token) return NextResponse.redirect(`${siteUrl()}/tools/cyberquiz/auth?oauthError=facebook_token`);

    const info = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name,email&access_token=${tok.access_token}`).then(r => r.json());
    const user = await findOrCreate(info.email, info.name || '');
    return NextResponse.redirect(`${siteUrl()}/tools/cyberquiz/auth?oauthToken=${encodeURIComponent(makeToken(user))}`);
  } catch {
    return NextResponse.redirect(`${siteUrl()}/tools/cyberquiz/auth?oauthError=facebook_failed`);
  }
}
