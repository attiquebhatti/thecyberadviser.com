import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import { ReactNode } from 'react';

interface CTAButtonProps {
  href: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'default' | 'lg';
  children: ReactNode;
  className?: string;
  showArrow?: boolean;
}

export function CTAButton({
  href,
  variant = 'primary',
  size = 'default',
  children,
  className,
  showArrow = false,
}: CTAButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group relative inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-300 overflow-hidden',
        {
          'text-obsidian-950': variant === 'primary',
          'text-white border border-white/[0.08] hover:border-white/[0.15] bg-white/[0.03] hover:bg-white/[0.05]': variant === 'secondary',
          'text-slate-400 hover:text-white': variant === 'ghost',
        },
        {
          'px-6 py-3 text-sm': size === 'default',
          'px-8 py-4 text-base': size === 'lg',
        },
        className
      )}
    >
      {variant === 'primary' && (
        <>
          <span className="absolute inset-0 bg-gradient-to-r from-[#FFC300] to-[#FFB703]" />
          <span className="absolute inset-0 bg-gradient-to-r from-[#FFD60A] to-[#FFC300] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </>
      )}
      <span className="relative flex items-center gap-2">
        {children}
        {showArrow && (
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" />
        )}
      </span>
    </Link>
  );
}
