'use client';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const CQInput = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={id} className="text-sm font-medium text-[#94a3b8]">{label}</label>}
      <input
        ref={ref} id={id}
        className={cn(
          'w-full px-3 py-2 rounded-lg bg-[#1a1a2e] border border-[#2d2d44] text-[#f1f5f9] placeholder:text-[#4a4a6a] focus:outline-none focus:border-[#6bd348] focus:ring-1 focus:ring-[#6bd348] transition-colors',
          error && 'border-[#ef4444] focus:border-[#ef4444] focus:ring-[#ef4444]',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-[#ef4444]">{error}</p>}
    </div>
  )
);
CQInput.displayName = 'CQInput';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const CQTextarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={id} className="text-sm font-medium text-[#94a3b8]">{label}</label>}
      <textarea
        ref={ref} id={id}
        className={cn(
          'w-full px-3 py-2 rounded-lg bg-[#1a1a2e] border border-[#2d2d44] text-[#f1f5f9] placeholder:text-[#4a4a6a] focus:outline-none focus:border-[#6bd348] focus:ring-1 focus:ring-[#6bd348] transition-colors resize-none',
          error && 'border-[#ef4444]',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-[#ef4444]">{error}</p>}
    </div>
  )
);
CQTextarea.displayName = 'CQTextarea';
