'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { X, Shuffle, BookOpen, ChevronRight, Loader2 } from 'lucide-react';
import { cqApi } from '@/lib/cyberquiz/api';
import { CQButton } from './ui/Button';

interface CourseBank {
  course_code: string;
  course_name: string;
  total_questions: number;
  by_difficulty: { Foundational: number; Intermediate: number; Advanced: number };
  label: string;
  code: string;
  color: string;
}

interface Props { bank: CourseBank; onClose: () => void; }

const DIFFICULTY_OPTIONS = ['All', 'Foundational', 'Intermediate', 'Advanced'];
const COUNT_PRESETS = [10, 20, 30, 50];

export function CQGenerateQuizModal({ bank, onClose }: Props) {
  const router = useRouter();
  const [count, setCount]           = useState(20);
  const [difficulty, setDifficulty] = useState('All');
  const [generating, setGenerating] = useState(false);
  const [error, setError]           = useState('');

  const available    = difficulty === 'All' ? bank.total_questions : (bank.by_difficulty[difficulty as keyof typeof bank.by_difficulty] ?? 0);
  const effectiveCount = Math.min(count, available);

  const handleGenerate = async () => {
    if (available === 0) { setError('No questions available for that filter'); return; }
    setGenerating(true); setError('');
    try {
      const quiz = await cqApi.generateFromBank(bank.course_code, {
        count: effectiveCount,
        difficulty: difficulty === 'All' ? undefined : difficulty,
      });
      onClose();
      router.push(`/tools/cyberquiz/quiz/${quiz.id}/edit`);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to generate quiz');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }} transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="relative w-full max-w-md bg-[#1a1a2e] border border-[#2d2d44] rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-5 flex items-start justify-between gap-3" style={{ background: `${bank.color}18`, borderBottom: `2px solid ${bank.color}30` }}>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold mb-2" style={{ background: `${bank.color}25`, color: bank.color }}>
              <BookOpen className="w-3 h-3" /> {bank.code}
            </div>
            <h2 className="text-lg font-bold text-[#f1f5f9] leading-snug">{bank.label}</h2>
            <p className="text-sm text-[#94a3b8] mt-0.5">{bank.total_questions} questions in bank</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-[#94a3b8] transition-colors shrink-0"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="text-sm font-medium text-[#94a3b8] mb-2 block">Difficulty</label>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTY_OPTIONS.map(d => {
                const avail = d === 'All' ? bank.total_questions : (bank.by_difficulty[d as keyof typeof bank.by_difficulty] ?? 0);
                return (
                  <button key={d} onClick={() => { setDifficulty(d); setCount(c => Math.min(c, avail || c)); }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${difficulty === d ? 'text-white border-transparent' : 'text-[#94a3b8] border-[#2d2d44] hover:border-[#3d3d5a]'}`}
                    style={difficulty === d ? { background: bank.color, borderColor: bank.color } : {}}>
                    {d} <span className="ml-1.5 text-xs opacity-70">({avail})</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-[#94a3b8] mb-2 block">
              Number of Questions <span className="ml-2 text-[#4a4a6a] font-normal">({available} available)</span>
            </label>
            <div className="flex gap-2 mb-3">
              {COUNT_PRESETS.map(n => (
                <button key={n} onClick={() => setCount(Math.min(n, available))} disabled={n > available}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all border ${count === n ? 'text-white border-transparent' : 'text-[#94a3b8] border-[#2d2d44] disabled:opacity-30 disabled:cursor-not-allowed'}`}
                  style={count === n ? { background: bank.color, borderColor: bank.color } : {}}>
                  {n}
                </button>
              ))}
            </div>
            <input type="range" min={5} max={available || 5} step={1} value={Math.min(count, available)}
              onChange={e => setCount(parseInt(e.target.value))} className="w-full" style={{ accentColor: bank.color }} />
            <div className="flex justify-between text-xs text-[#4a4a6a] mt-1">
              <span>5</span>
              <span className="font-bold" style={{ color: bank.color }}>{effectiveCount} questions</span>
              <span>{available}</span>
            </div>
          </div>

          {error && <p className="text-sm text-[#ef4444]">{error}</p>}

          <div className="flex gap-3">
            <CQButton variant="ghost" className="flex-1" onClick={onClose} disabled={generating}>Cancel</CQButton>
            <CQButton className="flex-1" onClick={handleGenerate} disabled={generating || available === 0} style={{ background: bank.color }}>
              {generating
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                : <><Shuffle className="w-4 h-4" /> Generate Quiz <ChevronRight className="w-4 h-4" /></>}
            </CQButton>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
