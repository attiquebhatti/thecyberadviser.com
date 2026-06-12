'use client';
import { cn } from '@/lib/utils';
import { Loader as Loader2 } from 'lucide-react';
import { forwardRef } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const CQButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7c3aed] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
    const variants = {
      primary:   'bg-[#7c3aed] hover:bg-[#6d28d9] text-white focus:ring-offset-[#0f0f1a]',
      secondary: 'bg-[#06b6d4] hover:bg-[#0891b2] text-white focus:ring-[#06b6d4] focus:ring-offset-[#0f0f1a]',
      ghost:     'bg-transparent hover:bg-white/10 text-[#f1f5f9] border border-[#2d2d44]',
      danger:    'bg-[#ef4444] hover:bg-[#dc2626] text-white focus:ring-[#ef4444] focus:ring-offset-[#0f0f1a]',
      outline:   'bg-transparent border-2 border-[#7c3aed] text-[#7c3aed] hover:bg-[#7c3aed]/10 focus:ring-offset-[#0f0f1a]',
    };
    const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };
    return (
      <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
CQButton.displayName = 'CQButton';
