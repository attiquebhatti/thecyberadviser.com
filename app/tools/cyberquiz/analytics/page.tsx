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
    { label: 'Total Sessions',       value: totalSessions,     icon: Calendar,  color: '#10b981' },
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
          <BarChart3Icon className="w-5 h-5 text-[#10b981]" />
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
                <Line type="monotone" dataKey="players" stroke="#10b981" strokeWidth={2} dot={false} />
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
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
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
                  <span className="text-sm font-bold text-[#10b981]">{quiz.play_count ?? 0} plays</span>
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
      </div>
    </div>
  );
}
