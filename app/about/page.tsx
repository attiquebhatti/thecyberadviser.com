import { Metadata } from 'next';
import { AboutContent } from './AboutContent';

export const metadata: Metadata = {
  title: 'About | The Cyber Adviser',
  description:
    'Strategic cybersecurity advisor specializing in Zero Trust architecture, SASE transformation, and enterprise security leadership.',
};

export default function AboutPage() {
  return <AboutContent />;
}
