import type { Metadata } from 'next';
import { webApplicationJsonLd } from '@/lib/seo';
import AiChatbotLandingPage from './AiChatbotLandingPage';

const description =
  'AI Training Chatbot provides post-training Q&A for cybersecurity course alumni, grounded in session transcripts and Attique Bhatti training context.';

export const metadata: Metadata = {
  title: 'AI Training Chatbot | Cybersecurity Course Q&A',
  description,
  alternates: { canonical: 'https://www.thecyberadviser.com/tools/ai-chatbot' },
  openGraph: {
    title: 'AI Training Chatbot | Cybersecurity Course Q&A',
    description,
    type: 'website',
    url: 'https://www.thecyberadviser.com/tools/ai-chatbot',
  },
};

export default function AiChatbotPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webApplicationJsonLd({
              name: 'AI Training Chatbot',
              description,
              path: '/tools/ai-chatbot',
              features: ['Transcript-grounded Q&A', 'Course alumni access', 'Instructor-style answers', 'Admin transcript upload', 'Training cohort support'],
            })
          ),
        }}
      />
      <AiChatbotLandingPage />
    </>
  );
}
