import { HeroSection } from '@/components/home/HeroSection';
import { TrustStrip } from '@/components/home/TrustStrip';
import { PhilosophySection } from '@/components/home/PhilosophySection';
import { ServicesGrid } from '@/components/home/ServicesGrid';
import { MetricsSection } from '@/components/home/MetricsSection';
import { CTASection } from '@/components/home/CTASection';

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
