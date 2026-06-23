'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Copy, Check, Play, X, ChevronLeft, Loader2, QrCode } from 'lucide-react';
import { cqApi } from '@/lib/cyberquiz/api';
import { useAuthStore } from '@/lib/cyberquiz/stores/authStore';
import { getSocket } from '@/lib/cyberquiz/socket';
import { CQButton } from '@/components/cyberquiz/ui/Button';
import { CQAvatar } from '@/components/cyberquiz/ui/Avatar';
import { CQBadge } from '@/components/cyberquiz/ui/Badge';
import { CQConnectionBanner } from '@/components/cyberquiz/ConnectionBanner';

const BASE = '/tools/cyberquiz';

interface LobbyPlayer { id: string; name: string; avatar?: string; joinedAt: string; }
interface SessionInfo { id: string; join_code: string; quiz_title?: string; game_mode: string; settings: Record<string, unknown>; }

export default function SessionLobbyPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const router = useRouter();

  const [session, setSession]   = useState<SessionInfo | null>(null);
  const [players, setPlayers]   = useState<LobbyPlayer[]>([]);
  const [loading, setLoading]   = useState(true);
  const [starting, setStarting] = useState(false);
  const [copied, setCopied]     = useState(false);
  const [socket, setSocket]     = useState<ReturnType<typeof getSocket> | null>(null);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (!id) return;
    loadSession();
    return () => { socket?.disconnect(); };
  }, [id]);

  const loadSession = async () => {
    setLoading(true);
    try {
      const s = await cqApi.getSession(id!);
      setSession(s as unknown as SessionInfo);
      initSocket(s as unknown as SessionInfo);
    } catch (err: unknown) {
      setError((err as Error).message || 'Session not found');
    } finally {
      setLoading(false);
    }
  };

  const initSocket = (s: SessionInfo) => {
    const sock = getSocket();
    setSocket(sock);

    sock.emit('host:join', { sessionId: s.id });

    sock.on('lobby:player_joined', (player: LobbyPlayer) => {
      setPlayers(prev => [...prev.filter(p => p.id !== player.id), player]);
    });
    sock.on('lobby:player_left', ({ playerId }: { playerId: string }) => {
      setPlayers(prev => prev.filter(p => p.id !== playerId));
    });
    sock.on('lobby:players', (list: LobbyPlayer[]) => {
      setPlayers(list);
    });
    sock.on('game:started', () => {
      router.push(`${BASE}/session/${s.id}/host`);
    });
  };

  const handleStart = async () => {
    if (!session) return;
    setStarting(true);
    try {
      await cqApi.startSession(session.id);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to start session');
      setStarting(false);
    }
  };

  const handleKick = (playerId: string) => {
    socket?.emit('host:kick_player', { playerId });
    setPlayers(prev => prev.filter(p => p.id !== playerId));
  };

  const copyCode = () => {
    if (!session?.join_code) return;
    navigator.clipboard.writeText(session.join_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = () => {
    const url = `${window.location.origin}${BASE}/join`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#6bd348]" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center text-center px-4">
      <div>
        <p className="text-[#f87171] mb-4">{error}</p>
        <CQButton onClick={() => router.push(`${BASE}/dashboard`)}>Back to Dashboard</CQButton>
      </div>
    </div>
  );

  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}${BASE}/join` : '';

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <CQConnectionBanner socket={socket} />

      <header className="bg-[#1a1a2e] border-b border-[#2d2d44] px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push(`${BASE}/dashboard`)} className="p-1.5 rounded-lg hover:bg-white/5 text-[#94a3b8] transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-[#f1f5f9] truncate">{session?.quiz_title || 'Quiz Lobby'}</h1>
          <CQBadge variant="purple" className="capitalize">{session?.game_mode?.replace(/_/g, ' ')}</CQBadge>
        </div>
        <CQButton onClick={handleStart} loading={starting} disabled={players.length === 0}>
          <Play className="w-4 h-4" /> Start Game
        </CQButton>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Join info */}
        <div className="space-y-6">
          <div className="glass rounded-2xl p-6 text-center">
            <p className="text-sm text-[#94a3b8] mb-2">Join at</p>
            <p className="text-lg font-semibold text-[#f1f5f9] mb-4">{joinUrl}</p>
            <div className="text-5xl font-black text-[#f1f5f9] tracking-widest mb-4 font-mono">
              {session?.join_code}
            </div>
            <div className="flex gap-2">
              <CQButton variant="ghost" size="sm" className="flex-1" onClick={copyCode}>
                {copied ? <Check className="w-4 h-4 text-[#22c55e]" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Code'}
              </CQButton>
              <CQButton variant="ghost" size="sm" className="flex-1" onClick={copyLink}>
                <QrCode className="w-4 h-4" /> Copy Link
              </CQButton>
            </div>
          </div>

          <div className="glass rounded-2xl p-5 space-y-3">
            <p className="text-sm font-semibold text-[#94a3b8]">Session Settings</p>
            {session?.settings && Object.entries(session.settings).filter(([, v]) => typeof v === 'boolean').map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-sm">
                <span className="text-[#94a3b8] capitalize">{k.replace(/_/g, ' ')}</span>
                <span className={v ? 'text-[#22c55e]' : 'text-[#4a4a6a]'}>{v ? 'On' : 'Off'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Player list */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#6bd348]" />
              <h2 className="font-bold text-[#f1f5f9]">Players</h2>
            </div>
            <div className="text-2xl font-black text-[#6bd348]">{players.length}</div>
          </div>

          {players.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-[#1a1a2e] border border-[#2d2d44] flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-[#2d2d44]" />
              </div>
              <p className="text-[#94a3b8]">Waiting for players to join…</p>
              <p className="text-sm text-[#4a4a6a] mt-1">Share the code above</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <AnimatePresence>
                {players.map(player => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="glass rounded-xl p-4 flex flex-col items-center gap-2 group relative"
                  >
                    <CQAvatar seed={player.id} size={48} />
                    <p className="text-sm font-medium text-[#f1f5f9] text-center truncate w-full">{player.name}</p>
                    <button
                      onClick={() => handleKick(player.id)}
                      className="absolute top-2 right-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[#ef4444]/10 text-[#94a3b8] hover:text-[#ef4444] transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {players.length > 0 && (
            <div className="mt-6 text-center">
              <CQButton size="lg" onClick={handleStart} loading={starting} className="px-12">
                <Play className="w-5 h-5" /> Start with {players.length} player{players.length !== 1 ? 's' : ''}
              </CQButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
