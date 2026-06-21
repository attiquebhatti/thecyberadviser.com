'use client';
import { cn } from '@/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
}

export function CQSelect({ className, label, options, error, id, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={id} className="text-sm font-medium text-[#94a3b8]">{label}</label>}
      <select
        id={id}
        className={cn(
          'w-full px-3 py-2 rounded-lg bg-[#1a1a2e] border border-[#2d2d44] text-[#f1f5f9] focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors cursor-pointer',
          error && 'border-[#ef4444]',
          className
        )}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-[#1a1a2e]">{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-[#ef4444]">{error}</p>}
    </div>
  );
}
