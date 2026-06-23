'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap, Skull, Coins, Castle, Rocket, Puzzle, BookOpen, Infinity, X, Lock, Users, Eye, Music, Timer, Shuffle } from 'lucide-react';
import { cqApi } from '@/lib/cyberquiz/api';
import { useAuthStore } from '@/lib/cyberquiz/stores/authStore';
import { CQModal } from './ui/Modal';
import { CQButton } from './ui/Button';
import { CQBadge } from './ui/Badge';
import type { Quiz } from '@/lib/cyberquiz/types';

const GAME_MODES = [
  { id: 'classic_blitz',  name: 'Classic Blitz',    icon: Zap,      color: '#6bd348', bg: 'from-[#6bd348]/20 to-[#6bd348]/5', desc: 'Speed + accuracy = points. Perfect for any group.', free: true  },
  { id: 'battle_royale',  name: 'Battle Royale',    icon: Skull,    color: '#ef4444', bg: 'from-[#ef4444]/20 to-[#ef4444]/5', desc: 'One wrong answer = one life lost. Last one standing.', free: true  },
  { id: 'gold_rush',      name: 'Gold Rush',        icon: Coins,    color: '#fbbf24', bg: 'from-[#fbbf24]/20 to-[#fbbf24]/5', desc: 'Earn coins, buy power-ups, steal from rivals.',        free: false },
  { id: 'tower_defense',  name: 'Tower Defense',    icon: Castle,   color: '#3b82f6', bg: 'from-[#3b82f6]/20 to-[#3b82f6]/5', desc: 'Build defenses with correct answers.',               free: false },
  { id: 'space_race',     name: 'Space Race',       icon: Rocket,   color: '#06b6d4', bg: 'from-[#06b6d4]/20 to-[#06b6d4]/5', desc: 'Team rocket race. Speed and accuracy push you forward.', free: false },
  { id: 'puzzle_race',    name: 'Puzzle Race',      icon: Puzzle,   color: '#f97316', bg: 'from-[#f97316]/20 to-[#f97316]/5', desc: 'Reveal the hidden image piece by piece.',              free: false },
  { id: 'word_forge',     name: 'Word Forge',       icon: BookOpen, color: '#22c55e', bg: 'from-[#22c55e]/20 to-[#22c55e]/5', desc: 'AI-scored open answers. Closest meaning wins.',       free: false },
  { id: 'infinity_mode',  name: 'Infinity Mode',    icon: Infinity, color: '#6bd348', bg: 'from-[#6bd348]/20 to-[#6bd348]/5', desc: 'Endless loop. Currency keeps accumulating.',          free: false },
];

interface Props { quiz: Quiz; open: boolean; onClose: () => void; }

export function CQGameModeSelector({ quiz, open, onClose }: Props) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState('classic_blitz');
  const [settings, setSettings] = useState({
    timer_visible: true, show_leaderboard: true, team_mode: 'off',
    power_ups: true, music: true, self_paced: false, max_players: 50, shuffle_questions: false,
  });
  const [loading, setLoading] = useState(false);
  const isFree = (user?.tier || 'free') === 'free';

  const handleCreate = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const session = await cqApi.createSession({ quiz_id: quiz.id, game_mode: selectedMode, settings });
      onClose();
      router.push(`/tools/cyberquiz/session/${session.id}/lobby`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CQModal open={open} onClose={onClose} maxWidth="max-w-4xl" className="p-0">
      <div className="flex flex-col md:flex-row h-full">
        {/* Left panel */}
        <div className="md:w-64 p-6 border-b md:border-b-0 md:border-r border-[#2d2d44] flex flex-col gap-4 shrink-0">
          <button onClick={onClose} className="self-end p-1 rounded hover:bg-white/5 transition-colors text-[#94a3b8]">
            <X className="w-5 h-5" />
          </button>
          <div>
            <p className="text-xs text-[#94a3b8] uppercase tracking-wide mb-1">Quiz</p>
            <h3 className="text-lg font-bold text-[#f1f5f9]">{quiz.title}</h3>
            {quiz.subject && <CQBadge variant="purple" className="mt-1">{quiz.subject}</CQBadge>}
          </div>
          <div className="space-y-3 flex-1">
            <p className="text-xs text-[#94a3b8] uppercase tracking-wide">Settings</p>
            {[
              { key: 'timer_visible',     label: 'Show timer',             icon: Timer   },
              { key: 'show_leaderboard',  label: 'Leaderboard between Qs', icon: Eye     },
              { key: 'music',             label: 'Music & sounds',          icon: Music   },
              { key: 'shuffle_questions', label: 'Shuffle questions',       icon: Shuffle },
            ].map(({ key, label, icon: Icon }) => (
              <label key={key} className="flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-2 text-sm text-[#94a3b8]"><Icon className="w-4 h-4" /> {label}</span>
                <button
                  className={`w-10 h-5 rounded-full transition-colors ${settings[key as keyof typeof settings] ? 'bg-[#6bd348]' : 'bg-[#2d2d44]'} relative`}
                  onClick={() => setSettings(s => ({ ...s, [key]: !s[key as keyof typeof settings] }))}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${settings[key as keyof typeof settings] ? 'translate-x-5' : ''}`} />
                </button>
              </label>
            ))}
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-2 text-sm text-[#94a3b8]"><Users className="w-4 h-4" /> Team mode</span>
              <select value={settings.team_mode} onChange={e => setSettings(s => ({ ...s, team_mode: e.target.value }))}
                className="bg-[#0f0f1a] border border-[#2d2d44] text-[#f1f5f9] text-xs rounded px-2 py-1">
                <option value="off">Off</option>
                <option value="2">2 players</option>
                <option value="3">3 players</option>
                <option value="4">4 players</option>
                <option value="auto">Auto</option>
              </select>
            </label>
          </div>
          <CQButton onClick={handleCreate} loading={loading} className="w-full" size="lg">Create Session</CQButton>
        </div>

        {/* Right: Mode grid */}
        <div className="flex-1 p-6">
          <h2 className="text-xl font-bold text-[#f1f5f9] mb-1">Choose Game Mode</h2>
          <p className="text-sm text-[#94a3b8] mb-4">Select how your quiz will be played</p>
          <div className="grid grid-cols-2 gap-3">
            {GAME_MODES.map(mode => {
              const Icon = mode.icon;
              const locked = !mode.free && isFree;
              const selected = selectedMode === mode.id;
              return (
                <motion.button key={mode.id} whileHover={!locked ? { scale: 1.02 } : {}} whileTap={!locked ? { scale: 0.98 } : {}}
                  onClick={() => !locked && setSelectedMode(mode.id)}
                  className={`relative p-4 rounded-xl border text-left transition-all ${selected ? `border-[${mode.color}] bg-gradient-to-br ${mode.bg} shadow-lg` : 'border-[#2d2d44] hover:border-[#3d3d5a] bg-[#0f0f1a]'} ${locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  {locked && <div className="absolute top-2 right-2"><Lock className="w-3.5 h-3.5 text-[#94a3b8]" /></div>}
                  {selected && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: mode.color }}>
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                  <Icon className="w-6 h-6 mb-2" style={{ color: mode.color }} />
                  <p className="text-sm font-semibold text-[#f1f5f9] mb-0.5">{mode.name}</p>
                  <p className="text-xs text-[#94a3b8] leading-tight">{mode.desc}</p>
                  {locked && <p className="text-xs text-[#6bd348] mt-1">Upgrade to unlock</p>}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </CQModal>
  );
}
