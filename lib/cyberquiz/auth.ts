import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.CQ_JWT_SECRET || 'change-this-secret';

export interface JwtPayload {
  id: string;
  email: string;
  displayName: string;
  tier: string;
}

export function makeToken(user: { id: string; email: string; display_name: string; tier: string }) {
  return jwt.sign(
    { id: user.id, email: user.email, displayName: user.display_name, tier: user.tier },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

/** Extract and verify bearer token from a Next.js request. Returns null if missing/invalid. */
export function getAuthUser(req: NextRequest): JwtPayload | null {
  try {
    const header = req.headers.get('authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

/** Use in route handlers that require auth. Returns 401 JSON response if not authenticated. */
export function requireAuthUser(req: NextRequest): { user: JwtPayload } | { error: Response } {
  const user = getAuthUser(req);
  if (!user) {
    return {
      error: new Response(JSON.stringify({ error: 'Unauthorised' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }
  return { user };
}

export function formatUser(row: Record<string, unknown>) {
  return {
    id:          row.id,
    email:       row.email,
    displayName: row.display_name || '',
    avatarUrl:   row.avatar_url   || null,
    tier:        row.tier         || 'free',
  };
}
