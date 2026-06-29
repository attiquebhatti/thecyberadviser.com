// app/knowledge-base/layout.tsx — metadata for the Knowledge Base section
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Knowledge Base | The Cyber Adviser',
  description:
    'Technical guides and reference material for Palo Alto Networks (Prisma, Cortex, Strata NGFW), Check Point, Fortinet, and Zero Trust / SASE architecture.',
  alternates: { canonical: 'https://www.thecyberadviser.com/knowledge-base' },
  openGraph: {
    title: 'Knowledge Base | The Cyber Adviser',
    description:
      'Technical guides for Palo Alto Networks, Check Point, Fortinet, and Zero Trust / SASE architecture.',
    type: 'website',
    url: 'https://www.thecyberadviser.com/knowledge-base',
    images: ['https://www.thecyberadviser.com/images/home-architecture.jpg'],
  },
};

export default function KnowledgeBaseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
