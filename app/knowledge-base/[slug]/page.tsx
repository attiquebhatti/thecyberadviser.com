import Link from 'next/link';
import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import RelatedTools from '@/components/seo/RelatedTools';
import { getArticleBySlug } from '@/data/articles';
import { SITE_URL, articleJsonLd, metaDescription, titleWithBrand } from '@/lib/seo';

const publishedKnowledgeBaseSlugs = ['hybrid-cloud-connectivity', 'prisma-split-tunneling', 'phishing-triage-playbook'];

const knowledgeBaseMetaTitles: Record<string, string> = {
  'hybrid-cloud-connectivity': 'Hybrid Cloud Security Architecture | The Cyber Adviser',
  'prisma-split-tunneling': 'Prisma Split Tunneling Guide | The Cyber Adviser',
  'phishing-triage-playbook': 'Phishing Triage Playbook | The Cyber Adviser',
};

function isPublishedKnowledgeBaseSlug(slug: string) {
  return publishedKnowledgeBaseSlugs.includes(slug);
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = isPublishedKnowledgeBaseSlug(params.slug) ? getArticleBySlug(params.slug) : undefined;

  if (!article) {
    return {
      title: 'Knowledge Base Article | The Cyber Adviser',
    description: metaDescription(
      'Technical cybersecurity guide from The Cyber Adviser covering enterprise architecture, operations, and implementation patterns.'
    ),
      alternates: { canonical: `${SITE_URL}/knowledge-base/${params.slug}` },
    };
  }

  const title = knowledgeBaseMetaTitles[params.slug] || titleWithBrand(article.title);
  const articleUrl = `${SITE_URL}/knowledge-base/${params.slug}`;

  return {
    title,
    description: metaDescription(article.excerpt),
    alternates: { canonical: articleUrl },
    openGraph: {
      title,
      description: metaDescription(article.excerpt),
      type: 'article',
      url: articleUrl,
      siteName: 'The Cyber Adviser',
      publishedTime: article.date,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: metaDescription(article.excerpt),
    },
  };
}

function MarkdownRenderer({ content }: { content: string }) {
  const parseInline = (text: string) =>
    text
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-accent-gold hover:underline">$1</a>');

  const lines = content.trim().split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let orderedBuffer: string[] = [];
  let keyIdx = 0;

  const flushList = () => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`ul-${keyIdx++}`} className="my-6 list-disc space-y-3 pl-6 text-slate-400">
          {listBuffer.map((item, index) => (
            <li key={index} dangerouslySetInnerHTML={{ __html: parseInline(item) }} />
          ))}
        </ul>
      );
      listBuffer = [];
    }

    if (orderedBuffer.length > 0) {
      elements.push(
        <ol key={`ol-${keyIdx++}`} className="my-6 list-decimal space-y-3 pl-6 text-slate-400">
          {orderedBuffer.map((item, index) => (
            <li key={index} dangerouslySetInnerHTML={{ __html: parseInline(item) }} />
          ))}
        </ol>
      );
      orderedBuffer = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith('# ')) {
      flushList();
      elements.push(
        <h2 key={keyIdx++} className="mt-14 border-b border-white/10 pb-4 text-3xl font-bold text-accent-gold md:text-4xl">
          {line.slice(2)}
        </h2>
      );
    } else if (line.startsWith('## ')) {
      flushList();
      elements.push(<h3 key={keyIdx++} className="mt-12 text-2xl font-bold text-white md:text-3xl">{line.slice(3)}</h3>);
    } else if (line.startsWith('### ')) {
      flushList();
      elements.push(<h4 key={keyIdx++} className="mt-9 text-xl font-semibold text-accent-gold">{line.slice(4)}</h4>);
    } else if (line.startsWith('#### ')) {
      flushList();
      elements.push(<h5 key={keyIdx++} className="mt-7 text-lg font-semibold text-white">{line.slice(5)}</h5>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      orderedBuffer = [];
      listBuffer.push(line.slice(2));
    } else if (/^\d+\.\s/.test(line)) {
      listBuffer = [];
      orderedBuffer.push(line.replace(/^\d+\.\s/, ''));
    } else if (line.match(/^!\[.+?\]\(.+?\)$/)) {
      flushList();
      const match = line.match(/^!\[(.+?)\]\((.+?)\)$/);
      if (match) {
        elements.push(
          <figure key={keyIdx++} className="my-10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <img src={match[2]} alt={match[1]} loading="lazy" decoding="async" className="w-full object-cover" />
            <figcaption className="border-t border-white/10 px-5 py-3 text-sm text-slate-400">{match[1]}</figcaption>
          </figure>
        );
      }
    } else if (line === '---') {
      flushList();
      elements.push(<hr key={keyIdx++} className="my-12 border-white/10" />);
    } else if (line === '') {
      flushList();
    } else {
      flushList();
      elements.push(
        <p
          key={keyIdx++}
          className="my-5 text-lg font-light leading-relaxed text-slate-300"
          dangerouslySetInnerHTML={{ __html: parseInline(line) }}
        />
      );
    }
  }

  flushList();

  return <div>{elements}</div>;
}

export async function generateStaticParams() {
  return publishedKnowledgeBaseSlugs.map((slug) => ({ slug }));
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = isPublishedKnowledgeBaseSlug(params.slug) ? getArticleBySlug(params.slug) : undefined;

  if (!article) {
    notFound();
  }

  const articleUrl = `${SITE_URL}/knowledge-base/${params.slug}`;
  const techArticleJsonLd = articleJsonLd(article, `/knowledge-base/${params.slug}`, 'TechArticle');

  return (
    <main className="flex flex-col items-center w-full min-h-screen bg-executive-obsidian selection:bg-accent-gold selection:text-executive-obsidian pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(techArticleJsonLd) }} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: SITE_URL },
          { name: 'Knowledge Base', url: `${SITE_URL}/knowledge-base` },
          { name: article.title, url: articleUrl },
        ]}
      />

      <section className="w-full pt-40 pb-20 px-8 text-center border-b border-white/5 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-executive-charcoal via-executive-obsidian to-executive-obsidian">
        <div className="max-w-[1000px] mx-auto">
          <Link href="/knowledge-base" className="text-accent-gold font-mono text-xs font-bold uppercase tracking-widest mb-8 inline-block hover:text-white transition-colors">
            Back to Knowledge Base
          </Link>
          <p className="mb-4 font-mono text-xs font-black uppercase tracking-[0.3em] text-accent-gold">
            {article.category} - {article.readTime}
          </p>
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tighter mb-8 leading-tight">
            {article.title}
          </h1>
          <p className="font-mono text-sm text-slate-500">{article.date}</p>
        </div>
      </section>

      <section className="w-full max-w-[900px] mx-auto px-8 py-24">
        <article className="prose prose-invert prose-lg max-w-none">
          <MarkdownRenderer content={article.content} />
          <div className="mt-16 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">
            <p className="mb-1 font-semibold text-white">Attique Bhatti</p>
            <p>Enterprise Cloud Security Consultant and certified instructor across Palo Alto Networks, Check Point, and F5.</p>
            <p className="mt-3">
              For architecture reviews or implementation support, email{' '}
              <a href="mailto:info@thecyberadviser.com" className="text-accent-gold hover:underline">info@thecyberadviser.com</a>.
            </p>
          </div>
        </article>
      </section>

      <RelatedTools topic={article.category} />
    </main>
  );
}
