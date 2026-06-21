'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Trash2, GripVertical, Save, Play, ChevronLeft, X, Check, AlertCircle } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cqApi } from '@/lib/cyberquiz/api';
import { useAuthStore } from '@/lib/cyberquiz/stores/authStore';
import { CQButton } from '@/components/cyberquiz/ui/Button';
import { CQBadge } from '@/components/cyberquiz/ui/Badge';
import { CQGameModeSelector } from '@/components/cyberquiz/GameModeSelector';
import type { Question, Quiz, QuestionOption } from '@/lib/cyberquiz/types';

const BASE = '/tools/cyberquiz';

const QUESTION_TYPES = [
  { id: 'multiple_choice', label: 'Multiple Choice' },
  { id: 'true_false', label: 'True/False' },
  { id: 'short_answer', label: 'Short Answer' },
  { id: 'poll', label: 'Poll' },
  { id: 'fill_blank', label: 'Fill in Blank' },
];
const TIMERS    = [5, 10, 20, 30, 60];
const POINTS    = [10, 100, 500, 1000];
const SUBJECTS  = ['Palo Alto Networks', 'Checkpoint', 'F5', 'Other'];
const COLORS    = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#2dd4bf', '#f97316'];
const LABELS    = ['A', 'B', 'C', 'D', 'E', 'F'];

type QuestionDraft = Omit<Question, 'created_at'> & { _isNew?: boolean };

function newQuestion(quizId: string, order: number): QuestionDraft {
  return {
    id: `new-${Date.now()}-${order}`,
    quiz_id: quizId,
    order_index: order,
    type: 'multiple_choice',
    question_text: '',
    image_url: null,
    options: [
      { text: '', is_correct: true },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
    ],
    correct_answer: null,
    explanation: null,
    time_limit_seconds: 20,
    points: 10,
    difficulty: 'medium',
    _isNew: true,
  };
}

