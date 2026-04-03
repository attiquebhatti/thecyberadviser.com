import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Calculator } from 'lucide-react';
import MigratorClient from '@/app/tools/MigratorClient';
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
  title: 'Unified Migration | The Cyber Adviser',
  description:
    'Convert firewall configurations across vendors with confidence scoring and behavioral validation inside the main The Cyber Adviser website experience.',
};

export default function UnifiedMigrationPage() {
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
              <BreadcrumbPage className="text-[#FFC300]">Unified Migration</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <SectionHeader
          eyebrow="Tools"
          title="Unified Migration"
          description="Convert firewall configurations across vendors with confidence scoring, validation insight, and a cleaner dedicated migration workspace."
          className="max-w-4xl text-left !mx-0"
          align="left"
        />
      </Section>

      <Section className="pt-0 pb-4 md:pb-6 lg:pb-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_360px]">
          <Card className="card-premium rounded-3xl border border-white/10">
            <CardContent className="p-6 md:p-7">
              <p className="eyebrow">Migration Workspace</p>
              <h3 className="text-white">Upload, validate, and review conversions in one place</h3>
              <p className="mt-4 body-default max-w-3xl">
                Use this tool to inspect source firewall configurations, run migration analysis, and review confidence
                findings without crowding the main tools landing page.
              </p>
            </CardContent>
          </Card>

          <Card className="card-premium rounded-3xl border border-white/10">
            <CardContent className="p-6 md:p-7">
              <p className="eyebrow">Related Tool</p>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#FFC300]/20 bg-[#FFC300]/10 text-[#FFC300]">
                  <Calculator className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-white">Prisma Access Sizing Calculator</h3>
                  <p className="mt-3 body-default">
                    Estimate storage, branch bandwidth, and deployment recommendations for Prisma Access planning.
                  </p>
                </div>
              </div>
              <Button asChild className="mt-6 bg-[#FFC300] text-black hover:bg-[#FFD54D]">
                <Link href="/tools/prisma-access-sizing">
                  Open Prisma calculator
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section className="pt-0 pb-10 md:pb-12 lg:pb-14">
        <MigratorClient />
      </Section>
    </>
  );
}
