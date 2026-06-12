import { NextResponse } from 'next/server';

export async function GET() {
  const appId   = process.env.CQ_FACEBOOK_APP_ID;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  if (!appId) return NextResponse.redirect(`${siteUrl}/tools/cyberquiz/auth?oauthError=facebook_not_configured`);

  const url = 'https://www.facebook.com/v19.0/dialog/oauth?' + new URLSearchParams({
    client_id:     appId,
    redirect_uri:  `${siteUrl}/api/cyberquiz/auth/facebook/callback`,
    scope:         'email',
    response_type: 'code',
  });
  return NextResponse.redirect(url);
}
