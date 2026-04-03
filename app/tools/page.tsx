import { Metadata } from 'next';
import Link from 'next/link';
import { Section, SectionHeader } from '@/components/layout/Section';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Security Tools | The Cyber Adviser',
  description:
    'Interactive tools for Prisma Access sizing, migration planning, and security architecture validation.',
};

export default function ToolsPage() {
  return (
    <>
      <Section className="pt-24 pb-4 md:pt-28 md:pb-6 lg:pt-32 lg:pb-8">
        <SectionHeader
          eyebrow="Tools"
          title="Interactive Security Tools"
          description="Specialized tools for architecture planning, migration, and design validation."
          className="max-w-4xl"
        />
      </Section>

      <Section className="pt-0 pb-10 md:pb-12 lg:pb-14">
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <Card className="card-premium rounded-3xl border border-white/10">
            <CardContent className="p-8">
              <p className="eyebrow">New</p>
              <h3 className="text-white">Prisma Access Sizing Calculator</h3>
              <p className="mt-4 body-default">
                A polished embeddable estimator for remote networks, mobile users, ZTNA, service connections, regions, and resilience assumptions.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="bg-[#FFC300] text-black hover:bg-[#FFD54D]">
                  <Link href="/tools/prisma-access-sizing">
                    Open calculator
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-white/15 bg-transparent text-white hover:bg-white/5">
                  <Link
                    href="/tools/prisma-access-sizing?mode=simple&mobileUsers=2500&branchSites=40&throughputValue=5&throughputUnit=Gbps"
                  >
                    Open prefilled example
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="card-premium rounded-3xl border border-white/10">
            <CardContent className="p-8">
              <p className="eyebrow">SOC</p>
              <h3 className="text-white">SIEM Sizing Calculator</h3>
              <p className="mt-4 body-default">
                Estimate storage, compute, RAM, and architecture requirements for SIEM and SOAR deployments.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="bg-[#FFC300] text-black hover:bg-[#FFD54D]">
                  <Link href="/tools/siem-sizing">
                    Open SIEM tool
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="card-premium rounded-3xl border border-white/10">
            <CardContent className="p-8">
              <p className="eyebrow">Migration</p>
              <h3 className="text-white">Unified Migration</h3>
              <p className="mt-4 body-default">
                Convert firewall configurations across vendors with confidence scoring and behavioral validation.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="bg-[#FFC300] text-black hover:bg-[#FFD54D]">
                  <Link href="/tools/unified-migration">
                    Open migration tool
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>
    </>
  );
}

