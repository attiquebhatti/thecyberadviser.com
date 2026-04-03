import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Network } from 'lucide-react';
import { PrismaAccessSizingEmbed } from '@/components/prisma-sizing/PrismaAccessSizingEmbed';
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
import { parsePrismaSizingPrefill } from '@/lib/prisma-sizing/query-state';
import type { SearchParams } from '@/types/prisma-sizing';

export const metadata: Metadata = {
  title: 'Prisma Access Sizing Calculator | The Cyber Adviser',
  description:
    'Estimate Prisma Access deployment size, regions, resilience, and architecture assumptions inside the main The Cyber Adviser website experience.',
};

type Props = {
  searchParams?: SearchParams;
};

export default function PrismaAccessSizingPage({ searchParams }: Props) {
  const initialValues = parsePrismaSizingPrefill(searchParams);

  return (
    <>
      <Section className="pt-20 pb-3 md:pt-24 md:pb-5 lg:pt-28 lg:pb-6 print:hidden">
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
              <BreadcrumbPage className="text-[#FFC300]">Prisma Access Sizing Calculator</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <SectionHeader
          eyebrow="Tools"
          title="Prisma Access Sizing Calculator"
          description="Estimate regions, resilience, throughput, remote network scale, and mobile user assumptions without leaving the website experience."
          className="max-w-4xl text-left !mx-0"
          align="left"
        />
      </Section>

      <Section className="pt-0 pb-4 md:pb-6 lg:pb-8 print:hidden">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_360px]">
          <Card className="card-premium rounded-3xl border border-white/10">
            <CardContent className="p-6 md:p-7">
              <p className="eyebrow">Architecture Estimator</p>
              <h3 className="text-white">Built for advisory workshops and customer planning sessions</h3>
              <p className="mt-4 body-default max-w-3xl">
                Use this calculator to quickly shape sizing assumptions for Prisma Access remote networks,
                mobile users, ZTNA, service connections, regional placement, and resilience posture. The
                recommendations are intentionally heuristic, editable, and safe for pre-sales and planning conversations.
              </p>
            </CardContent>
          </Card>

          <Card className="card-premium rounded-3xl border border-white/10">
            <CardContent className="p-6 md:p-7">
              <p className="eyebrow">Related Tool</p>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#FFC300]/20 bg-[#FFC300]/10 text-[#FFC300]">
                  <Network className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-white">Unified Migration</h3>
                  <p className="mt-3 body-default">
                    Convert firewall configurations across vendors with confidence scoring and validation support.
                  </p>
                </div>
              </div>
              <Button asChild className="mt-6 bg-[#FFC300] text-black hover:bg-[#FFD54D]">
                <Link href="/tools">
                  Open Unified Migration
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section className="pt-0 pb-10 md:pb-12 lg:pb-14">
        <PrismaAccessSizingEmbed initialValues={initialValues} variant="site" />
      </Section>
    </>
  );
}
