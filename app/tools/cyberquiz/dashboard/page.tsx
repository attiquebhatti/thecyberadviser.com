'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Play, Edit, Trash2, BarChart3, Users, BookOpen, Zap, ChevronRight, LogIn, Search } from 'lucide-react';
import { format } from 'date-fns';
import { cqApi } from '@/lib/cyberquiz/api';
import { useAuthStore } from '@/lib/cyberquiz/stores/authStore';
import { CQButton } from '@/components/cyberquiz/ui/Button';
import { CQBadge } from '@/components/cyberquiz/ui/Badge';
import { CQConfirmDialog } from '@/components/cyberquiz/ConfirmDialog';
import { CQGameModeSelector } from '@/components/cyberquiz/GameModeSelector';
import { CQPANWTemplates } from '@/components/cyberquiz/PANWTemplates';
import { CQQuizCardSkeleton, CQSessionRowSkeleton, CQStatCardSkeleton } from '@/components/cyberquiz/ui/Skeleton';
import { formatScore } from '@/lib/cyberquiz/utils';
import type { Quiz } from '@/lib/cyberquiz/types';

const BASE = '/tools/cyberquiz';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [quizzes, setQuizzes]   = useState<Quiz[]>([]);
  const [sessions, setSessions] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');

  const [launchQuiz, setLaunchQuiz]       = useState<Quiz | null>(null);
  const [deleteTarget, setDeleteTarget]   = useState<Quiz | null>(null);
  const [deleting, setDeleting]           = useState(false);
  const [activeTab, setActiveTab]         = useState<'panw' | 'quizzes' | 'sessions'>('panw');
  const [isAdmin, setIsAdmin]             = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
    const token = typeof window !== 'undefined' ? localStorage.getItem('qa_token') : null;
    if (token) {
      fetch('/api/admin/check', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json()).then((d) => setIsAdmin(!!d.isAdmin)).catch(() => {});
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [q, s] = await Promise.all([cqApi.getQuizzes(), cqApi.getHostSessions()]);
      setQuizzes(q);
      setSessions(s as unknown as Record<string, unknown>[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await cqApi.deleteQuiz(deleteTarget.id);
      setQuizzes(prev => prev.filter(q => q.id !== deleteTarget.id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex flex-col items-center justify-center text-center px-4">
        <LogIn className="w-12 h-12 text-[#6bd348] mb-4" />
        <h2 className="text-2xl font-bold mb-2">Sign in to access your dashboard</h2>
        <p className="text-[#94a3b8] mb-6">Manage your quizzes, sessions, and more</p>
        <CQButton onClick={() => router.push(`${BASE}/auth`)}>Sign In</CQButton>
      </div>
    );
  }

  const filteredQuizzes = quizzes.filter(q =>
    q.title.toLowerCase().includes(search.toLowerCase()) ||
    (q.subject || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalPlayers = sessions.reduce((sum, s) => sum + ((s.player_count as number) || 0), 0);

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      {/* Header */}
      <header className="bg-[#1a1a2e] border-b border-[#2d2d44] px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-[#f1f5f9]">Dashboard</h1>
            <p className="text-sm text-[#94a3b8]">Welcome back, {user.displayName || user.email}</p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <>
                <CQButton variant="ghost" size="sm" onClick={() => router.push(`${BASE}/admin/analytics`)}>
                  <BarChart3 className="w-4 h-4" /> Traffic
                </CQButton>
                <CQButton variant="ghost" size="sm" onClick={() => router.push(`${BASE}/admin/users`)}>
                  <Users className="w-4 h-4" /> Users
                </CQButton>
              </>
            )}
            <CQButton variant="ghost" size="sm" onClick={() => router.push(`${BASE}/join`)}>
              <Play className="w-4 h-4" /> Join Session
            </CQButton>
            <CQButton size="sm" onClick={() => router.push(`${BASE}/quiz/new`)}>
              <Plus className="w-4 h-4" /> New Quiz
            </CQButton>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <CQStatCardSkeleton key={i} />)
          ) : (
            [
              { label: 'Quizzes',      value: quizzes.length,   icon: BookOpen,  color: '#6bd348' },
              { label: 'Sessions',     value: sessions.length,  icon: Zap,       color: '#06b6d4' },
              { label: 'Total Players',value: totalPlayers,     icon: Users,     color: '#22c55e' },
              { label: 'Questions',    value: quizzes.reduce((s, q) => s + (q.question_count || 0), 0), icon: BarChart3, color: '#f59e0b' },
            ].map(stat => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="glass rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4" style={{ color: stat.color }} />
                    <span className="text-xs text-[#94a3b8]">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-black text-[#f1f5f9]">{formatScore(stat.value)}</p>
                </div>
              );
            })
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#1a1a2e] border border-[#2d2d44] rounded-xl p-1 w-fit">
          {(['panw', 'quizzes', 'sessions'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t ? 'bg-[#6bd348] text-[#04130c]' : 'text-[#94a3b8] hover:text-[#f1f5f9]'}`}>
              {t === 'panw' ? 'Palo Alto Networks Quiz' : t === 'quizzes' ? 'Custom Quizzes' : 'Sessions'}
            </button>
          ))}
        </div>

        {/* Quizzes tab */}
        {activeTab === 'quizzes' && (
          <div className="space-y-4">
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a4a6a]" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search quizzes…"
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#1a1a2e] border border-[#2d2d44] text-[#f1f5f9] placeholder:text-[#4a4a6a] focus:outline-none focus:border-[#6bd348] text-sm transition-colors"
                />
              </div>
              <CQButton size="sm" variant="ghost" onClick={() => router.push(`${BASE}/quiz/ai`)}>
                <Zap className="w-4 h-4" /> AI Generate
              </CQButton>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <CQQuizCardSkeleton key={i} />)}
              </div>
            ) : filteredQuizzes.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="w-12 h-12 text-[#2d2d44] mx-auto mb-4" />
                <p className="text-[#94a3b8] mb-4">{search ? 'No quizzes match your search' : "You haven't created any quizzes yet"}</p>
                {!search && <CQButton onClick={() => router.push(`${BASE}/quiz/new`)}><Plus className="w-4 h-4" /> Create Your First Quiz</CQButton>}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredQuizzes.map((quiz, i) => (
                  <motion.div
                    key={quiz.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="glass glass-hover rounded-xl p-5 group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#f1f5f9] truncate">{quiz.title}</h3>
                        {quiz.subject && <CQBadge variant="purple" className="mt-1 text-xs">{quiz.subject}</CQBadge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#94a3b8] mb-4">
                      <span>{quiz.question_count || 0} questions</span>
                      {quiz.play_count != null && <span>{quiz.play_count} plays</span>}
                    </div>
                    <div className="flex gap-2">
                      <CQButton size="sm" className="flex-1" onClick={() => setLaunchQuiz(quiz)}>
                        <Play className="w-3.5 h-3.5" /> Play
                      </CQButton>
                      <button onClick={() => router.push(`${BASE}/quiz/${quiz.id}/edit`)} className="p-2 rounded-lg hover:bg-white/5 text-[#94a3b8] hover:text-[#f1f5f9] transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(quiz)} className="p-2 rounded-lg hover:bg-[#ef4444]/10 text-[#94a3b8] hover:text-[#ef4444] transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sessions tab */}
        {activeTab === 'sessions' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#94a3b8]">{sessions.length} sessions hosted</p>
              <CQButton size="sm" variant="ghost" onClick={() => router.push(`${BASE}/analytics`)}>
                <BarChart3 className="w-4 h-4" /> Full Analytics <ChevronRight className="w-4 h-4" />
              </CQButton>
            </div>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <CQSessionRowSkeleton key={i} />)
            ) : sessions.length === 0 ? (
              <div className="text-center py-12 text-[#94a3b8]">No sessions yet — launch a quiz to start!</div>
            ) : (
              <div className="rounded-xl bg-[#1a1a2e] border border-[#2d2d44] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2d2d44]">
                      <th className="text-left px-4 py-3 text-xs font-medium text-[#94a3b8]">Quiz</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-[#94a3b8]">Mode</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-[#94a3b8]">Players</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-[#94a3b8]">Date</th>
                      <th className="px-4 py-3 text-xs font-medium text-[#94a3b8]">Results</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.slice(0, 20).map((s, i) => (
                      <tr key={i} className="border-b border-[#2d2d44] last:border-0 hover:bg-white/2 transition-colors">
                        <td className="px-4 py-3 text-[#f1f5f9] truncate max-w-40">{(s.quiz_title as string) || '—'}</td>
                        <td className="px-4 py-3">
                          <CQBadge variant="purple" className="text-xs capitalize">{((s.game_mode as string) || '').replace(/_/g, ' ')}</CQBadge>
                        </td>
                        <td className="px-4 py-3 text-[#94a3b8]">{(s.player_count as number) || 0}</td>
                        <td className="px-4 py-3 text-[#94a3b8] whitespace-nowrap">
                          {s.created_at ? format(new Date(s.created_at as string), 'MMM d, yyyy') : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {s.id ? (
                            <button onClick={() => router.push(`${BASE}/session/${String(s.id)}/results`)} className="text-xs text-[#6bd348] hover:underline">
                              View
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PANW tab */}
        {activeTab === 'panw' && <CQPANWTemplates />}
      </div>

      {/* Launch modal */}
      {launchQuiz && (
        <CQGameModeSelector quiz={launchQuiz} open={!!launchQuiz} onClose={() => setLaunchQuiz(null)} />
      )}

      {/* Delete confirm */}
      <CQConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => { if (!open) setDeleteTarget(null); }}
        title="Delete Quiz"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
