import { Metadata } from 'next';
import { ServicesContent } from './ServicesContent';

export const metadata: Metadata = {
  title: 'Services | The Cyber Adviser',
  description:
    'Comprehensive cybersecurity advisory services including Zero Trust strategy, SASE implementation, cloud security, and executive advisory.',
};

export default function ServicesPage() {
  return <ServicesContent />;
}
