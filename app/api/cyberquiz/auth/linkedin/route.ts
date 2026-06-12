import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.CQ_LINKEDIN_CLIENT_ID;
  const siteUrl  = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  if (!clientId) return NextResponse.redirect(`${siteUrl}/tools/cyberquiz/auth?oauthError=linkedin_not_configured`);

  const url = 'https://www.linkedin.com/oauth/v2/authorization?' + new URLSearchParams({
    response_type: 'code',
    client_id:     clientId,
    redirect_uri:  `${siteUrl}/api/cyberquiz/auth/linkedin/callback`,
    scope:         'openid profile email',
  });
  return NextResponse.redirect(url);
}
