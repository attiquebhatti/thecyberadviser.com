'use client';

import dynamic from 'next/dynamic';
import { HeroSection } from '@/components/home/HeroSection';
import { TrustStrip } from '@/components/home/TrustStrip';
import { ServicesGrid } from '@/components/home/ServicesGrid';

// Lazy load heavy sections for better initial page load
const PhilosophySection = dynamic(
  () => import('@/components/home/PhilosophySection').then(m => m.PhilosophySection),
  { loading: () => <div className="h-96 bg-black" /> }
);

const MetricsSection = dynamic(
  () => import('@/components/home/MetricsSection').then(m => m.MetricsSection),
  { loading: () => <div className="h-96 bg-black" /> }
);

const CTASection = dynamic(
  () => import('@/components/home/CTASection').then(m => m.CTASection),
  { loading: () => <div className="h-64 bg-black" /> }
);

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustStrip />
      <PhilosophySection />
      <ServicesGrid />
      <MetricsSection />
      <CTASection />
    </>
  );
}
