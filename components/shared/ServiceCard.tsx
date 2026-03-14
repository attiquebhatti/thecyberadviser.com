import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export function ServiceCard({
  icon: Icon,
  title,
  description,
  className,
}: ServiceCardProps) {
  return (
    <div
      className={cn(
        'group relative rounded-2xl transition-all duration-500',
        className
      )}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="absolute inset-0 rounded-2xl border border-white/[0.04] group-hover:border-white/[0.08] transition-colors duration-500" />

      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
      </div>

      <div className="relative p-8 md:p-10">
        <div className="relative w-14 h-14 mb-6">
          <div className="absolute inset-0 rounded-xl bg-amber-500/10 group-hover:bg-amber-500/15 transition-colors duration-500" />
          <div className="absolute inset-0 rounded-xl flex items-center justify-center">
            <Icon className="w-6 h-6 text-amber-500" />
          </div>
        </div>

        <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-white transition-colors duration-300">
          {title}
        </h3>

        <p className="text-slate-400 text-[15px] leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
