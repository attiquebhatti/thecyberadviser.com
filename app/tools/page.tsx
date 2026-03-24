import { Metadata } from 'next';
import { Section, SectionHeader } from '@/components/layout/Section';

export const metadata: Metadata = {
  title: 'Tools | The Cyber Adviser',
  description: 'Cybersecurity tools including UnifiedMigration.',
};

export default function ToolsPage() {
  return (
    <>
      <Section className="pt-24 pb-4 md:pt-28 md:pb-6 lg:pt-32 lg:pb-8">
        <SectionHeader
          eyebrow="Tools"
          title="Unified Migration"
          description="A powerful tool for managing and visualizing firewall configurations and migrations."
          className="max-w-4xl"
        />
      </Section>
      
      <div className="w-full h-[calc(100vh-300px)] min-h-[600px] border-t border-white/[0.05]">
        <iframe
          src="http://localhost:5173"
          className="w-full h-full border-0"
          title="Unified Migration Tool"
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </>
  );
}
