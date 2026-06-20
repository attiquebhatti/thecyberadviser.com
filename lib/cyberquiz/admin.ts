import { NextRequest } from 'next/server';
import { pool } from './db';
import { requireAuthUser, type JwtPayload } from './auth';

// The bootstrap "super admin" — set via ADMIN_EMAIL (falls back to ATC_ADMIN_EMAIL).
// This account is ALWAYS an admin and can never be demoted. Other users can be
// granted the 'admin' role from the admin console (stored in profiles.role).
export function isEnvAdmin(email: string): boolean {
  const admin = (process.env.ADMIN_EMAIL || process.env.ATC_ADMIN_EMAIL || '').toLowerCase();
  return !!admin && email.toLowerCase() === admin;
}

// True if the user is the bootstrap env admin OR has role='admin' in the DB.
export async function isUserAdmin(user: { id: string; email: string }): Promise<boolean> {
  if (isEnvAdmin(user.email)) return true;
  try {
    const [[row]] = await pool.query('SELECT role FROM profiles WHERE id = ?', [user.id]) as any[];
    return row?.role === 'admin';
  } catch {
    return false; // role column may not exist yet
  }
}

export async function requireSiteAdmin(req: NextRequest): Promise<{ user: JwtPayload } | { error: Response }> {
  const auth = requireAuthUser(req);
  if ('error' in auth) return auth;
  if (!(await isUserAdmin(auth.user))) {
    return {
      error: new Response(JSON.stringify({ error: 'Forbidden — admin access only' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }
  return auth;
}
