import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export function Section({ children, className, id }: SectionProps) {
  return (
    <section
      id={id}
      className={cn('py-24 md:py-32 lg:py-40', className)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  );
}

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  align?: 'left' | 'center';
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  className,
  align = 'center',
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'max-w-3xl',
        align === 'center' && 'mx-auto text-center',
        className
      )}
    >
      {eyebrow && (
        <p className="text-amber-500 text-sm font-semibold uppercase tracking-[0.2em] mb-5">
          {eyebrow}
        </p>
      )}
      <h2 className="text-white">{title}</h2>
      {description && (
        <p className="mt-6 text-lg md:text-xl text-slate-400 leading-relaxed">{description}</p>
      )}
    </div>
  );
}
