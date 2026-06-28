import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const dynamic = 'force-dynamic';
export const revalidate = 600;

const GA_ID = 'G-G9MVKYGSN4';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('https://www.thecyberadviser.com'),
  title: 'The Cyber Adviser | Strategic Cybersecurity Consulting',
  description:
    'Strategic cybersecurity advisory for enterprises navigating Zero Trust adoption, SASE transformation, and security architecture modernization.',
  openGraph: {
    title: 'The Cyber Adviser | Strategic Cybersecurity Consulting',
    description:
      'Strategic cybersecurity advisory for enterprises navigating Zero Trust adoption, SASE transformation, and security architecture modernization.',
    type: 'website',
    url: 'https://www.thecyberadviser.com',
    siteName: 'The Cyber Adviser',
    images: [
      {
        url: '/images/home-architecture.jpg',
        width: 1200,
        height: 630,
        alt: 'The Cyber Adviser — strategic cybersecurity consulting',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Cyber Adviser | Strategic Cybersecurity Consulting',
    description:
      'Strategic cybersecurity advisory for enterprises navigating Zero Trust adoption, SASE transformation, and security architecture modernization.',
    images: ['/images/home-architecture.jpg'],
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
    canonical: 'https://www.thecyberadviser.com/',
  },
  verification: {
    google: 'EPo_TvNOAQjUTQwoww1V9ndaICBnWOPO0QXVexIq8dw',
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
        {/* Google Analytics — loads after page is interactive, never blocks render */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="lazyOnload"
        />
        <Script id="ga-init" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', { page_path: window.location.pathname });
          `}
        </Script>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
