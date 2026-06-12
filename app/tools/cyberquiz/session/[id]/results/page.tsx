'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Download, Trophy, BarChart3, Users, ChevronLeft, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { cqApi } from '@/lib/cyberquiz/api';
import { useAuthStore } from '@/lib/cyberquiz/stores/authStore';
import { CQButton } from '@/components/cyberquiz/ui/Button';
import { CQAvatar } from '@/components/cyberquiz/ui/Avatar';
import { CQBadge } from '@/components/cyberquiz/ui/Badge';
import { formatScore } from '@/lib/cyberquiz/utils';

const BASE = '/tools/cyberquiz';

interface ResultPlayer { id: string; name: string; score: number; rank: number; correct_count: number; total_questions: number; answers: number[]; }
interface QuestionResult { index: number; question_text: string; correct_index: number; answer_counts: number[]; accuracy_pct: number; }
interface SessionResult { session: { id: string; join_code: string; game_mode: string; quiz_title?: string; created_at: string; }; leaderboard: ResultPlayer[]; questions: QuestionResult[]; }

export default function ResultsDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const router = useRouter();

  const [result, setResult] = useState<SessionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'questions' | 'heatmap'>('leaderboard');

  useEffect(() => {
    if (id) loadResults();
  }, [id]);

  const loadResults = async () => {
    setLoading(true);
    try {
      const data = await cqApi.getSessionResults(id!);
      setResult(data as SessionResult);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!result) return;
    const headers = ['Rank', 'Name', 'Score', 'Correct', 'Total'];
    const rows = result.leaderboard.map(p => [p.rank, p.name, p.score, p.correct_count, p.total_questions]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = `quiz-results-${id}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#7c3aed]" />
    </div>
  );

  if (!result) return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center text-center px-4">
      <div>
        <p className="text-[#94a3b8] mb-4">Results not found</p>
        <CQButton onClick={() => router.push(`${BASE}/dashboard`)}>Back to Dashboard</CQButton>
      </div>
    </div>
  );

  const { session, leaderboard, questions } = result;
  const top3 = leaderboard.slice(0, 3);
  const accuracyData = questions.map((q, i) => ({ question: `Q${i + 1}`, accuracy: Math.round(q.accuracy_pct) }));

  const heatmapColors = (correct: boolean) => correct ? 'bg-[#22c55e]/40 border-[#22c55e]/20' : 'bg-[#ef4444]/20 border-[#ef4444]/10';

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <header className="sticky top-24 z-30 bg-[#1a1a2e] border-b border-[#2d2d44] px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push(`${BASE}/dashboard`)} className="p-1.5 rounded-lg hover:bg-white/5 text-[#94a3b8] transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-[#f1f5f9]">{session.quiz_title || 'Quiz Results'}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <CQBadge variant="purple" className="capitalize text-xs">{session.game_mode?.replace(/_/g, ' ')}</CQBadge>
            <span className="text-xs text-[#94a3b8]">{leaderboard.length} players</span>
          </div>
        </div>
        <CQButton size="sm" variant="ghost" onClick={exportCSV}><Download className="w-4 h-4" /> Export CSV</CQButton>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Podium */}
        {top3.length > 0 && (
          <div className="flex items-end justify-center gap-4">
            {[top3[1], top3[0], top3[2]].filter(Boolean).map((p, podiumIdx) => {
              const rank = podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3;
              const heights  = ['h-24', 'h-32', 'h-20'];
              const colors   = ['#94a3b8', '#fbbf24', '#f97316'];
              const realIdx  = rank - 1;
              return (
                <div key={p.id} className="flex flex-col items-center gap-2">
                  <CQAvatar seed={p.id} size={48} />
                  <p className="text-sm font-medium text-[#f1f5f9] max-w-24 text-center truncate">{p.name}</p>
                  <p className="text-xs font-bold" style={{ color: colors[realIdx] }}>#{rank}</p>
                  <div className={`w-20 ${heights[podiumIdx]} rounded-t-xl flex items-start justify-center pt-2`} style={{ background: colors[realIdx] + '30', border: `2px solid ${colors[realIdx]}50` }}>
                    <span className="text-sm font-bold" style={{ color: colors[realIdx] }}>{formatScore(p.score)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-[#1a1a2e] border border-[#2d2d44] rounded-xl p-1 w-fit">
          {(['leaderboard', 'questions', 'heatmap'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === t ? 'bg-[#7c3aed] text-white' : 'text-[#94a3b8] hover:text-[#f1f5f9]'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        {activeTab === 'leaderboard' && (
          <div className="rounded-xl bg-[#1a1a2e] border border-[#2d2d44] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2d2d44]">
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#94a3b8]">Rank</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#94a3b8]">Player</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-[#94a3b8]">Score</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-[#94a3b8]">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map(p => (
                  <tr key={p.id} className="border-b border-[#2d2d44] last:border-0 hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`font-black text-sm ${p.rank === 1 ? 'text-[#fbbf24]' : p.rank === 2 ? 'text-[#94a3b8]' : p.rank === 3 ? 'text-[#f97316]' : 'text-[#4a4a6a]'}`}>
                        #{p.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <CQAvatar seed={p.id} size={28} />
                        <span className="text-[#f1f5f9]">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[#7c3aed]">{formatScore(p.score)}</td>
                    <td className="px-4 py-3 text-right text-[#94a3b8]">
                      {p.total_questions > 0 ? Math.round((p.correct_count / p.total_questions) * 100) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Question accuracy */}
        {activeTab === 'questions' && questions.length > 0 && (
          <div className="space-y-6">
            <div className="rounded-xl bg-[#1a1a2e] border border-[#2d2d44] p-5">
              <h3 className="font-semibold text-[#f1f5f9] mb-4">Question Accuracy</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={accuracyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d2d44" />
                  <XAxis dataKey="question" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2d2d44', borderRadius: 8 }} formatter={(v: number) => [`${v}%`, 'Accuracy']} />
                  <Bar dataKey="accuracy" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {questions.map((q, i) => (
                <div key={i} className="rounded-xl bg-[#1a1a2e] border border-[#2d2d44] p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-xs font-bold text-[#94a3b8] shrink-0">Q{i + 1}</span>
                    <p className="text-sm text-[#f1f5f9]">{q.question_text}</p>
                    <CQBadge variant={q.accuracy_pct >= 60 ? 'green' : q.accuracy_pct >= 30 ? 'yellow' : 'red'} className="shrink-0 ml-auto text-xs">
                      {Math.round(q.accuracy_pct)}%
                    </CQBadge>
                  </div>
                  <div className="flex gap-2">
                    {q.answer_counts.map((count, ci) => {
                      const total = q.answer_counts.reduce((s, c) => s + c, 0);
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      const isCorrect = ci === q.correct_index;
                      return (
                        <div key={ci} className="flex-1 text-center">
                          <div className="h-16 relative rounded-lg overflow-hidden bg-[#0f0f1a]">
                            <div className="absolute bottom-0 left-0 right-0 transition-all rounded-lg" style={{ height: `${pct}%`, background: isCorrect ? '#22c55e80' : '#ef444440' }} />
                            <span className={`absolute top-1 left-1/2 -translate-x-1/2 text-xs font-bold ${isCorrect ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
                              {['A', 'B', 'C', 'D'][ci]}
                            </span>
                          </div>
                          <p className="text-xs text-[#94a3b8] mt-1">{pct}%</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Heatmap */}
        {activeTab === 'heatmap' && (
          <div className="rounded-xl bg-[#1a1a2e] border border-[#2d2d44] overflow-hidden">
            <div className="p-4 border-b border-[#2d2d44]">
              <h3 className="font-semibold text-[#f1f5f9]">Answer Heatmap</h3>
              <p className="text-xs text-[#94a3b8] mt-1">Green = correct, Red = incorrect per player per question</p>
            </div>
            <div className="overflow-x-auto p-4">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left py-2 pr-4 text-[#94a3b8] whitespace-nowrap">Player</th>
                    {questions.map((_, i) => (
                      <th key={i} className="text-center py-2 px-1 text-[#94a3b8]">Q{i + 1}</th>
                    ))}
                    <th className="text-right py-2 pl-4 text-[#94a3b8]">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map(p => (
                    <tr key={p.id} className="border-t border-[#2d2d44]">
                      <td className="py-2 pr-4 text-[#f1f5f9] whitespace-nowrap">{p.name}</td>
                      {(p.answers || []).map((ans, qi) => {
                        const isCorrect = ans === questions[qi]?.correct_index;
                        return (
                          <td key={qi} className="py-2 px-1 text-center">
                            <div className={`w-6 h-6 rounded mx-auto border ${heatmapColors(isCorrect)}`} title={isCorrect ? 'Correct' : 'Incorrect'} />
                          </td>
                        );
                      })}
                      <td className="py-2 pl-4 text-right font-bold text-[#7c3aed]">{formatScore(p.score)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
