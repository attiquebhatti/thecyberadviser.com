import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/cyberquiz/auth';
import { isUserAdmin } from '@/lib/cyberquiz/admin';

export const dynamic = 'force-dynamic';

// Lightweight check so the UI can show/hide the admin link. The actual data
// routes enforce admin access server-side regardless.
export async function GET(req: NextRequest) {
  const auth = requireAuthUser(req);
  if ('error' in auth) return NextResponse.json({ isAdmin: false });
  return NextResponse.json({ isAdmin: await isUserAdmin(auth.user) });
}
