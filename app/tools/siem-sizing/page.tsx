import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Calculator, Workflow } from 'lucide-react';
import SiemSizingCalculator from '@/components/siem-sizing/SiemSizingCalculator';
import { Section, SectionHeader } from '@/components/layout/Section';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'SIEM Sizing Calculator | The Cyber Adviser',
  description:
    'Estimate SIEM and SOAR architecture, storage, compute, RAM, and infrastructure requirements for SOC deployments.',
};

export default function SiemSizingPage() {
  return (
    <>
      <Section className="pt-20 pb-3 md:pt-24 md:pb-5 lg:pt-28 lg:pb-6">
        <Breadcrumb className="mb-8">
          <BreadcrumbList className="text-slate-400">
            <BreadcrumbItem>
              <BreadcrumbLink asChild className="text-slate-400 hover:text-[#FFC300]">
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-slate-600" />
            <BreadcrumbItem>
              <BreadcrumbLink asChild className="text-slate-400 hover:text-[#FFC300]">
                <Link href="/tools">Tools</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-slate-600" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-[#FFC300]">SIEM Sizing Calculator</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <SectionHeader
          eyebrow="Tools"
          title="SIEM / SOAR Sizing Calculator"
          description="Estimate storage, compute, RAM, and infrastructure sizing for SIEM and SOAR deployments using a clean architecture-first workflow."
          className="max-w-4xl text-left !mx-0"
          align="left"
        />
      </Section>

      <Section className="pt-0 pb-4 md:pb-6 lg:pb-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_360px]">
          <Card className="card-premium rounded-3xl border border-white/10">
            <CardContent className="p-6 md:p-7">
              <p className="eyebrow">SOC Architecture</p>
              <h3 className="text-white">Built for security engineers and solution architects</h3>
              <p className="mt-4 body-default max-w-3xl">
                Use this calculator to estimate ingestion footprint, storage retention, and node topology across common
                SIEM and SOAR platforms. The implementation mirrors the public reference flow while keeping the code modular and editable.
              </p>
            </CardContent>
          </Card>

          <Card className="card-premium rounded-3xl border border-white/10">
            <CardContent className="p-6 md:p-7">
              <p className="eyebrow">Related Tools</p>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#FFC300]/20 bg-[#FFC300]/10 text-[#FFC300]">
                    <Calculator className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-white">Prisma Access Sizing Calculator</h3>
                    <p className="mt-2 body-default">
                      Estimate logging, bandwidth, and deployment planning for Prisma Access workshops.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#FFC300]/20 bg-[#FFC300]/10 text-[#FFC300]">
                    <Workflow className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-white">Unified Migration</h3>
                    <p className="mt-2 body-default">
                      Convert and validate firewall configurations across vendors from a dedicated migration workspace.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="bg-[#FFC300] text-black hover:bg-[#FFD54D]">
                  <Link href="/tools/prisma-access-sizing">
                    Open Prisma calculator
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-white/15 bg-transparent text-white hover:bg-white/5">
                  <Link href="/tools/unified-migration">
                    Open migration tool
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section className="pt-0 pb-10 md:pb-12 lg:pb-14">
        <SiemSizingCalculator />
      </Section>
    </>
  );
}
