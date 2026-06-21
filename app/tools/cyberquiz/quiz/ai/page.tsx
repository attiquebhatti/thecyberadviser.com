'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronLeft, Play, Save, Trash2, RefreshCw, Plus, Check, BookOpen, FileText, Loader2, FileSliders as Sliders } from 'lucide-react';
import { cqApi } from '@/lib/cyberquiz/api';
import { useAuthStore } from '@/lib/cyberquiz/stores/authStore';
import { CQButton } from '@/components/cyberquiz/ui/Button';
import { CQBadge } from '@/components/cyberquiz/ui/Badge';
import { CQGameModeSelector } from '@/components/cyberquiz/GameModeSelector';
import type { Quiz } from '@/lib/cyberquiz/types';

const BASE = '/tools/cyberquiz';

const LOADING_TEXTS = ['Generating questions…', 'Crafting distractors…', 'Scoring difficulty…', 'Adding explanations…', 'Finalizing your quiz…'];

type GeneratedQuestion = {
  type: string;
  question: string;
  options: string[];
  correct_index: number;
  correct_answer?: string;
  explanation: string;
  _editing?: boolean;
};

function AIGeneratorContent() {
  const { user } = useAuthStore();
  const router = useRouter();
  const params = useSearchParams();

  const [inputTab, setInputTab]       = useState<'topic' | 'notes'>('topic');
  const [topic, setTopic]             = useState(params.get('topic') || '');
  const [notes, setNotes]             = useState('');
  const [numQuestions, setNumQ]       = useState(Number(params.get('count')) || 10);
  const [types, setTypes]             = useState(['multiple_choice', 'true_false']);
  const [difficulty, setDifficulty]   = useState(params.get('difficulty') || 'balanced');
  const [subject, setSubject]         = useState(params.get('subject') || 'Palo Alto Networks');
  const [gradeLevel, setGradeLevel]   = useState(params.get('level') || 'Professional');

  const [loading, setLoading]             = useState(false);
  const [loadingText, setLoadingText]     = useState(LOADING_TEXTS[0]);
  const [loadingProgress, setLoadingProg] = useState(0);
  const [error, setError]                 = useState('');
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [questions, setQuestions]         = useState<GeneratedQuestion[]>([]);
  const [savedQuiz, setSavedQuiz]         = useState<Quiz | null>(null);
  const [launchOpen, setLaunchOpen]       = useState(false);
  const [saving, setSaving]               = useState(false);

  useEffect(() => {
    if (params.get('autoGenerate') === '1' && topic.trim()) {
      setTimeout(() => generate(), 300);
    }
  }, []);

  const toggleType = (t: string) =>
    setTypes(prev => prev.includes(t) ? (prev.length > 1 ? prev.filter(x => x !== t) : prev) : [...prev, t]);

  const generate = async () => {
    const input = inputTab === 'topic' ? topic.trim() : notes.trim();
    if (!input) { setError('Please enter a topic or paste notes first'); return; }
    setLoading(true); setError(''); setQuestions([]); setLoadingProg(0);
    const interval = setInterval(() => {
      setLoadingProg(p => Math.min(p + 12, 90));
      setLoadingText(LOADING_TEXTS[Math.floor(Math.random() * LOADING_TEXTS.length)]);
    }, 600);
    try {
      const data = await cqApi.generateQuiz({ topic: input, questionCount: numQuestions, types, difficulty });
      setLoadingProg(100);
      setGeneratedTitle(`${subject} — ${input.slice(0, 40)}`);
      const mapped = (data.questions || []).map((q: Record<string, unknown>) => ({
        type:          q.type as string,
        question:      (q.question_text as string) || '',
        options:       Array.isArray(q.options) ? (q.options as Array<{ text: string; is_correct: boolean }>).map(o => o.text) : [],
        correct_index: Array.isArray(q.options) ? Math.max(0, (q.options as Array<{ text: string; is_correct: boolean }>).findIndex(o => o.is_correct)) : 0,
        correct_answer: (q.correct_answer as string) || '',
        explanation:   (q.explanation as string) || '',
      }));
      setQuestions(mapped);
    } catch (err: unknown) {
      setError((err as Error).message || 'Generation failed. Please try again.');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const regenerateQuestion = async (idx: number) => {
    const q = questions[idx];
    const input = inputTab === 'topic' ? topic.trim() : notes.trim();
    setQuestions(prev => prev.map((item, i) => i === idx ? { ...item, _editing: true } : item));
    try {
      const data = await cqApi.generateQuiz({ topic: input, questionCount: 1, types: [q.type], difficulty });
      const raw = data.questions?.[0] as Record<string, unknown> | undefined;
      if (raw) {
        const mapped = {
          type: raw.type as string, question: (raw.question_text as string) || '',
          options: Array.isArray(raw.options) ? (raw.options as Array<{ text: string; is_correct: boolean }>).map(o => o.text) : [],
          correct_index: Array.isArray(raw.options) ? Math.max(0, (raw.options as Array<{ text: string; is_correct: boolean }>).findIndex(o => o.is_correct)) : 0,
          correct_answer: (raw.correct_answer as string) || '', explanation: (raw.explanation as string) || '',
        };
        setQuestions(prev => prev.map((item, i) => i === idx ? mapped : item));
      }
    } catch {
      setQuestions(prev => prev.map((item, i) => i === idx ? { ...item, _editing: false } : item));
    }
  };

  const updateQ = (idx: number, field: keyof GeneratedQuestion, value: unknown) =>
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));

  const saveToLibrary = async () => {
    if (!user || !questions.length) return;
    setSaving(true);
    try {
      const quiz = await cqApi.createQuiz({ title: generatedTitle, subject, grade_level: gradeLevel });
      const questionsToSave = questions.map((q, i) => ({
        order_index: i,
        type: q.type as 'multiple_choice' | 'true_false' | 'short_answer' | 'poll' | 'word_cloud' | 'ordering' | 'slider' | 'fill_blank',
        question_text: q.question,
        options: q.options?.length ? q.options.map((opt, oi) => ({ text: opt, is_correct: oi === q.correct_index })) : undefined,
        correct_answer: q.correct_answer || (q.options?.[q.correct_index] ?? null),
        explanation: q.explanation || null,
        time_limit_seconds: 20, points: 1000,
        difficulty: (difficulty === 'easy' ? 'easy' : difficulty === 'hard' ? 'hard' : 'medium') as 'easy' | 'medium' | 'hard',
      }));
      await cqApi.bulkSaveQuestions(quiz.id, questionsToSave);
      setSavedQuiz(quiz);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const ANSWER_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981'];
  const ANSWER_LABELS = ['A', 'B', 'C', 'D'];

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <header className="sticky top-24 z-30 bg-[#1a1a2e] border-b border-[#2d2d44] px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push(`${BASE}/dashboard`)} className="p-1.5 rounded-lg hover:bg-white/5 text-[#94a3b8] transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#10b981]" />
          <h1 className="font-bold text-[#f1f5f9]">AI Quiz Generator</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {questions.length === 0 && !loading ? (
          <>
            <div>
              <h2 className="text-2xl font-bold text-[#f1f5f9] mb-1">Generate a Quiz with AI</h2>
              <p className="text-[#94a3b8]">Powered by Groq llama-3.3-70b — full quiz in seconds</p>
            </div>

            {/* Input tabs */}
            <div className="flex rounded-lg bg-[#1a1a2e] border border-[#2d2d44] p-1 gap-1">
              {[{ id: 'topic', label: 'Topic', icon: BookOpen }, { id: 'notes', label: 'Paste Notes', icon: FileText }].map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setInputTab(id as 'topic' | 'notes')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${inputTab === id ? 'bg-[#10b981] text-[#04130c]' : 'text-[#94a3b8] hover:text-[#f1f5f9]'}`}>
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>

            {inputTab === 'topic' ? (
              <input value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && generate()}
                placeholder="e.g. PCNSE firewall policies, Prisma Access, Cortex XDR…"
                className="w-full px-4 py-3 rounded-xl bg-[#1a1a2e] border border-[#2d2d44] text-[#f1f5f9] placeholder:text-[#4a4a6a] focus:outline-none focus:border-[#10b981] transition-colors" />
            ) : (
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Paste lecture notes, study guides, or any text here…"
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-[#1a1a2e] border border-[#2d2d44] text-[#f1f5f9] placeholder:text-[#4a4a6a] focus:outline-none focus:border-[#10b981] transition-colors resize-none" />
            )}

            {/* Config */}
            <div className="rounded-xl bg-[#1a1a2e] border border-[#2d2d44] p-5 space-y-5">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#94a3b8]" />
                <span className="text-sm font-semibold text-[#f1f5f9]">Configuration</span>
              </div>
              <div>
                <label className="text-sm text-[#94a3b8] mb-2 block">Questions: <span className="text-[#f1f5f9] font-semibold">{numQuestions}</span></label>
                <input type="range" min={5} max={30} step={1} value={numQuestions} onChange={e => setNumQ(Number(e.target.value))} className="w-full accent-[#10b981]" />
                <div className="flex justify-between text-xs text-[#4a4a6a] mt-1"><span>5</span><span>30</span></div>
              </div>
              <div>
                <label className="text-sm text-[#94a3b8] mb-2 block">Question Types</label>
                <div className="flex flex-wrap gap-2">
                  {[{ id: 'multiple_choice', label: 'Multiple Choice' }, { id: 'true_false', label: 'True/False' }, { id: 'short_answer', label: 'Short Answer' }, { id: 'fill_blank', label: 'Fill in Blank' }].map(t => (
                    <button key={t.id} onClick={() => toggleType(t.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${types.includes(t.id) ? 'bg-[#10b981] border-[#10b981] text-white' : 'border-[#2d2d44] text-[#94a3b8] hover:border-[#10b981]/50'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-[#94a3b8] mb-2 block">Difficulty</label>
                <div className="flex gap-2">
                  {['easy', 'balanced', 'hard'].map(d => (
                    <button key={d} onClick={() => setDifficulty(d)}
                      className={`flex-1 py-1.5 rounded-lg text-sm capitalize transition-all border ${difficulty === d ? 'bg-[#10b981] border-[#10b981] text-white' : 'border-[#2d2d44] text-[#94a3b8] hover:border-[#10b981]/50'}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1.5">Subject</label>
                  <select value={subject} onChange={e => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0f0f1a] border border-[#2d2d44] text-[#f1f5f9] text-sm focus:outline-none focus:border-[#10b981]">
                    {['Palo Alto Networks', 'Checkpoint', 'F5', 'Other'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1.5">Level</label>
                  <select value={gradeLevel} onChange={e => setGradeLevel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0f0f1a] border border-[#2d2d44] text-[#f1f5f9] text-sm focus:outline-none focus:border-[#10b981]">
                    {['K-2', '3-5', '6-8', '9-12', 'College', 'Professional'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {error && <div className="p-3 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30 text-sm text-[#f87171]">{error}</div>}
            <CQButton size="lg" className="w-full text-base" onClick={generate} loading={loading}>
              <Sparkles className="w-5 h-5" /> Generate Quiz
            </CQButton>
          </>
        ) : loading ? (
          <div className="text-center py-16 space-y-6">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 mx-auto rounded-full border-4 border-[#10b981]/30 border-t-[#10b981]" />
            <div>
              <AnimatePresence mode="wait">
                <motion.p key={loadingText} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="text-lg font-semibold text-[#f1f5f9] mb-2">{loadingText}</motion.p>
              </AnimatePresence>
              <div className="w-64 mx-auto h-2 bg-[#2d2d44] rounded-full overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-[#10b981] to-[#06b6d4] rounded-full" animate={{ width: `${loadingProgress}%` }} transition={{ duration: 0.5 }} />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <input type="text" value={generatedTitle} onChange={e => setGeneratedTitle(e.target.value)}
                  className="bg-transparent text-2xl font-bold text-[#f1f5f9] focus:outline-none border-b-2 border-transparent focus:border-[#10b981] transition-colors" />
                <p className="text-[#94a3b8] text-sm mt-1">{questions.length} questions generated</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <CQButton variant="ghost" size="sm" onClick={() => setQuestions([])}><RefreshCw className="w-4 h-4" /> Regenerate</CQButton>
                {savedQuiz ? (
                  <>
                    <CQButton variant="ghost" size="sm" onClick={() => router.push(`${BASE}/quiz/${savedQuiz.id}/edit`)}>
                      <Edit className="w-4 h-4" /> Edit
                    </CQButton>
                    <CQButton size="sm" onClick={() => setLaunchOpen(true)}><Play className="w-4 h-4" /> Launch Now</CQButton>
                  </>
                ) : (
                  <>
                    <CQButton variant="ghost" size="sm" loading={saving} onClick={saveToLibrary}><Save className="w-4 h-4" /> Save</CQButton>
                    <CQButton size="sm" onClick={async () => { await saveToLibrary(); }}><Play className="w-4 h-4" /> Launch Now</CQButton>
                  </>
                )}
              </div>
            </div>

            {savedQuiz && (
              <div className="p-3 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/30 text-sm text-[#4ade80] flex items-center gap-2">
                <Check className="w-4 h-4" /> Saved to library!
                <button className="ml-auto text-[#22c55e] hover:underline" onClick={() => router.push(`${BASE}/quiz/${savedQuiz.id}/edit`)}>Open in editor →</button>
              </div>
            )}

            <div className="space-y-4">
              {questions.map((q, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="rounded-xl bg-[#1a1a2e] border border-[#2d2d44] p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#94a3b8]">Q{i + 1}</span>
                      <CQBadge variant="purple" className="text-xs capitalize">{q.type.replace(/_/g, ' ')}</CQBadge>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => regenerateQuestion(i)} disabled={q._editing}
                        className="p-1.5 rounded hover:bg-white/5 text-[#94a3b8] hover:text-[#10b981] transition-colors">
                        {q._editing
                          ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><RefreshCw className="w-4 h-4" /></motion.div>
                          : <RefreshCw className="w-4 h-4" />}
                      </button>
                      <button onClick={() => setQuestions(prev => prev.filter((_, pi) => pi !== i))}
                        className="p-1.5 rounded hover:bg-[#ef4444]/10 text-[#94a3b8] hover:text-[#ef4444] transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <textarea value={q.question} onChange={e => updateQ(i, 'question', e.target.value)} rows={2}
                    className="w-full bg-transparent text-[#f1f5f9] font-medium text-base focus:outline-none resize-none border-b border-transparent focus:border-[#2d2d44] pb-2 mb-3" />

                  {q.options?.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className={`flex items-center gap-2 p-2 rounded-lg border ${oi === q.correct_index ? 'border-[#22c55e]/40 bg-[#22c55e]/5' : 'border-[#2d2d44]'}`}>
                          <span className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: ANSWER_COLORS[oi] || '#6b7280' }}>
                            {ANSWER_LABELS[oi]}
                          </span>
                          <input type="text" value={opt} onChange={e => { const newOpts = [...q.options]; newOpts[oi] = e.target.value; updateQ(i, 'options', newOpts); }}
                            className="flex-1 bg-transparent text-sm text-[#f1f5f9] focus:outline-none" />
                        </div>
                      ))}
                    </div>
                  )}

                  {q.explanation && (
                    <p className="text-xs text-[#94a3b8] bg-[#0f0f1a] p-2 rounded-lg border border-[#2d2d44]">💡 {q.explanation}</p>
                  )}
                </motion.div>
              ))}

              <CQButton variant="ghost" className="w-full" onClick={() => setQuestions(prev => [...prev, { type: 'multiple_choice', question: '', options: ['', '', '', ''], correct_index: 0, explanation: '' }])}>
                <Plus className="w-4 h-4" /> Add question manually
              </CQButton>
            </div>
          </>
        )}
      </div>

      {savedQuiz && launchOpen && <CQGameModeSelector quiz={savedQuiz} open={launchOpen} onClose={() => setLaunchOpen(false)} />}
    </div>
  );
}

// Dummy Edit icon to avoid import error
const Edit = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

export default function AIGeneratorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#10b981]" /></div>}>
      <AIGeneratorContent />
    </Suspense>
  );
}
