'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, BarChart3 as BarChart3Icon, Users, Trophy, TrendingUp, Calendar, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { cqApi } from '@/lib/cyberquiz/api';
import { useAuthStore } from '@/lib/cyberquiz/stores/authStore';
import { CQStatCardSkeleton } from '@/components/cyberquiz/ui/Skeleton';
import type { Quiz } from '@/lib/cyberquiz/types';

const BASE = '/tools/cyberquiz';

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [sessions, setSessions] = useState<{ date: string; rawDate: string; players: number; mode: string }[]>([]);
  const [quizzes, setQuizzes]   = useState<Quiz[]>([]);
  const [migration, setMigration] = useState<any>(null);
  const [inquiries, setInquiries] = useState<any[] | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (user) loadAnalytics();
  }, [user]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [sessData, quizData] = await Promise.all([cqApi.getHostSessions(), cqApi.getQuizzes()]);
      const mapped = (sessData as unknown as Record<string, unknown>[]).map(s => ({
        date:    format(new Date(s.created_at as string), 'MMM d'),
        rawDate: s.created_at as string,
        players: (s.player_count as number) ?? 0,
        mode:    s.game_mode as string,
      }));
      setSessions(mapped.reverse());
      setQuizzes(quizData);
      // Config Migration usage (admin-only endpoint; ignored if not admin).
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('qa_token') : null;
        if (token) {
          const mi = await fetch('/api/migration/insights', { headers: { Authorization: `Bearer ${token}` } });
          if (mi.ok) setMigration(await mi.json());
          const inq = await fetch('/api/admin/inquiries', { headers: { Authorization: `Bearer ${token}` } });
          if (inq.ok) setInquiries((await inq.json()).inquiries || []);
        }
      } catch { /* non-fatal */ }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalSessions     = sessions.length;
  const totalPlayers      = sessions.reduce((s, sess) => s + sess.players, 0);
  const avgPlayers        = totalSessions > 0 ? Math.round(totalPlayers / totalSessions) : 0;
  const now               = new Date();
  const sessionsThisMonth = sessions.filter(s => {
    const d = new Date(s.rawDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const modeCount = sessions.reduce((acc, s) => {
    acc[s.mode] = (acc[s.mode] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const modeData = Object.entries(modeCount)
    .sort((a, b) => b[1] - a[1])
    .map(([mode, count]) => ({ mode: mode.replace(/_/g, ' '), count }));

  const topQuizzes = [...quizzes].sort((a, b) => (b.play_count ?? 0) - (a.play_count ?? 0)).slice(0, 5);

  const STATS = [
    { label: 'Total Sessions',       value: totalSessions,     icon: Calendar,  color: '#6bd348' },
    { label: 'Total Players',        value: totalPlayers,      icon: Users,     color: '#06b6d4' },
    { label: 'Avg Players/Session',  value: avgPlayers,        icon: TrendingUp,color: '#22c55e' },
    { label: 'Sessions This Month',  value: sessionsThisMonth, icon: Trophy,    color: '#f59e0b' },
  ];

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <header className="sticky top-24 z-30 bg-[#1a1a2e] border-b border-[#2d2d44] px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push(`${BASE}/dashboard`)} className="p-1.5 rounded-lg hover:bg-white/5 text-[#94a3b8] transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <BarChart3Icon className="w-5 h-5 text-[#6bd348]" />
          <h1 className="font-bold text-[#f1f5f9]">Analytics Overview</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <CQStatCardSkeleton key={i} />)
            : STATS.map(stat => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="rounded-xl bg-[#1a1a2e] border border-[#2d2d44] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4" style={{ color: stat.color }} />
                      <span className="text-xs text-[#94a3b8]">{stat.label}</span>
                    </div>
                    <p className="text-2xl font-black text-[#f1f5f9]">{stat.value}</p>
                  </div>
                );
              })
          }
        </div>

        {/* Sessions over time */}
        {sessions.length > 0 && (
          <div className="rounded-xl bg-[#1a1a2e] border border-[#2d2d44] p-5">
            <h2 className="font-semibold text-[#f1f5f9] mb-4">Players per Session</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={sessions.slice(-20)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d44" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2d2d44', borderRadius: 8 }} labelStyle={{ color: '#f1f5f9' }} />
                <Line type="monotone" dataKey="players" stroke="#6bd348" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Mode breakdown */}
        {modeData.length > 0 && (
          <div className="rounded-xl bg-[#1a1a2e] border border-[#2d2d44] p-5">
            <h2 className="font-semibold text-[#f1f5f9] mb-4">Sessions by Game Mode</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={modeData} layout="vertical">
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis type="category" dataKey="mode" tick={{ fill: '#94a3b8', fontSize: 11 }} width={120} />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2d2d44', borderRadius: 8 }} labelStyle={{ color: '#f1f5f9' }} />
                <Bar dataKey="count" fill="#6bd348" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top quizzes */}
        {topQuizzes.length > 0 && (
          <div className="rounded-xl bg-[#1a1a2e] border border-[#2d2d44] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-[#f59e0b]" />
              <h2 className="font-semibold text-[#f1f5f9]">Top Quizzes by Play Count</h2>
            </div>
            <div className="space-y-3">
              {topQuizzes.map((quiz, i) => (
                <div key={quiz.id} className="flex items-center gap-4">
                  <span className="text-sm font-bold text-[#4a4a6a] w-5">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#f1f5f9] truncate">{quiz.title}</p>
                    {quiz.subject && <p className="text-xs text-[#94a3b8]">{quiz.subject}</p>}
                  </div>
                  <span className="text-sm font-bold text-[#6bd348]">{quiz.play_count ?? 0} plays</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="text-center py-16 text-[#94a3b8]">
            <BarChart3Icon className="w-12 h-12 text-[#2d2d44] mx-auto mb-4" />
            <p>No sessions yet. Host a quiz to see analytics here.</p>
          </div>
        )}

        {/* Config Migration usage (admin) */}
        {migration && (
          <div className="rounded-xl bg-[#1a1a2e] border border-[#2d2d44] p-5">
            <h2 className="font-semibold text-[#f1f5f9] mb-4">Config Migration Usage</h2>
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="rounded-lg bg-[#0f0f1a] border border-[#2d2d44] p-3 text-center">
                <p className="text-2xl font-black text-[#6bd348]">{migration.totalRuns}</p>
                <p className="text-[11px] text-[#94a3b8] mt-1">Total runs</p>
              </div>
              <div className="rounded-lg bg-[#0f0f1a] border border-[#2d2d44] p-3 text-center">
                <p className="text-2xl font-black text-[#f1f5f9]">{migration.uniqueUsers}</p>
                <p className="text-[11px] text-[#94a3b8] mt-1">Unique users</p>
              </div>
              <div className="rounded-lg bg-[#0f0f1a] border border-[#2d2d44] p-3 text-center">
                <p className="text-2xl font-black text-[#f1f5f9]">{migration.runsLast30Days}</p>
                <p className="text-[11px] text-[#94a3b8] mt-1">Last 30 days</p>
              </div>
            </div>
            {migration.byUser?.length > 0 && (
              <>
                <p className="text-xs uppercase tracking-wider text-[#94a3b8] mb-2">By user</p>
                <div className="space-y-1.5 mb-5">
                  {migration.byUser.slice(0, 10).map((u: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-[#f1f5f9] truncate">{u.user || u.email || 'Unknown'} <span className="text-[#64748b]">{u.email && u.user ? `· ${u.email}` : ''}</span></span>
                      <span className="text-[#6bd348] font-semibold shrink-0">{u.runs} run{u.runs === 1 ? '' : 's'}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            {migration.recent?.length > 0 && (
              <>
                <p className="text-xs uppercase tracking-wider text-[#94a3b8] mb-2">Recent runs</p>
                <div className="space-y-1 max-h-56 overflow-y-auto text-xs">
                  {migration.recent.map((r: any, i: number) => (
                    <div key={i} className="flex items-center justify-between gap-3 text-[#94a3b8] border-b border-white/[0.04] py-1">
                      <span className="text-[#cbd5e1] truncate">{r.user || r.email}</span>
                      <span className="shrink-0">{r.source || '?'} → {r.target || '?'}</span>
                      <span className="shrink-0 text-[#64748b]">{r.at ? new Date(r.at).toLocaleString() : ''}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            {migration.totalRuns === 0 && (
              <p className="text-sm text-[#94a3b8]">No migrations have been run yet.</p>
            )}
          </div>
        )}

        {/* Contact inquiries (admin) */}
        {inquiries && (
          <div className="rounded-xl bg-[#1a1a2e] border border-[#2d2d44] p-5">
            <h2 className="font-semibold text-[#f1f5f9] mb-4">Contact Inquiries <span className="text-[#64748b] text-sm font-normal">({inquiries.length})</span></h2>
            {inquiries.length === 0 ? (
              <p className="text-sm text-[#94a3b8]">No inquiries yet.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {inquiries.map((q) => (
                  <div key={q.id} className="rounded-lg bg-[#0f0f1a] border border-[#2d2d44] p-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <span className="text-sm font-semibold text-[#f1f5f9]">{q.fullName || q.email}</span>
                      <span className="text-[11px] text-[#64748b]">{q.createdAt ? new Date(q.createdAt).toLocaleString() : ''}</span>
                    </div>
                    <p className="text-xs text-[#94a3b8] mt-0.5">
                      <a href={`mailto:${q.email}`} className="text-[#6bd348] hover:underline">{q.email}</a>
                      {q.company ? ` · ${q.company}` : ''} · {q.topic}
                      {q.emailed ? '' : <span className="ml-2 text-amber-400">· not emailed (SMTP off)</span>}
                    </p>
                    <p className="text-sm text-[#cbd5e1] mt-2 whitespace-pre-wrap line-clamp-4">{q.details}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
