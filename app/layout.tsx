import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('https://www.thecyberadviser.com'),
  title: 'The Cyber Adviser | Strategic Cybersecurity Consulting',
  description:
    'Strategic cybersecurity advisory for enterprises navigating Zero Trust adoption, SASE transformation, and security architecture modernization.',
  openGraph: {
    title: 'TheCyberAdviser | Strategic Cybersecurity Consulting',
    description:
      'Strategic cybersecurity advisory for enterprises navigating Zero Trust adoption, SASE transformation, and security architecture modernization.',
    type: 'website',
    url: 'https://www.thecyberadviser.com',
    siteName: 'The Cyber Adviser',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Cyber Adviser | Strategic Cybersecurity Consulting',
    description:
      'Strategic cybersecurity advisory for enterprises navigating Zero Trust adoption, SASE transformation, and security architecture modernization.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
