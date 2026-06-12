'use client';
import { create } from 'zustand';
import type { Session, Player, Question } from '../types';

export interface GameState {
  session: Session | null;
  players: Player[];
  currentQuestion: Question | null;
  questionStartTime: number | null;
  phase: 'lobby' | 'question' | 'reveal' | 'leaderboard' | 'shop' | 'ended';
  myPlayer: Player | null;
  myAnswer: string | null;
  isCorrect: boolean | null;
  pointsEarned: number;
  coinsEarned: number;
  timeLeft: number;
  answeredCount: number;

  setSession:         (session: Session) => void;
  setPlayers:         (players: Player[]) => void;
  upsertPlayer:       (player: Player) => void;
  removePlayer:       (playerId: string) => void;
  setCurrentQuestion: (q: Question | null) => void;
  setPhase:           (phase: GameState['phase']) => void;
  setMyPlayer:        (player: Player | null) => void;
  setMyAnswer:        (answer: string | null) => void;
  setAnswerResult:    (isCorrect: boolean, points: number, coins: number) => void;
  setTimeLeft:        (t: number) => void;
  setAnsweredCount:   (n: number) => void;
  reset:              () => void;
}

const initial = {
  session: null, players: [], currentQuestion: null, questionStartTime: null,
  phase: 'lobby' as const, myPlayer: null, myAnswer: null, isCorrect: null,
  pointsEarned: 0, coinsEarned: 0, timeLeft: 0, answeredCount: 0,
};

export const useGameStore = create<GameState>((set, get) => ({
  ...initial,
  setSession:         (session)  => set({ session }),
  setPlayers:         (players)  => set({ players }),
  upsertPlayer:       (player)   => set((state) => {
    const idx = state.players.findIndex(p => p.id === player.id);
    if (idx >= 0) { const updated = [...state.players]; updated[idx] = player; return { players: updated }; }
    return { players: [...state.players, player] };
  }),
  removePlayer:       (playerId) => set((state) => ({ players: state.players.filter(p => p.id !== playerId) })),
  setCurrentQuestion: (q)        => set({ currentQuestion: q, questionStartTime: Date.now() }),
  setPhase:           (phase)    => set({ phase }),
  setMyPlayer:        (player)   => set({ myPlayer: player }),
  setMyAnswer:        (answer)   => set({ myAnswer: answer }),
  setAnswerResult:    (isCorrect, points, coins) => set({ isCorrect, pointsEarned: points, coinsEarned: coins }),
  setTimeLeft:        (t)        => set({ timeLeft: t }),
  setAnsweredCount:   (n)        => set({ answeredCount: n }),
  reset:              ()         => set(initial),
}));
