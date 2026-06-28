import dynamic from 'next/dynamic';
import { HeroSection } from '@/components/home/HeroSection';
import { TrustStrip } from '@/components/home/TrustStrip';
import { ServicesGrid } from '@/components/home/ServicesGrid';

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

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': 'https://www.thecyberadviser.com/#person',
      name: 'Attique Bhatti',
      jobTitle: 'Enterprise Security Consultant',
      description:
        'Strategic cybersecurity advisor with 15+ years architecting Zero Trust, SASE, and enterprise security solutions for global organisations.',
      url: 'https://www.thecyberadviser.com',
      sameAs: [
        'https://www.linkedin.com/in/attiquebhatti',
      ],
      knowsAbout: [
        'Zero Trust Architecture',
        'SASE',
        'Palo Alto Networks',
        'Prisma Access',
        'Cortex XDR',
        'Cortex XSOAR',
        'Network Security',
        'Cloud Security',
        'Cybersecurity Advisory',
      ],
    },
    {
      '@type': 'ProfessionalService',
      '@id': 'https://www.thecyberadviser.com/#business',
      name: 'The Cyber Adviser',
      description:
        'Strategic cybersecurity advisory for enterprises navigating Zero Trust adoption, SASE transformation, and security architecture modernization.',
      url: 'https://www.thecyberadviser.com',
      founder: { '@id': 'https://www.thecyberadviser.com/#person' },
      serviceType: [
        'Cybersecurity Consulting',
        'Zero Trust Architecture',
        'SASE Implementation',
        'Security Architecture Review',
        'Palo Alto Networks Advisory',
      ],
      areaServed: 'Worldwide',
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Cybersecurity Advisory Services',
        itemListElement: [
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Zero Trust Architecture Design' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'SASE Transformation Advisory' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Security Architecture Review' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Palo Alto Networks Implementation' } },
        ],
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://www.thecyberadviser.com/#website',
      url: 'https://www.thecyberadviser.com',
      name: 'The Cyber Adviser',
      publisher: { '@id': 'https://www.thecyberadviser.com/#person' },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroSection />
      <TrustStrip />
      <PhilosophySection />
      <ServicesGrid />
      <MetricsSection />
      <CTASection />
    </>
  );
}
