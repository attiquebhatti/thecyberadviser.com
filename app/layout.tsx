import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { SiteChrome } from '@/components/layout/SiteChrome';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'The Cyber Adviser | Strategic Cybersecurity Consulting',
  description:
    'Strategic cybersecurity advisory for enterprises navigating Zero Trust adoption, SASE transformation, and security architecture modernization.',
  openGraph: {
    title: 'TheCyberAdviser | Strategic Cybersecurity Consulting',
    description:
      'Strategic cybersecurity advisory for enterprises navigating Zero Trust adoption, SASE transformation, and security architecture modernization.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
