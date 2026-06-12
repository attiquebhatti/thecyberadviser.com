'use client';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glass?: 'sm' | 'md' | 'dark';
}

export function CQCard({ className, hover, glass = 'md', children, ...props }: CardProps) {
  const glassClass = glass === 'sm' ? 'glass-sm' : glass === 'dark' ? 'glass-dark' : 'glass';
  return (
    <div
      className={cn('rounded-xl p-4', glassClass, hover && 'glass-hover cursor-pointer hover:border-[#7c3aed]/40 hover:shadow-[#7c3aed]/10', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CQCardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-3', className)} {...props}>{children}</div>;
}

export function CQCardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-base font-semibold text-[#f1f5f9]', className)} {...props}>{children}</h3>;
}
