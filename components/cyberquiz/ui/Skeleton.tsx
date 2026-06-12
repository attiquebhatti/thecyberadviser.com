'use client';
import { cn } from '@/lib/utils';

export function CQSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('rounded-lg bg-gradient-to-r from-[#1a1a2e] via-[#2d2d44] to-[#1a1a2e] bg-[length:200%_100%]', className)}
      style={{ animation: 'cq-skeleton-shimmer 1.5s ease-in-out infinite' }}
    />
  );
}

export function CQQuizCardSkeleton() {
  return (
    <div className="rounded-2xl bg-[#1a1a2e] border border-[#2d2d44] p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <CQSkeleton className="h-5 w-2/3 rounded-md" />
        <CQSkeleton className="h-5 w-12 rounded-full" />
      </div>
      <div className="flex gap-2">
        <CQSkeleton className="h-4 w-16 rounded-md" />
        <CQSkeleton className="h-4 w-20 rounded-md" />
      </div>
      <div className="flex gap-4 pt-1">
        <CQSkeleton className="h-4 w-14 rounded-md" />
        <CQSkeleton className="h-4 w-14 rounded-md" />
        <CQSkeleton className="h-4 w-14 rounded-md" />
      </div>
      <div className="flex gap-2 pt-2 border-t border-[#2d2d44]">
        <CQSkeleton className="h-8 flex-1 rounded-xl" />
        <CQSkeleton className="h-8 w-8 rounded-xl" />
        <CQSkeleton className="h-8 w-8 rounded-xl" />
      </div>
    </div>
  );
}

export function CQSessionRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-[#1a1a2e] border border-[#2d2d44]">
      <CQSkeleton className="h-10 w-10 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <CQSkeleton className="h-4 w-40 rounded-md" />
        <CQSkeleton className="h-3 w-24 rounded-md" />
      </div>
      <CQSkeleton className="h-6 w-16 rounded-full" />
      <CQSkeleton className="h-8 w-20 rounded-xl" />
    </div>
  );
}

export function CQStatCardSkeleton() {
  return (
    <div className="rounded-xl bg-[#1a1a2e] border border-[#2d2d44] p-4 flex items-center gap-3">
      <CQSkeleton className="w-10 h-10 rounded-xl shrink-0" />
      <div className="space-y-2 flex-1">
        <CQSkeleton className="h-5 w-16 rounded-md" />
        <CQSkeleton className="h-3 w-20 rounded-md" />
      </div>
    </div>
  );
}
