import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Article } from '@/data/articles';

interface KnowledgeBaseCardProps {
  article: Article;
}

export function KnowledgeBaseCard({ article }: KnowledgeBaseCardProps) {
  return (
    <Link
      href={`/knowledge-base/${article.slug}`}
      className="group relative block rounded-2xl transition-all duration-500"
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="absolute inset-0 rounded-2xl border border-white/[0.04] group-hover:border-white/[0.08] transition-colors duration-500" />

      <div className="absolute inset-x-0 top-0 h-1.5 bg-[#FFC300]/20 group-hover:bg-[#FFC300] transition-colors duration-500 rounded-t-2xl" />

      <div className="relative p-8 md:p-9">
        <div className="flex items-center gap-3 mb-5">
          <span className="px-3 py-1.5 text-xs font-semibold text-[#FFC300] bg-[#FFC300]/10 rounded-lg border border-[#FFC300]/10">
            {article.category}
          </span>
          <span className="text-xs text-slate-500">{article.readTime}</span>
        </div>

        <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-[#FFC300] transition-colors duration-300 line-clamp-2">
          {article.title}
        </h3>

        <p className="text-slate-400 text-[15px] leading-relaxed mb-6 line-clamp-2">
          {article.excerpt}
        </p>

        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 group-hover:text-[#FFC300] transition-colors duration-300">
          <span>Read article</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
        </div>
      </div>
    </Link>
  );
}
