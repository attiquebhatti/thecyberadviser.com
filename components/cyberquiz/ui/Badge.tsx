'use client';
import { cn } from '@/lib/utils';

type BadgeVariant = 'purple' | 'cyan' | 'green' | 'yellow' | 'red' | 'gray' | 'gold';

const variants: Record<BadgeVariant, string> = {
  purple: 'bg-[#7c3aed]/20 text-[#a855f7] border-[#7c3aed]/30',
  cyan:   'bg-[#06b6d4]/20 text-[#22d3ee] border-[#06b6d4]/30',
  green:  'bg-[#22c55e]/20 text-[#4ade80] border-[#22c55e]/30',
  yellow: 'bg-[#f59e0b]/20 text-[#fbbf24] border-[#f59e0b]/30',
  red:    'bg-[#ef4444]/20 text-[#f87171] border-[#ef4444]/30',
  gray:   'bg-[#6b7280]/20 text-[#9ca3af] border-[#6b7280]/30',
  gold:   'bg-[#fbbf24]/20 text-[#fbbf24] border-[#fbbf24]/30',
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function CQBadge({ className, variant = 'purple', children, ...props }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border', variants[variant], className)} {...props}>
      {children}
    </span>
  );
}
