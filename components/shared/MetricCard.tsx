import { cn } from '@/lib/utils';

interface MetricCardProps {
  value: string;
  label: string;
  className?: string;
}

export function MetricCard({ value, label, className }: MetricCardProps) {
  return (
    <div
      className={cn(
        'p-6 md:p-8 text-center bg-obsidian-900/50 border border-white/5 rounded-xl',
        className
      )}
    >
      <div className="text-4xl md:text-5xl font-bold text-white mb-2">
        {value}
      </div>
      <div className="text-sm text-slate-400">{label}</div>
    </div>
  );
}