function SortableQuestion({ question, index, selected, onClick, onDelete }: {
  question: QuestionDraft; index: number; selected: boolean; onClick: () => void; onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style}
      className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all group ${selected ? 'bg-[#10b981]/20 border border-[#10b981]/50' : 'bg-[#0f0f1a] border border-[#2d2d44] hover:border-[#3d3d5a]'}`}
      onClick={onClick}>
      <button {...attributes} {...listeners} className="p-1 text-[#4a4a6a] hover:text-[#94a3b8] cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4" />
      </button>
      <span className="text-xs font-bold text-[#94a3b8] w-5 shrink-0">{index + 1}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#f1f5f9] truncate">{question.question_text || <span className="text-[#4a4a6a] italic">New question</span>}</p>
        <p className="text-xs text-[#94a3b8] capitalize">{question.type.replace(/_/g, ' ')}</p>
      </div>
      <button onClick={e => { e.stopPropagation(); onDelete(); }}
        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[#ef4444]/10 text-[#94a3b8] hover:text-[#ef4444] transition-all">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function QuizBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const router = useRouter();

  const [quiz, setQuiz]           = useState<Quiz | null>(null);
  const [title, setTitle]         = useState('Untitled Quiz');
  const [subject, setSubject]     = useState('Palo Alto Networks');
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [selectedIdx, setSelIdx]  = useState(0);
  const [saving, setSaving]       = useState(false);
  const [savedAt, setSavedAt]     = useState<Date | null>(null);
  const [launchOpen, setLaunchOpen] = useState(false);
  const [quizId, setQuizId]       = useState<string | null>(id || null);
  const [validationErrors, setVErrors] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (id) {
      loadQuiz(id);
    } else if (questions.length === 0) {
      setQuestions([newQuestion('temp', 0)]);
    }
  }, [id]);

  const loadQuiz = async (qid: string) => {
    try {
      const q = await cqApi.getQuiz(qid);
      setQuiz(q); setTitle(q.title); setSubject(q.subject || 'Palo Alto Networks');
      const qs = await cqApi.getQuestions(qid);
      setQuestions(qs.length ? qs as QuestionDraft[] : [newQuestion(qid, 0)]);
    } catch (err) { console.error(err); }
  };

  const validate = useCallback((): string[] => {
    const errs: string[] = [];
    if (!questions.length) { errs.push('Add at least one question'); return errs; }
    questions.forEach((q, i) => {
      const n = i + 1;
      if (!q.question_text.trim()) { errs.push(`Q${n}: Question text is empty`); return; }
      if (q.type === 'multiple_choice') {
        const opts = (q.options as QuestionOption[]) ?? [];
        if (opts.filter(o => o.text.trim()).length < 2) errs.push(`Q${n}: Add at least 2 options`);
        if (!opts.find(o => o.is_correct && o.text.trim())) errs.push(`Q${n}: Mark one answer as correct`);
      }
      if (q.type === 'true_false' && !q.correct_answer) errs.push(`Q${n}: Select True or False`);
      if ((q.type === 'short_answer' || q.type === 'fill_blank') && !q.correct_answer?.trim()) errs.push(`Q${n}: Enter the correct answer`);
    });
    return errs;
  }, [questions]);

  const saveAll = useCallback(async () => {
    if (!user) return;
    const errs = validate();
    if (errs.length) { setVErrors(errs); return; }
    setVErrors([]); setSaving(true);
    try {
      let sid = quizId;
      if (!sid) {
        const nq = await cqApi.createQuiz({ title, subject, grade_level: 'Professional' });
        sid = nq.id; setQuizId(sid); setQuiz(nq);
        router.replace(`${BASE}/quiz/${sid}/edit`);
      } else {
        const updated = await cqApi.updateQuiz(sid, { title, subject });
        setQuiz(updated);
      }
      const saved = await cqApi.bulkSaveQuestions(sid!, questions.map((q, i) => {
        const { _isNew, ...rest } = q as QuestionDraft & { _isNew?: boolean };
        return { ...rest, order_index: i, quiz_id: sid! };
      }));
      setQuestions(saved as QuestionDraft[]);
      setSavedAt(new Date());
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }, [user, quizId, title, subject, questions, router, validate]);

  useEffect(() => {
    if (validationErrors.length) setVErrors([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (questions.some(q => q.question_text) && !validationErrors.length) saveAll();
    }, 30000);
    return () => clearInterval(interval);
  }, [saveAll, validationErrors.length]);

  const addQ = () => { const nq = newQuestion(quizId || 'temp', questions.length); setQuestions(p => [...p, nq]); setSelIdx(questions.length); };
  const deleteQ = (idx: number) => { if (questions.length <= 1) return; setQuestions(p => p.filter((_, i) => i !== idx)); setSelIdx(Math.max(0, idx - 1)); };
  const updateQ = (field: keyof QuestionDraft, value: unknown) => setQuestions(p => p.map((q, i) => i === selectedIdx ? { ...q, [field]: value } : q));
  const updateOpt = (oi: number, text: string) => { const opts = [...(questions[selectedIdx].options as QuestionOption[])]; opts[oi] = { ...opts[oi], text }; updateQ('options', opts); };
  const setCorrect = (oi: number) => { const opts = (questions[selectedIdx].options as QuestionOption[]).map((o, i) => ({ ...o, is_correct: i === oi })); updateQ('options', opts); };
  const addOpt = () => { const opts = [...(questions[selectedIdx].options as QuestionOption[]), { text: '', is_correct: false }]; updateQ('options', opts); };
  const removeOpt = (oi: number) => { const opts = (questions[selectedIdx].options as QuestionOption[]).filter((_, i) => i !== oi); updateQ('options', opts); };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oi = questions.findIndex(q => q.id === String(active.id));
      const ni = questions.findIndex(q => q.id === String(over.id));
      setQuestions(arrayMove(questions, oi, ni));
      setSelIdx(ni);
    }
  };

  const currentQ = questions[selectedIdx];

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="text-center"><p className="text-[#94a3b8] mb-4">Sign in to use the quiz builder</p>
          <CQButton onClick={() => router.push(`${BASE}/auth`)}>Sign In</CQButton></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex flex-col">
      {/* Header */}
      <header className="sticky top-24 z-30 bg-[#1a1a2e] border-b border-[#2d2d44] px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => router.push(`${BASE}/dashboard`)} className="p-1.5 rounded-lg hover:bg-white/5 text-[#94a3b8] transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            className="flex-1 min-w-0 bg-transparent text-lg font-bold text-[#f1f5f9] focus:outline-none placeholder:text-[#4a4a6a] border-b-2 border-transparent focus:border-[#10b981] transition-colors"
            placeholder="Quiz title…" />
          <select value={subject} onChange={e => setSubject(e.target.value)}
            className="bg-[#0f0f1a] border border-[#2d2d44] text-[#94a3b8] text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#10b981]">
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {savedAt && <span className="text-xs text-[#4a4a6a]">Saved {savedAt.toLocaleTimeString()}</span>}
          <div className="flex gap-2">
            <CQButton variant="ghost" size="sm" loading={saving} onClick={saveAll}><Save className="w-4 h-4" /> Save</CQButton>
            {quiz && <CQButton size="sm" onClick={() => setLaunchOpen(true)}><Play className="w-4 h-4" /> Launch</CQButton>}
          </div>
        </div>
        {validationErrors.length > 0 && (
          <div className="mt-2 p-2 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/30 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[#f87171] shrink-0 mt-0.5" />
            <ul className="text-xs text-[#f87171] space-y-0.5">
              {validationErrors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 bg-[#1a1a2e] border-r border-[#2d2d44] flex flex-col">
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                {questions.map((q, i) => (
                  <SortableQuestion key={q.id} question={q} index={i} selected={i === selectedIdx} onClick={() => setSelIdx(i)} onDelete={() => deleteQ(i)} />
                ))}
              </SortableContext>
            </DndContext>
          </div>
          <div className="p-3 border-t border-[#2d2d44]">
            <button onClick={addQ} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed border-[#2d2d44] hover:border-[#10b981]/50 text-[#94a3b8] hover:text-[#f1f5f9] text-sm transition-all">
              <Plus className="w-4 h-4" /> Add Question
            </button>
          </div>
        </aside>

        {/* Editor */}
        <main className="flex-1 overflow-y-auto p-6">
          {currentQ ? (
            <motion.div key={selectedIdx} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="max-w-2xl mx-auto space-y-5">
              {/* Type + options row */}
              <div className="flex flex-wrap gap-3">
                <select value={currentQ.type} onChange={e => updateQ('type', e.target.value)}
                  className="bg-[#1a1a2e] border border-[#2d2d44] text-[#94a3b8] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#10b981]">
                  {QUESTION_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                <select value={currentQ.time_limit_seconds} onChange={e => updateQ('time_limit_seconds', Number(e.target.value))}
                  className="bg-[#1a1a2e] border border-[#2d2d44] text-[#94a3b8] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#10b981]">
                  {TIMERS.map(t => <option key={t} value={t}>{t}s</option>)}
                </select>
                <select value={currentQ.points} onChange={e => updateQ('points', Number(e.target.value))}
                  className="bg-[#1a1a2e] border border-[#2d2d44] text-[#94a3b8] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#10b981]">
                  {POINTS.map(p => <option key={p} value={p}>{p} pts</option>)}
                </select>
                <select value={currentQ.difficulty} onChange={e => updateQ('difficulty', e.target.value)}
                  className="bg-[#1a1a2e] border border-[#2d2d44] text-[#94a3b8] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#10b981]">
                  <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                </select>
              </div>

              {/* Question text */}
              <textarea value={currentQ.question_text} onChange={e => updateQ('question_text', e.target.value)} rows={3}
                placeholder="Enter your question…"
                className="w-full px-4 py-3 rounded-xl bg-[#1a1a2e] border border-[#2d2d44] text-[#f1f5f9] placeholder:text-[#4a4a6a] focus:outline-none focus:border-[#10b981] transition-colors resize-none text-base" />

              {/* Multiple choice options */}
              {currentQ.type === 'multiple_choice' && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide">Answer Options</label>
                  {(currentQ.options as QuestionOption[]).map((opt, oi) => (
                    <div key={oi} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${opt.is_correct ? 'border-[#22c55e]/40 bg-[#22c55e]/5' : 'border-[#2d2d44] bg-[#1a1a2e]'}`}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: COLORS[oi] || '#6b7280' }}>
                        {LABELS[oi]}
                      </div>
                      <input type="text" value={opt.text} onChange={e => updateOpt(oi, e.target.value)} placeholder={`Option ${LABELS[oi]}`}
                        className="flex-1 bg-transparent text-[#f1f5f9] focus:outline-none placeholder:text-[#4a4a6a]" />
                      <button onClick={() => setCorrect(oi)} className={`p-1.5 rounded-lg transition-colors ${opt.is_correct ? 'bg-[#22c55e] text-white' : 'text-[#4a4a6a] hover:text-[#22c55e]'}`}>
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      {(currentQ.options as QuestionOption[]).length > 2 && (
                        <button onClick={() => removeOpt(oi)} className="p-1.5 rounded-lg text-[#4a4a6a] hover:text-[#ef4444] transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {(currentQ.options as QuestionOption[]).length < 6 && (
                    <button onClick={addOpt} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-[#2d2d44] hover:border-[#10b981]/50 text-[#94a3b8] hover:text-[#f1f5f9] text-sm transition-all">
                      <Plus className="w-4 h-4" /> Add Option
                    </button>
                  )}
                </div>
              )}

              {/* True/False */}
              {currentQ.type === 'true_false' && (
                <div>
                  <label className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide mb-2 block">Correct Answer</label>
                  <div className="flex gap-3">
                    {['True', 'False'].map(v => (
                      <button key={v} onClick={() => updateQ('correct_answer', v)}
                        className={`flex-1 py-3 rounded-xl border-2 font-semibold transition-all ${currentQ.correct_answer === v ? 'border-[#22c55e] bg-[#22c55e]/10 text-[#4ade80]' : 'border-[#2d2d44] text-[#94a3b8] hover:border-[#3d3d5a]'}`}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Short answer / fill blank */}
              {(currentQ.type === 'short_answer' || currentQ.type === 'fill_blank') && (
                <div>
                  <label className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide mb-2 block">Correct Answer</label>
                  <input type="text" value={currentQ.correct_answer || ''} onChange={e => updateQ('correct_answer', e.target.value)}
                    placeholder="Enter the correct answer…"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1a1a2e] border border-[#2d2d44] text-[#f1f5f9] placeholder:text-[#4a4a6a] focus:outline-none focus:border-[#10b981] transition-colors" />
                </div>
              )}

              {/* Explanation */}
              <div>
                <label className="text-xs font-medium text-[#94a3b8] uppercase tracking-wide mb-2 block">Explanation (optional)</label>
                <textarea value={currentQ.explanation || ''} onChange={e => updateQ('explanation', e.target.value)} rows={2}
                  placeholder="Explain why this is the correct answer…"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#1a1a2e] border border-[#2d2d44] text-[#f1f5f9] placeholder:text-[#4a4a6a] focus:outline-none focus:border-[#10b981] transition-colors resize-none text-sm" />
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-[#94a3b8] mb-4">No question selected</p>
              <CQButton onClick={addQ}><Plus className="w-4 h-4" /> Add Question</CQButton>
            </div>
          )}
        </main>
      </div>

      {quiz && launchOpen && <CQGameModeSelector quiz={quiz} open={launchOpen} onClose={() => setLaunchOpen(false)} />}
    </div>
  );
}
