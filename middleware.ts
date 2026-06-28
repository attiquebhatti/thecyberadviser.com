import { NextResponse, type NextRequest } from 'next/server';

const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Content-Security-Policy': "frame-ancestors 'self'; upgrade-insecure-requests",
};

function shouldUseSeoCachePolicy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith('/_next/static/') || path.startsWith('/_next/image')) {
    return false;
  }

  if (/\.(?:js|css|png|jpg|jpeg|gif|svg|webp|avif|ico|woff2?|ttf|map)$/i.test(path)) {
    return false;
  }

  return request.method === 'GET' || request.method === 'HEAD';
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  if (shouldUseSeoCachePolicy(request)) {
    response.headers.set('Cache-Control', 's-maxage=600, stale-while-revalidate=60');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
