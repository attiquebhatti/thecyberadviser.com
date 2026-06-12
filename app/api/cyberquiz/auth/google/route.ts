import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.CQ_GOOGLE_CLIENT_ID;
  const siteUrl  = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const frontUrl = siteUrl;

  if (!clientId) return NextResponse.redirect(`${frontUrl}/tools/cyberquiz/auth?oauthError=google_not_configured`);

  const url = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  `${siteUrl}/api/cyberquiz/auth/google/callback`,
    response_type: 'code',
    scope:         'openid email profile',
    access_type:   'online',
  });
  return NextResponse.redirect(url);
}
