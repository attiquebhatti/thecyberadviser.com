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
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import { AnswerFirstBlock } from '@/components/seo/AnswerFirstBlock';
import { webApplicationJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Unified Migration Tool | Firewall Config Converter',
  description:
    'Convert Cisco ASA, FortiGate, Check Point, PAN-OS, Panorama, Netskope, and Zscaler firewall configs with validation and confidence scoring.',
  alternates: { canonical: 'https://www.thecyberadviser.com/tools/unified-migration' },
};

export default function UnifiedMigrationPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webApplicationJsonLd({
              name: 'Unified Migration Tool',
              description: metadata.description as string,
              path: '/tools/unified-migration',
              features: ['Multi-vendor firewall conversion', 'PAN-OS and Strata Cloud Manager migration support', 'Confidence scoring', 'Behavioral validation', 'Downloadable migration reports'],
            })
          ),
        }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://www.thecyberadviser.com' },
          { name: 'Tools', url: 'https://www.thecyberadviser.com/tools' },
          { name: 'Unified Migration', url: 'https://www.thecyberadviser.com/tools/unified-migration' },
        ]}
      />
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
          headingLevel="h1"
        />
      </Section>

      <Section className="pt-0 pb-4 md:pb-6 lg:pb-8">
        <AnswerFirstBlock
          question="What is firewall migration validation?"
          answer="Firewall migration validation checks whether converted policies, objects, NAT rules, routes, and security intent still behave as expected after moving between vendors or management platforms. A good migration is measured by preserved behavior, reduced risk, and clear exceptions, not by syntax conversion alone."
          sourceSummary="This page summarizes The Cyber Adviser's migration approach for Cisco ASA, FortiGate, Check Point, PAN-OS, Panorama, Strata Cloud Manager, Netskope, Zscaler, and Prisma Access transition planning."
          recommendedApproach="Convert in stages, compare source and target intent, review confidence findings, then validate traffic paths, NAT behavior, object references, policy order, and unsupported features before production change windows."
          entities={['Firewall migration', 'Cisco ASA', 'FortiGate', 'Check Point', 'PAN-OS', 'Strata Cloud Manager', 'Prisma Access', 'Netskope', 'Zscaler']}
          comparisonRows={[
            {
              label: 'Policy conversion',
              guidance: 'Preserve rule intent, object references, service definitions, and policy order before optimizing.',
              watch: 'Shadowed rules, broad services, missing tags, and unsupported match conditions.',
            },
            {
              label: 'NAT and routing',
              guidance: 'Validate NAT order, route domains, VPN paths, service connections, and branch breakout behavior.',
              watch: 'Asymmetric routing, overlapping objects, and translated destination mismatch.',
            },
            {
              label: 'Operational readiness',
              guidance: 'Document exceptions, rollback criteria, owner sign-off, and post-cutover monitoring.',
              watch: 'Change windows, logging gaps, and untested high-risk applications.',
            },
          ]}
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
