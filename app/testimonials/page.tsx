import type { Metadata } from 'next';
import { Star, Quote } from 'lucide-react';
import { FEATURED_TESTIMONIALS, TESTIMONIAL_IMAGES } from '@/data/testimonials';
import { productLogo } from '@/lib/productLogos';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';

const SITE = 'https://www.thecyberadviser.com';

export const metadata: Metadata = {
  title: 'Student Reviews & Testimonials | The Cyber Adviser',
  description:
    'What students and clients say about Attique Bhatti: 5-star feedback from Palo Alto Networks, Prisma SD-WAN, and SASE instructor-led training worldwide.',
  alternates: { canonical: `${SITE}/testimonials` },
  openGraph: {
    title: 'Student Reviews & Testimonials | The Cyber Adviser',
    description:
      'Verified 5-star feedback from Attique Bhatti’s instructor-led cybersecurity training (Palo Alto Networks, Prisma SD-WAN, SASE).',
    type: 'website',
    url: `${SITE}/testimonials`,
    images: [`${SITE}/images/home-architecture.jpg`],
  },
};

// A clean Person entity for the page. We deliberately do NOT emit
// AggregateRating/Review here: Google does not support Person as a review host
// type (it caused the "Invalid object type for field <parent_node>" error in
// Search Console), and self-hosted reviews about your own entity are
// self-serving and ineligible for review rich results. The testimonials remain
// as visible on-page content for users and E-E-A-T.
const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Attique Bhatti',
  url: `${SITE}/about`,
  jobTitle: 'Enterprise Cloud Security Consultant and Certified Instructor',
  worksFor: { '@type': 'Organization', name: 'The Cyber Adviser', url: SITE },
  sameAs: ['https://www.linkedin.com/in/attiquebhatti'],
};

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < n ? 'fill-[#6BD348] text-[#6BD348]' : 'text-slate-600'}`} />
      ))}
    </div>
  );
}

export default function TestimonialsPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 md:pt-32 pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: SITE },
          { name: 'Testimonials', url: `${SITE}/testimonials` },
        ]}
      />

      {/* Header */}
      <header className="text-center max-w-3xl mx-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/header-logo.webp" alt="The Cyber Adviser" className="h-16 w-auto mx-auto mb-6 drop-shadow-[0_4px_24px_rgba(255,195,0,0.25)]" />
        <p className="text-[#FFC300] text-sm font-semibold uppercase tracking-[0.2em] mb-3">Testimonials</p>
        <h1 className="text-white text-4xl md:text-5xl font-black tracking-tight">What students &amp; clients say</h1>
        <p className="mt-4 text-base md:text-lg text-slate-400 leading-relaxed">
          Feedback from instructor-led training delivered worldwide across Palo Alto Networks, Prisma SD-WAN, Cortex, and SASE — collected from LinkedIn and post-course reviews.
        </p>
        <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-[#6BD348]/30 bg-[#6BD348]/10 px-4 py-2">
          <Stars n={5} />
          <span className="text-sm font-semibold text-[#6BD348]">5.0 average</span>
          <span className="text-sm text-slate-400">from course attendees</span>
        </div>
      </header>

      {/* Featured quotes */}
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {FEATURED_TESTIMONIALS.map((t) => (
          <figure key={t.name} className="card-premium rounded-3xl border border-white/10 p-7 flex flex-col">
            <div className="flex items-center justify-between">
              <Quote className="h-6 w-6 text-[#6BD348]/60" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={productLogo('', t.course)} alt="" className="h-5 w-auto max-w-[90px] object-contain opacity-80" />
            </div>
            <blockquote className="mt-4 text-slate-200 leading-relaxed flex-1">“{t.quote}”</blockquote>
            <figcaption className="mt-5 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-white">{t.name}</span>
                <Stars n={t.rating} />
              </div>
              <p className="text-xs text-slate-500 mt-1">{t.source} · {t.course}</p>
            </figcaption>
          </figure>
        ))}
      </div>

      {/* Proof gallery */}
      <div className="mt-16">
        <h2 className="text-white text-xl font-bold mb-1">Verified feedback</h2>
        <p className="text-slate-400 mb-6 max-w-3xl text-sm">
          Original LinkedIn recommendations and post-course review screenshots. Click any to view full size.
        </p>
        <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 [column-fill:_balance]">
          {TESTIMONIAL_IMAGES.map((src, i) => (
            <a
              key={src}
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-3 block break-inside-avoid rounded-lg overflow-hidden border border-white/[0.08] hover:border-[#6BD348]/50 transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Student feedback for Attique Bhatti training (${i + 1})`}
                loading="lazy"
                className="w-full h-auto block bg-white/[0.02]"
              />
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
