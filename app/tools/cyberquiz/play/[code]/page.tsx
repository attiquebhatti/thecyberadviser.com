'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Check, X, Loader2, Zap, Star } from 'lucide-react';
import { getSocket } from '@/lib/cyberquiz/socket';
import { CQButton } from '@/components/cyberquiz/ui/Button';
import { CQAvatar } from '@/components/cyberquiz/ui/Avatar';
import { CQConnectionBanner } from '@/components/cyberquiz/ConnectionBanner';
import { celebrateCorrect, celebrateWin } from '@/lib/cyberquiz/confetti';
import { formatScore } from '@/lib/cyberquiz/utils';

const BASE = '/tools/cyberquiz';
const ANSWER_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981'];
const ANSWER_LABELS = ['A', 'B', 'C', 'D'];
const AVATARS = ['🦊', '🐼', '🦋', '🐬', '🦁', '🐸', '🦅', '🐙'];

type Phase = 'join' | 'lobby' | 'question' | 'answered' | 'reveal' | 'leaderboard' | 'ended';

interface GameQuestion { question_text: string; type: string; options?: { text: string; is_correct: boolean }[]; time_limit_seconds: number; points: number; }
interface LeaderboardEntry { id: string; name: string; score: number; rank: number; }

export default function PlayerViewPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();

  const [phase, setPhase]           = useState<Phase>('join');
  const [name, setName]             = useState('');
  const [avatar, setAvatar]         = useState(AVATARS[0]);
  const [joining, setJoining]       = useState(false);
  const [joinError, setJoinError]   = useState('');
  const [playerId, setPlayerId]     = useState<string | null>(null);
  const [sessionId, setSessionId]   = useState<string | null>(null);

  const [lobbyPlayers, setLobbyPlayers] = useState<number>(0);

  const [question, setQuestion]     = useState<GameQuestion | null>(null);
  const [qIndex, setQIndex]         = useState(0);
  const [totalQ, setTotalQ]         = useState(0);
  const [timeLeft, setTimeLeft]     = useState(0);
  const [selectedAnswer, setSelected] = useState<number | null>(null);
  const [correctAnswer, setCorrect] = useState<number | null>(null);
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);
  const [isCorrect, setIsCorrect]   = useState<boolean | null>(null);
  const [score, setScore]           = useState(0);
  const [rank, setRank]             = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lives, setLives]           = useState(3);
  const [streak, setStreak]         = useState(0);

  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const [socket, setSocket]         = useState<ReturnType<typeof getSocket> | null>(null);

  useEffect(() => {
    return () => { socketRef.current?.disconnect(); };
  }, []);

  const initSocket = (pid: string, sid: string) => {
    const sock = getSocket();
    socketRef.current = sock;
    setSocket(sock);

    sock.on('lobby:player_joined', () => setLobbyPlayers(n => n + 1));
    sock.on('lobby:player_left',   () => setLobbyPlayers(n => Math.max(0, n - 1)));
    sock.on('lobby:players', (players: { id: string }[]) => setLobbyPlayers(players.length));

    sock.on('game:question', (data: { question: GameQuestion; index: number; total: number; timeLeft: number }) => {
      setQuestion(data.question);
      setQIndex(data.index);
      setTotalQ(data.total);
      setTimeLeft(data.timeLeft);
      setSelected(null);
      setCorrect(null);
      setPointsEarned(null);
      setIsCorrect(null);
      setPhase('question');
    });

    sock.on('game:timer', ({ timeLeft: t }: { timeLeft: number }) => setTimeLeft(t));

    sock.on('game:answer_result', (data: { correct: boolean; correctIndex: number; pointsEarned: number; totalScore: number; rank: number; streak: number; livesLeft?: number }) => {
      setIsCorrect(data.correct);
      setCorrect(data.correctIndex);
      setPointsEarned(data.pointsEarned);
      setScore(data.totalScore);
      setRank(data.rank);
      setStreak(data.streak);
      if (data.livesLeft != null) setLives(data.livesLeft);
      setPhase('answered');
      if (data.correct) celebrateCorrect();
    });

    sock.on('game:reveal', (data: { correctIndex: number }) => {
      setCorrect(data.correctIndex);
      setPhase('reveal');
    });

    sock.on('game:leaderboard', (data: { leaderboard: LeaderboardEntry[]; yourRank: number; yourScore: number }) => {
      setLeaderboard(data.leaderboard);
      setRank(data.yourRank);
      setScore(data.yourScore);
      setPhase('leaderboard');
    });

    sock.on('game:ended', (data: { leaderboard: LeaderboardEntry[]; yourRank: number; yourScore: number }) => {
      setLeaderboard(data.leaderboard);
      setRank(data.yourRank);
      setScore(data.yourScore);
      setPhase('ended');
      if (data.yourRank === 1) celebrateWin();
    });

    sock.on('game:kicked', () => {
      router.push(BASE);
    });

    sock.on('game:eliminated', () => {
      setPhase('ended');
    });
  };

  const handleJoin = async () => {
    if (!name.trim()) { setJoinError('Please enter your name'); return; }
    setJoining(true); setJoinError('');
    try {
      const res = await fetch(`/api/cyberquiz/sessions/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ join_code: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join');

      const pid = data.playerId || `guest-${Date.now()}`;
      const sid = data.sessionId;
      setPlayerId(pid);
      setSessionId(sid);
      setPhase('lobby');

      initSocket(pid, sid);

      const sock = socketRef.current!;
      sock.emit('player:join', { sessionId: sid, playerId: pid, name: name.trim(), avatar });
    } catch (err: unknown) {
      setJoinError((err as Error).message || 'Could not join session');
    } finally {
      setJoining(false);
    }
  };

  const submitAnswer = (idx: number) => {
    if (selectedAnswer !== null) return;
    setSelected(idx);
    socketRef.current?.emit('player:answer', {
      sessionId,
      playerId,
      answer: idx,
      timeLeft,
    });
  };

  const renderJoin = () => (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎮</div>
          <h1 className="text-3xl font-black font-display mb-2">Joining Game</h1>
          <p className="text-[#94a3b8]">Code: <span className="font-mono font-bold text-[#10b981]">{code}</span></p>
        </div>
        <div className="glass rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-[#94a3b8] mb-2">Your Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="Enter your name…" maxLength={20}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0f0f1a] border border-[#2d2d44] text-[#f1f5f9] placeholder:text-[#4a4a6a] focus:outline-none focus:border-[#10b981] transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#94a3b8] mb-2">Pick an Avatar</label>
            <div className="grid grid-cols-4 gap-2">
              {AVATARS.map(av => (
                <button key={av} onClick={() => setAvatar(av)}
                  className={`text-2xl p-3 rounded-xl transition-all ${avatar === av ? 'bg-[#10b981] ring-2 ring-[#10b981]/50' : 'bg-[#0f0f1a] hover:bg-white/5'}`}>
                  {av}
                </button>
              ))}
            </div>
          </div>
          {joinError && <p className="text-sm text-[#f87171]">{joinError}</p>}
          <CQButton className="w-full" size="lg" loading={joining} onClick={handleJoin}>
            Join Now
          </CQButton>
        </div>
      </motion.div>
    </div>
  );

  const renderLobby = () => (
    <div className="min-h-screen bg-[#0f0f1a] flex flex-col items-center justify-center text-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
        <div className="text-6xl">{avatar}</div>
        <div>
          <h2 className="text-2xl font-bold text-[#f1f5f9] mb-1">{name}</h2>
          <p className="text-[#94a3b8]">You're in! Waiting for the host to start…</p>
        </div>
        <div className="flex items-center gap-2 text-[#94a3b8]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{lobbyPlayers} player{lobbyPlayers !== 1 ? 's' : ''} in lobby</span>
        </div>
        <div className="w-32 h-1 bg-[#2d2d44] rounded-full overflow-hidden mx-auto">
          <motion.div className="h-full bg-[#10b981] rounded-full" animate={{ x: ['-100%', '200%'] }} transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }} />
        </div>
      </motion.div>
    </div>
  );

  const renderQuestion = () => {
    if (!question) return null;
    const progressPct = (timeLeft / (question.time_limit_seconds || 20)) * 100;
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex flex-col">
        {/* Timer bar */}
        <div className="h-2 bg-[#2d2d44]">
          <motion.div className="h-full bg-gradient-to-r from-[#10b981] to-[#06b6d4]" animate={{ width: `${progressPct}%` }} transition={{ duration: 0.5 }} />
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-[#94a3b8]">Q{qIndex + 1}/{totalQ}</span>
          <div className={`text-2xl font-black ${timeLeft <= 5 ? 'text-[#ef4444]' : 'text-[#f1f5f9]'}`}>{timeLeft}s</div>
          <div className="flex items-center gap-1">
            <Zap className="w-4 h-4 text-[#10b981]" />
            <span className="text-sm font-bold text-[#10b981]">{formatScore(score)}</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col px-4 pb-6 gap-4">
          <div className="glass rounded-2xl p-5 text-center flex-1 flex items-center justify-center">
            <p className="text-lg md:text-xl font-bold text-[#f1f5f9]">{question.question_text}</p>
          </div>

          {question.type === 'true_false' ? (
            <div className="grid grid-cols-2 gap-3">
              {['True', 'False'].map((v, i) => (
                <button key={v} onClick={() => submitAnswer(i)}
                  className={`py-6 rounded-2xl text-xl font-bold transition-all border-2 ${selectedAnswer === i ? 'border-[#10b981] bg-[#10b981]/20 scale-95' : 'border-[#2d2d44] bg-[#1a1a2e] hover:border-[#3d3d5a] active:scale-95'} ${selectedAnswer !== null && selectedAnswer !== i ? 'opacity-50' : ''}`}>
                  {v}
                </button>
              ))}
            </div>
          ) : question.type === 'multiple_choice' && question.options ? (
            <div className="grid grid-cols-2 gap-3">
              {question.options.map((opt, i) => (
                <button key={i} onClick={() => submitAnswer(i)}
                  className={`py-4 px-3 rounded-2xl text-sm font-semibold transition-all border-2 text-white ${selectedAnswer === i ? 'border-white scale-95' : 'border-transparent hover:scale-98 active:scale-95'} ${selectedAnswer !== null && selectedAnswer !== i ? 'opacity-60' : ''}`}
                  style={{ background: selectedAnswer === i ? ANSWER_COLORS[i] : ANSWER_COLORS[i] + 'cc' }}>
                  <span className="block text-lg font-black mb-1">{ANSWER_LABELS[i]}</span>
                  {opt.text}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center text-[#94a3b8]">Answer via the host screen</div>
          )}
        </div>
      </div>
    );
  };

  const renderAnswered = () => (
    <div className="min-h-screen bg-[#0f0f1a] flex flex-col items-center justify-center px-4 text-center">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-6">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto ${isCorrect ? 'bg-[#22c55e]/20 border-4 border-[#22c55e]' : 'bg-[#ef4444]/20 border-4 border-[#ef4444]'}`}>
          {isCorrect ? <Check className="w-12 h-12 text-[#22c55e]" /> : <X className="w-12 h-12 text-[#ef4444]" />}
        </div>
        <div>
          <h2 className="text-3xl font-black mb-1">{isCorrect ? 'Correct!' : 'Wrong'}</h2>
          {pointsEarned != null && isCorrect && (
            <p className="text-[#10b981] font-bold text-xl">+{formatScore(pointsEarned)} pts</p>
          )}
          {streak > 1 && isCorrect && (
            <div className="flex items-center gap-1 justify-center mt-2">
              <Star className="w-4 h-4 text-[#fbbf24]" /> <span className="text-[#fbbf24] text-sm font-bold">{streak}x streak!</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-2xl font-black text-[#f1f5f9]">{formatScore(score)}</p>
          <p className="text-[#94a3b8] text-sm">total score</p>
        </div>
        <p className="text-[#94a3b8] text-sm">Waiting for other players…</p>
      </motion.div>
    </div>
  );

  const renderReveal = () => {
    if (!question || correctAnswer === null) return null;
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex flex-col px-4 py-8">
        <h2 className="text-xl font-bold text-[#f1f5f9] text-center mb-6">{question.question_text}</h2>
        {question.options && (
          <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto w-full">
            {question.options.map((opt, i) => {
              const myAnswer = selectedAnswer === i;
              const isCorr   = i === correctAnswer;
              return (
                <div key={i} className={`p-4 rounded-2xl border-2 ${isCorr ? 'border-[#22c55e] bg-[#22c55e]/10' : myAnswer ? 'border-[#ef4444] bg-[#ef4444]/10' : 'border-[#2d2d44] opacity-50'}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: ANSWER_COLORS[i] }}>
                      {ANSWER_LABELS[i]}
                    </div>
                    <span className="text-sm text-[#f1f5f9]">{opt.text}</span>
                    {isCorr && <Check className="w-4 h-4 text-[#22c55e] ml-auto" />}
                    {myAnswer && !isCorr && <X className="w-4 h-4 text-[#ef4444] ml-auto" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-center text-sm text-[#94a3b8] mt-6">Waiting for next question…</p>
      </div>
    );
  };

  const renderLeaderboard = () => (
    <div className="min-h-screen bg-[#0f0f1a] px-4 py-8">
      <div className="max-w-sm mx-auto">
        <div className="text-center mb-6">
          <Trophy className="w-8 h-8 text-[#f59e0b] mx-auto mb-2" />
          <h2 className="text-2xl font-black text-[#f1f5f9]">Leaderboard</h2>
          <p className="text-[#94a3b8]">Your rank: <span className="font-bold text-[#10b981]">#{rank}</span></p>
        </div>
        <div className="space-y-2">
          {leaderboard.slice(0, 10).map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 p-3 rounded-xl ${p.id === playerId ? 'bg-[#10b981]/20 border border-[#10b981]/30' : 'bg-[#1a1a2e]'}`}>
              <span className={`text-sm font-black w-6 text-center ${p.rank === 1 ? 'text-[#fbbf24]' : p.rank === 2 ? 'text-[#94a3b8]' : p.rank === 3 ? 'text-[#f97316]' : 'text-[#4a4a6a]'}`}>#{p.rank}</span>
              <CQAvatar seed={p.id} size={32} />
              <span className="flex-1 text-sm text-[#f1f5f9] truncate">{p.name}</span>
              <span className="text-sm font-bold text-[#10b981]">{formatScore(p.score)}</span>
            </motion.div>
          ))}
        </div>
        <p className="text-center text-sm text-[#94a3b8] mt-6">Next question coming up…</p>
      </div>
    </div>
  );

  const renderEnded = () => (
    <div className="min-h-screen bg-[#0f0f1a] flex flex-col items-center justify-center px-4 text-center">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
        <div className="text-6xl">{rank === 1 ? '🏆' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🎉'}</div>
        <div>
          <h2 className="text-3xl font-black mb-1">Game Over!</h2>
          <p className="text-[#94a3b8]">You finished #{rank} with {formatScore(score)} points</p>
        </div>
        {leaderboard.slice(0, 5).length > 0 && (
          <div className="w-full max-w-xs space-y-2">
            {leaderboard.slice(0, 5).map((p, i) => (
              <div key={p.id} className={`flex items-center gap-3 p-2.5 rounded-xl text-sm ${p.id === playerId ? 'bg-[#10b981]/20 border border-[#10b981]/30' : 'bg-[#1a1a2e]'}`}>
                <span className="font-black text-[#4a4a6a] w-4">#{i + 1}</span>
                <span className="flex-1 text-[#f1f5f9] truncate">{p.name}</span>
                <span className="font-bold text-[#10b981]">{formatScore(p.score)}</span>
              </div>
            ))}
          </div>
        )}
        <CQButton onClick={() => router.push(BASE)}>Back to CyberQuiz</CQButton>
      </motion.div>
    </div>
  );

  return (
    <>
      <CQConnectionBanner socket={socket} />
      <AnimatePresence mode="wait">
        {phase === 'join'         && <motion.div key="join"         initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderJoin()}</motion.div>}
        {phase === 'lobby'        && <motion.div key="lobby"        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderLobby()}</motion.div>}
        {phase === 'question'     && <motion.div key="question"     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderQuestion()}</motion.div>}
        {phase === 'answered'     && <motion.div key="answered"     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderAnswered()}</motion.div>}
        {phase === 'reveal'       && <motion.div key="reveal"       initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderReveal()}</motion.div>}
        {phase === 'leaderboard'  && <motion.div key="leaderboard"  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderLeaderboard()}</motion.div>}
        {phase === 'ended'        && <motion.div key="ended"        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderEnded()}</motion.div>}
      </AnimatePresence>
    </>
  );
}
