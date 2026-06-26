import type { Metadata } from 'next';
import { webApplicationJsonLd } from '@/lib/seo';
import CyberQuizLandingPage from './CyberQuizLandingPage';

const description =
  'CyberQuiz is a real-time multiplayer cybersecurity quiz platform with AI quiz generation, PANW question banks, live sessions, and analytics.';

export const metadata: Metadata = {
  title: 'CyberQuiz | Multiplayer Cybersecurity Training Platform',
  description,
  alternates: { canonical: 'https://www.thecyberadviser.com/tools/cyberquiz' },
  openGraph: {
    title: 'CyberQuiz | Multiplayer Cybersecurity Training Platform',
    description,
    type: 'website',
    url: 'https://www.thecyberadviser.com/tools/cyberquiz',
  },
};

export default function CyberQuizPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webApplicationJsonLd({
              name: 'CyberQuiz',
              description,
              path: '/tools/cyberquiz',
              features: ['Live multiplayer quizzes', 'AI quiz generation', 'PANW question banks', 'Session analytics', 'Multiple quiz game modes'],
            })
          ),
        }}
      />
      <CyberQuizLandingPage />
    </>
  );
}
