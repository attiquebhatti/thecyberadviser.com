import { Metadata } from 'next';
import { AboutContent } from './AboutContent';
import { SITE_URL, publisher } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'About | The Cyber Adviser',
  description:
    'Strategic cybersecurity advisor specializing in Zero Trust architecture, SASE transformation, and enterprise security leadership.',
  alternates: { canonical: 'https://www.thecyberadviser.com/about' },
  openGraph: {
    title: 'About Attique Bhatti | The Cyber Adviser',
    description:
      'Enterprise Cloud Security Consultant and certified instructor across Palo Alto Networks, Check Point, and F5.',
    type: 'profile',
    url: `${SITE_URL}/about`,
    images: [`${SITE_URL}/images/home-architecture.jpg`],
  },
};

const profileJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  '@id': `${SITE_URL}/about`,
  url: `${SITE_URL}/about`,
  mainEntity: {
    '@type': 'Person',
    name: 'Attique Bhatti',
    url: `${SITE_URL}/about`,
    jobTitle: 'Enterprise Cloud Security Consultant and Certified Instructor',
    worksFor: publisher,
    knowsAbout: [
      'Palo Alto Networks',
      'Prisma Access',
      'SASE',
      'Zero Trust Architecture',
      'NGFW and Network Segmentation',
      'Cortex XDR, XSOAR, and XSIAM',
      'Check Point',
      'F5',
      'Security Architecture',
    ],
    sameAs: ['https://www.linkedin.com/in/attiquebhatti'],
  },
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileJsonLd) }}
      />
      <AboutContent />
    </>
  );
}
