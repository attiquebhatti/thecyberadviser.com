import { Metadata } from 'next';
import { Section, SectionHeader } from '@/components/layout/Section';

export const metadata: Metadata = {
  title: 'Tools | The Cyber Adviser',
  description: 'Cybersecurity tools including UnifiedMigration.',
};

export default function ToolsPage() {
  return (
    <>
      <Section className="pt-32 pb-8">
        <SectionHeader
          title="Unified Migration"
          align="left"
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
