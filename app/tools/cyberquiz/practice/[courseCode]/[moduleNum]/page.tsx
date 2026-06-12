'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, XCircle, ChevronRight, Trophy, RotateCcw, Loader2, BookOpen, AlertCircle } from 'lucide-react';
import { cqApi } from '@/lib/cyberquiz/api';
import { useAuthStore } from '@/lib/cyberquiz/stores/authStore';

const BASE = '/tools/cyberquiz';

const DIFF_COLOR: Record<string, string> = {
  Basic: '#22c55e', Foundational: '#22c55e',
  Intermediate: '#f59e0b',
  Advanced: '#ef4444',
  Scenario: '#8b5cf6',
};

interface PracticeQuestion {
  id: number;
  difficulty: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_letter: string;
  explanation: string;
}

export default function SoloPracticePage() {
  const params    = useParams<{ courseCode: string; moduleNum: string }>();
  const router    = useRouter();
  const { user }  = useAuthStore();

  const courseCode = params.courseCode?.toUpperCase() ?? '';
  const moduleNum  = parseInt(params.moduleNum ?? '1');

  const [questions,   setQuestions]   = useState<PracticeQuestion[]>([]);
  const [moduleName,  setModuleName]  = useState('');
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [current,     setCurrent]     = useState(0);
  const [selected,    setSelected]    = useState<string | null>(null);
  const [revealed,    setRevealed]    = useState(false);
  const [score,       setScore]       = useState(0);
  const [done,        setDone]        = useState(false);

  useEffect(() => {
    if (!user) { router.replace(`${BASE}/auth?tab=login`); return; }
    if (!courseCode || isNaN(moduleNum)) { setError('Invalid course or module.'); setLoading(false); return; }

    cqApi.getModuleQuestions(courseCode, moduleNum)
      .then(data => {
        setQuestions(data.questions as PracticeQuestion[]);
        setModuleName(data.module_name);
      })
      .catch(err => setError(err.message || 'Failed to load questions.'))
      .finally(() => setLoading(false));
  }, [courseCode, moduleNum]);

  const q = questions[current];

  const handleSelect = (letter: string) => {
    if (revealed) return;
    setSelected(letter);
    setRevealed(true);
    if (letter === q.correct_letter) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) { setDone(true); return; }
    setCurrent(c => c + 1);
    setSelected(null);
    setRevealed(false);
  };

  const restart = () => {
    setCurrent(0); setSelected(null); setRevealed(false); setScore(0); setDone(false);
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#7c3aed] mx-auto mb-3" />
          <p className="text-[#94a3b8]">Loading questions…</p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-[#ef4444] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#f1f5f9] mb-2">Questions not available</h2>
          <p className="text-[#94a3b8] text-sm mb-6">{error}</p>
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold transition-colors">
            <ArrowLeft className="w-4 h-4" /> Go back
          </button>
        </div>
      </div>
    );
  }

  // ── Done screen ────────────────────────────────────────────────────────────
  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    const grade = pct >= 80 ? { label: 'Excellent!', color: '#22c55e' } : pct >= 60 ? { label: 'Good job!', color: '#f59e0b' } : { label: 'Keep practising', color: '#ef4444' };
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4" style={{ color: grade.color }} />
          <h2 className="text-3xl font-black text-[#f1f5f9] mb-1" style={{ color: grade.color }}>{grade.label}</h2>
          <p className="text-[#94a3b8] text-sm mb-6">Module {moduleNum}: {moduleName}</p>
          <div className="text-6xl font-black mb-1" style={{ color: grade.color }}>{pct}%</div>
          <p className="text-[#94a3b8] mb-8">{score} / {questions.length} correct</p>
          <div className="flex gap-3">
            <button onClick={restart}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl glass-sm text-[#94a3b8] hover:text-white font-semibold transition-all">
              <RotateCcw className="w-4 h-4" /> Retry
            </button>
            <button onClick={() => router.push(`${BASE}/dashboard`)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold transition-colors">
              Dashboard <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz screen ────────────────────────────────────────────────────────────
  const options: Array<{ letter: string; text: string }> = [
    { letter: 'A', text: q.option_a },
    { letter: 'B', text: q.option_b },
    { letter: 'C', text: q.option_c },
    { letter: 'D', text: q.option_d },
  ];

  const progress = ((current + (revealed ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="sticky top-24 z-30 mb-6 flex items-center justify-between glass rounded-xl px-4 py-3">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-[#94a3b8] hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2 text-sm text-[#94a3b8]">
          <BookOpen className="w-4 h-4" />
          <span className="hidden sm:inline">{courseCode} — Module {moduleNum}</span>
          <span className="text-[#f1f5f9] font-semibold">{current + 1} / {questions.length}</span>
        </div>
        <div className="text-sm font-bold" style={{ color: '#22c55e' }}>{score} pts</div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-white/[0.06] mb-8 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Question card */}
      <div className="glass rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${DIFF_COLOR[q.difficulty] ?? '#94a3b8'}20`, color: DIFF_COLOR[q.difficulty] ?? '#94a3b8' }}>
            {q.difficulty}
          </span>
          <span className="text-xs text-[#64748b]">Q{current + 1}</span>
        </div>
        <p className="text-[#f1f5f9] font-medium leading-relaxed text-base">{q.question_text}</p>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-4">
        {options.map(({ letter, text }) => {
          const isCorrect  = letter === q.correct_letter;
          const isSelected = letter === selected;
          let style = 'glass glass-hover border border-white/5';
          if (revealed) {
            if (isCorrect)       style = 'border-2 border-[#22c55e] bg-[#22c55e]/10';
            else if (isSelected) style = 'border-2 border-[#ef4444] bg-[#ef4444]/10';
            else                 style = 'glass opacity-50';
          }
          return (
            <button key={letter} onClick={() => handleSelect(letter)}
              className={`w-full text-left px-4 py-3.5 rounded-xl transition-all flex items-start gap-3 ${style}`}
              disabled={revealed}>
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black shrink-0 ${revealed && isCorrect ? 'bg-[#22c55e] text-white' : revealed && isSelected ? 'bg-[#ef4444] text-white' : 'bg-white/10 text-[#94a3b8]'}`}>
                {letter}
              </span>
              <span className="text-sm text-[#f1f5f9] leading-snug flex-1">{text}</span>
              {revealed && isCorrect  && <CheckCircle2 className="w-5 h-5 text-[#22c55e] shrink-0 mt-0.5" />}
              {revealed && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-[#ef4444] shrink-0 mt-0.5" />}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {revealed && q.explanation && (
        <div className="rounded-xl border border-[#7c3aed]/30 bg-[#7c3aed]/5 px-5 py-4 mb-4">
          <p className="text-xs font-bold text-[#a78bfa] mb-1.5 uppercase tracking-wide">Explanation</p>
          <p className="text-sm text-[#cbd5e1] leading-relaxed">{q.explanation}</p>
        </div>
      )}

      {/* Next button */}
      {revealed && (
        <button onClick={handleNext}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#7c3aed]/30 hover:opacity-90 transition-opacity">
          {current + 1 >= questions.length ? <><Trophy className="w-5 h-5" /> See Results</> : <>Next Question <ChevronRight className="w-5 h-5" /></>}
        </button>
      )}
    </div>
  );
}
