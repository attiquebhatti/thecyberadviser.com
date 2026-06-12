'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Trophy, SkipForward, Eye, Pause, Play, BarChart3, X, Loader2 } from 'lucide-react';
import { cqApi } from '@/lib/cyberquiz/api';
import { useAuthStore } from '@/lib/cyberquiz/stores/authStore';
import { getSocket } from '@/lib/cyberquiz/socket';
import { CQButton } from '@/components/cyberquiz/ui/Button';
import { CQConnectionBanner } from '@/components/cyberquiz/ConnectionBanner';
import { CQConfirmDialog } from '@/components/cyberquiz/ConfirmDialog';
import { formatScore } from '@/lib/cyberquiz/utils';

const BASE = '/tools/cyberquiz';
const ANSWER_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981'];
const ANSWER_LABELS = ['A', 'B', 'C', 'D'];

interface GamePlayer { id: string; name: string; score: number; rank: number; prevRank?: number; answeredCount: number; streak: number; }
interface QuestionState { index: number; total: number; question: { question_text: string; type: string; options?: { text: string; is_correct: boolean }[]; time_limit_seconds: number; points: number; }; timeLeft: number; phase: 'question' | 'reveal' | 'leaderboard'; answerCounts: Record<string, number>; correctIndex: number; }

export default function HostGamePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const router = useRouter();

  const [gameState, setGameState] = useState<QuestionState | null>(null);
  const [players, setPlayers]     = useState<GamePlayer[]>([]);
  const [socket, setSocket]       = useState<ReturnType<typeof getSocket> | null>(null);
  const [loading, setLoading]     = useState(true);
  const [paused, setPaused]       = useState(false);
  const [endConfirm, setEndConfirm] = useState(false);
  const [ended, setEnded]         = useState(false);
  const socketRef                 = useRef<ReturnType<typeof getSocket> | null>(null);

  useEffect(() => {
    if (!id || !user) return;
    initSocket();
    return () => { socketRef.current?.disconnect(); };
  }, [id, user]);

  const initSocket = () => {
    const sock = getSocket();
    socketRef.current = sock;
    setSocket(sock);

    sock.emit('host:join', { sessionId: id });

    sock.on('game:question', (data: QuestionState) => {
      setGameState(data); setLoading(false); setPaused(false);
    });
    sock.on('game:answer_update', (counts: Record<string, number>) => {
      setGameState(prev => prev ? { ...prev, answerCounts: counts } : prev);
    });
    sock.on('game:reveal', (data: { correctIndex: number; leaderboard: GamePlayer[] }) => {
      setGameState(prev => prev ? { ...prev, phase: 'reveal', correctIndex: data.correctIndex } : prev);
      setPlayers(data.leaderboard);
    });
    sock.on('game:leaderboard', (data: { leaderboard: GamePlayer[] }) => {
      setPlayers(data.leaderboard);
      setGameState(prev => prev ? { ...prev, phase: 'leaderboard' } : prev);
    });
    sock.on('game:ended', () => {
      setEnded(true);
      router.push(`${BASE}/session/${id}/results`);
    });
    sock.on('game:timer', ({ timeLeft }: { timeLeft: number }) => {
      setGameState(prev => prev ? { ...prev, timeLeft } : prev);
    });

    setLoading(false);
  };

  const revealAnswers = () => { socketRef.current?.emit('host:reveal', { sessionId: id }); };
  const nextQuestion  = () => { socketRef.current?.emit('host:next_question', { sessionId: id }); };
  const endGame       = () => { socketRef.current?.emit('host:end_game', { sessionId: id }); };

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#7c3aed] mx-auto" />
        <p className="text-[#94a3b8]">Waiting for game to start…</p>
      </div>
    </div>
  );

  const totalAnswers = gameState ? Object.values(gameState.answerCounts || {}).reduce((s, c) => s + c, 0) : 0;
  const progressPct  = gameState ? (gameState.timeLeft / (gameState.question?.time_limit_seconds || 20)) * 100 : 100;

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex flex-col">
      <CQConnectionBanner socket={socket} />

      {/* Top bar */}
      <header className="bg-[#1a1a2e] border-b border-[#2d2d44] px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {gameState && (
            <div className="flex items-center gap-4">
              <div className="text-sm text-[#94a3b8]">
                Q{(gameState.index || 0) + 1} / {gameState.total}
              </div>
              <div className="w-48 h-2 bg-[#2d2d44] rounded-full overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-[#7c3aed] to-[#06b6d4]" animate={{ width: `${progressPct}%` }} transition={{ duration: 0.5 }} />
              </div>
              <div className={`text-2xl font-black ${(gameState.timeLeft || 0) <= 5 ? 'text-[#ef4444]' : 'text-[#f1f5f9]'}`}>
                {gameState.timeLeft}s
              </div>
            </div>
          )}
          <div className="flex gap-2">
            {gameState?.phase === 'question' && (
              <CQButton size="sm" variant="ghost" onClick={revealAnswers}><Eye className="w-4 h-4" /> Reveal</CQButton>
            )}
            {gameState?.phase === 'reveal' && (
              <CQButton size="sm" onClick={nextQuestion}><ChevronRight className="w-4 h-4" /> Next</CQButton>
            )}
            {gameState?.phase === 'leaderboard' && (
              <CQButton size="sm" onClick={nextQuestion}><SkipForward className="w-4 h-4" /> Continue</CQButton>
            )}
            <CQButton size="sm" variant="danger" onClick={() => setEndConfirm(true)}><X className="w-4 h-4" /> End</CQButton>
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-7xl mx-auto w-full px-4 py-6 gap-6">
        {/* Main content */}
        <div className="flex-1 space-y-6">
          {gameState ? (
            <>
              <AnimatePresence mode="wait">
                <motion.div key={gameState.index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass rounded-2xl p-6">
                  <p className="text-xl md:text-2xl font-bold text-[#f1f5f9] text-center">{gameState.question?.question_text}</p>
                </motion.div>
              </AnimatePresence>

              {gameState.question?.options && (
                <div className="grid grid-cols-2 gap-3">
                  {gameState.question.options.map((opt, i) => {
                    const count = gameState.answerCounts?.[i.toString()] || 0;
                    const pct   = totalAnswers > 0 ? (count / totalAnswers) * 100 : 0;
                    const isCorrect = gameState.phase === 'reveal' && i === gameState.correctIndex;
                    return (
                      <div key={i} className={`rounded-xl p-4 border-2 transition-all overflow-hidden relative ${isCorrect ? 'border-[#22c55e]' : 'border-transparent'}`} style={{ background: ANSWER_COLORS[i] + '22' }}>
                        <div className="flex items-center gap-3 relative z-10">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: ANSWER_COLORS[i] }}>
                            {ANSWER_LABELS[i]}
                          </div>
                          <span className="text-[#f1f5f9] font-medium">{opt.text}</span>
                          <span className="ml-auto text-white font-bold">{count}</span>
                        </div>
                        <div className="absolute inset-0 transition-all" style={{ width: `${pct}%`, background: ANSWER_COLORS[i] + '40' }} />
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#94a3b8]">
                  <BarChart3 className="w-4 h-4" />
                  <span>{totalAnswers} / {players.length} answered</span>
                </div>
                <div className="h-2 flex-1 mx-4 bg-[#2d2d44] rounded-full overflow-hidden">
                  <div className="h-full bg-[#7c3aed] transition-all" style={{ width: players.length > 0 ? `${(totalAnswers / players.length) * 100}%` : '0%' }} />
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-[#94a3b8]">Waiting for the first question…</div>
          )}
        </div>

        {/* Leaderboard sidebar */}
        {players.length > 0 && (
          <aside className="w-64 shrink-0">
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-4 h-4 text-[#f59e0b]" />
                <h3 className="font-bold text-[#f1f5f9] text-sm">Leaderboard</h3>
              </div>
              <div className="space-y-2">
                {players.slice(0, 10).map((p, i) => {
                  const rankDelta = p.prevRank != null ? p.prevRank - p.rank : 0;
                  return (
                    <div key={p.id} className="flex items-center gap-2">
                      <span className={`text-xs font-black w-5 text-right ${i === 0 ? 'text-[#fbbf24]' : i === 1 ? 'text-[#94a3b8]' : i === 2 ? 'text-[#f97316]' : 'text-[#4a4a6a]'}`}>
                        #{i + 1}
                      </span>
                      <span className="flex-1 text-sm text-[#f1f5f9] truncate">{p.name}</span>
                      {rankDelta > 0 && <span className="text-xs text-[#22c55e]">▲{rankDelta}</span>}
                      {rankDelta < 0 && <span className="text-xs text-[#ef4444]">▼{Math.abs(rankDelta)}</span>}
                      <span className="text-xs font-bold text-[#7c3aed]">{formatScore(p.score)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        )}
      </div>

      <CQConfirmDialog
        open={endConfirm}
        onOpenChange={open => { if (!open) setEndConfirm(false); }}
        title="End Session"
        description="Are you sure you want to end the session? All players will be sent to the results screen."
        confirmLabel="End Session"
        variant="danger"
        onConfirm={() => { setEndConfirm(false); endGame(); }}
      />
    </div>
  );
}
