import { cn } from '@/lib/utils';

type ComparisonRow = {
  label: string;
  guidance: string;
  watch: string;
};

type AnswerFirstBlockProps = {
  question: string;
  answer: string;
  sourceSummary: string;
  recommendedApproach: string;
  reviewedBy?: string;
  lastReviewed?: string;
  entities?: string[];
  comparisonRows?: ComparisonRow[];
  className?: string;
};

export function AnswerFirstBlock({
  question,
  answer,
  sourceSummary,
  recommendedApproach,
  reviewedBy = 'Attique Bhatti, Enterprise Security Consultant and cybersecurity instructor',
  lastReviewed = 'June 28, 2026',
  entities = [],
  comparisonRows = [],
  className,
}: AnswerFirstBlockProps) {
  return (
    <div className={cn('rounded-2xl border border-white/[0.08] bg-obsidian-900/50 p-6 shadow-2xl md:p-8', className)}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <div>
          <p className="eyebrow">Answer First</p>
          <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">{question}</h2>
          <p className="mt-4 text-base leading-relaxed text-slate-300 md:text-lg">{answer}</p>
        </div>

        <aside className="rounded-2xl border border-[#FFC300]/15 bg-[#FFC300]/[0.04] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FFC300]">Source Summary</p>
          <p className="mt-3 text-sm leading-6 text-slate-300">{sourceSummary}</p>
          <dl className="mt-5 space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Last reviewed</dt>
              <dd className="mt-1 font-medium text-slate-200">{lastReviewed}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Reviewed by</dt>
              <dd className="mt-1 font-medium text-slate-200">{reviewedBy}</dd>
            </div>
          </dl>
        </aside>
      </div>

      <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Recommended approach</p>
        <p className="mt-3 text-sm leading-6 text-slate-300 md:text-base">{recommendedApproach}</p>
      </div>

      {comparisonRows.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08]">
          <div className="grid grid-cols-1 bg-white/[0.03] text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 md:grid-cols-[0.8fr_1.2fr_1fr]">
            <div className="border-b border-white/[0.08] p-4 md:border-b-0 md:border-r">Decision area</div>
            <div className="border-b border-white/[0.08] p-4 md:border-b-0 md:border-r">Use this guidance</div>
            <div className="p-4">Watch closely</div>
          </div>
          {comparisonRows.map((row) => (
            <div key={row.label} className="grid grid-cols-1 border-t border-white/[0.08] text-sm md:grid-cols-[0.8fr_1.2fr_1fr]">
              <div className="border-b border-white/[0.06] p-4 font-semibold text-white md:border-b-0 md:border-r">{row.label}</div>
              <div className="border-b border-white/[0.06] p-4 leading-6 text-slate-300 md:border-b-0 md:border-r">{row.guidance}</div>
              <div className="p-4 leading-6 text-slate-400">{row.watch}</div>
            </div>
          ))}
        </div>
      )}

      {entities.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {entities.map((entity) => (
            <span key={entity} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-300">
              {entity}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}