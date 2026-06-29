// app/blogs/layout.tsx — metadata for the blog index (/blogs/[slug] overrides per-article)
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cybersecurity Insights & Blog | The Cyber Adviser',
  description:
    'Practical articles on Cortex XDR/XSIAM, Prisma SASE, Strata NGFW, Zero Trust, identity security, and SOC automation for enterprise security teams.',
  alternates: { canonical: 'https://www.thecyberadviser.com/blogs' },
  openGraph: {
    title: 'Cybersecurity Insights & Blog | The Cyber Adviser',
    description:
      'Practical articles on Cortex XDR/XSIAM, Prisma SASE, Strata NGFW, Zero Trust, and SOC automation for enterprise security teams.',
    type: 'website',
    url: 'https://www.thecyberadviser.com/blogs',
    images: ['https://www.thecyberadviser.com/images/home-architecture.jpg'],
  },
};

export default function BlogsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
