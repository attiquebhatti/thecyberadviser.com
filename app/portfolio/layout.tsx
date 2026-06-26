// app/portfolio/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portfolio | The Cyber Adviser',
  description:
    'Selected security transformation projects spanning Prisma Access, Prisma SD-WAN, Cortex XDR, XSOAR, XSIAM, and next-generation firewall implementations.',
  alternates: { canonical: 'https://www.thecyberadviser.com/portfolio' },
  openGraph: {
    title: 'Portfolio | The Cyber Adviser',
    description:
      'Selected security transformation projects spanning Prisma Access, Prisma SD-WAN, Cortex XDR, XSOAR, XSIAM, and next-generation firewall implementations.',
    type: 'website',
    url: 'https://www.thecyberadviser.com/portfolio',
  },
};

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
