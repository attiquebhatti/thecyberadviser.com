import { NextRequest } from 'next/server';
import { requireAuthUser as cqRequireAuthUser, type JwtPayload } from '@/lib/cyberquiz/auth';

// The AI Training Chatbot has no auth system of its own — it reuses the same
// site-wide CyberQuiz login (same JWT, same qa_token) so any user who already
// has an account can use this tool without a separate signup.
export type { JwtPayload };
export const requireAuthUser = cqRequireAuthUser;

function isAdminEmail(email: string): boolean {
  const adminEmail = (process.env.ATC_ADMIN_EMAIL || '').toLowerCase();
  return !!adminEmail && email.toLowerCase() === adminEmail;
}

export { isAdminEmail };

/** Use in admin-only chatbot route handlers. Returns 401/403 if not an authenticated admin. */
export function requireAdminUser(req: NextRequest): { user: JwtPayload } | { error: Response } {
  const auth = cqRequireAuthUser(req);
  if ('error' in auth) return auth;
  if (!isAdminEmail(auth.user.email)) {
    return {
      error: new Response(JSON.stringify({ error: 'Forbidden — admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }
  return auth;
}
