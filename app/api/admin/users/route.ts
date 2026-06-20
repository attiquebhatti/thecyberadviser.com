import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/cyberquiz/db';
import { requireSiteAdmin } from '@/lib/cyberquiz/admin';

export const dynamic = 'force-dynamic';

// GET — every signed-up account on the site, with per-user activity insights
// and a summary. Admin only.
export async function GET(req: NextRequest) {
  const auth = await requireSiteAdmin(req);
  if ('error' in auth) return auth.error;

  // The role column may not exist yet (pre-migration) — select it conditionally.
  const [[roleCol]] = await pool.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'profiles' AND COLUMN_NAME = 'role'`
  ) as any[];
  const roleSelect = roleCol ? 'p.role' : "'standard' AS role";

  // Base user list with quiz + session activity (both are core CyberQuiz tables).
  const [users] = await pool.query(
    `SELECT p.id, p.email, p.display_name, p.tier, p.created_at, ${roleSelect},
            (SELECT COUNT(*) FROM quizzes  q WHERE q.host_id = p.id) AS quizzes,
            (SELECT COUNT(*) FROM sessions s WHERE s.host_id = p.id) AS sessions
     FROM profiles p
     ORDER BY p.created_at DESC, p.email ASC`
  ) as any[];

  // Chatbot question counts — the atc_question_logs table only exists where the
  // chatbot has been deployed/migrated, so guard against it being absent.
  const chatbotCounts: Record<string, number> = {};
  try {
    const [rows] = await pool.query(
      'SELECT user_id, COUNT(*) AS n FROM atc_question_logs GROUP BY user_id'
    ) as any[];
    for (const r of rows) chatbotCounts[r.user_id] = Number(r.n);
  } catch { /* chatbot not deployed on this DB — counts stay 0 */ }

  const envAdmin = (process.env.ADMIN_EMAIL || process.env.ATC_ADMIN_EMAIL || '').toLowerCase();

  interface EnrichedUser {
    id: string; email: string; displayName: string; tier: string; role: string;
    isSuperAdmin: boolean; createdAt: string | null;
    quizzes: number; sessions: number; chatbotQuestions: number; toolsUsed: string[];
  }
  const enriched: EnrichedUser[] = users.map((u: any) => {
    const quizzes = Number(u.quizzes) || 0;
    const sessions = Number(u.sessions) || 0;
    const chatbotQuestions = chatbotCounts[u.id] || 0;
    const toolsUsed: string[] = [];
    if (quizzes > 0 || sessions > 0) toolsUsed.push('CyberQuiz');
    if (chatbotQuestions > 0) toolsUsed.push('AI Chatbot');
    const isSuperAdmin = !!envAdmin && String(u.email).toLowerCase() === envAdmin;
    return {
      id: u.id,
      email: u.email,
      displayName: u.display_name || '',
      tier: u.tier || 'free',
      role: isSuperAdmin ? 'admin' : (u.role || 'standard'),
      isSuperAdmin,
      createdAt: u.created_at,
      quizzes, sessions, chatbotQuestions, toolsUsed,
    };
  });

  // Summary metrics.
  const now = Date.now();
  const WEEK = 7 * 24 * 60 * 60 * 1000;
  const MONTH = 30 * 24 * 60 * 60 * 1000;
  const tierCounts: Record<string, number> = {};
  let newThisWeek = 0, newThisMonth = 0;
  for (const u of enriched) {
    tierCounts[u.tier] = (tierCounts[u.tier] || 0) + 1;
    if (u.createdAt) {
      const t = new Date(u.createdAt).getTime();
      if (now - t <= WEEK) newThisWeek++;
      if (now - t <= MONTH) newThisMonth++;
    }
  }

  return NextResponse.json({
    summary: {
      total: enriched.length,
      newThisWeek,
      newThisMonth,
      tierCounts,
      totalQuizzes: enriched.reduce((s, u) => s + u.quizzes, 0),
      totalSessions: enriched.reduce((s, u) => s + u.sessions, 0),
      totalChatbotQuestions: enriched.reduce((s, u) => s + u.chatbotQuestions, 0),
    },
    users: enriched,
  });
}
