import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser, isAdminEmail } from '@/lib/chatbot/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = requireAuthUser(req);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  return NextResponse.json({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    isAdmin: isAdminEmail(user.email),
  });
}
