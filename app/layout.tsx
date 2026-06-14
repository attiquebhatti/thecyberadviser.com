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
  keywords: [
    'cybersecurity consulting',
    'zero trust architecture',
    'SASE implementation',
    'Palo Alto Networks consultant',
    'enterprise security advisor',
    'Prisma Access',
    'Cortex XDR',
    'network security',
    'cloud security',
    'Attique Bhatti',
  ],
  authors: [{ name: 'Attique Bhatti', url: 'https://www.thecyberadviser.com/about' }],
  creator: 'Attique Bhatti',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large', 'max-video-preview': -1 },
  },
  alternates: {
    canonical: 'https://www.thecyberadviser.com',
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
