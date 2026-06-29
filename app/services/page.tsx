import { Metadata } from 'next';
import { ServicesContent } from './ServicesContent';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import { SITE_URL, serviceJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Cybersecurity Advisory Services | The Cyber Adviser',
  description:
    'Cybersecurity advisory for Zero Trust, SASE, Prisma Access, NGFW segmentation, Cortex SOC automation, cloud security, and executive architecture reviews.',
  alternates: { canonical: 'https://www.thecyberadviser.com/services' },
};

export default function ServicesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd()) }} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: SITE_URL },
          { name: 'Services', url: `${SITE_URL}/services` },
        ]}
      />
      <ServicesContent />
    </>
  );
}
