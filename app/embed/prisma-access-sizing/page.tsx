import type { Metadata } from 'next';
import { PrismaAccessSizingEmbed } from '@/components/prisma-sizing/PrismaAccessSizingEmbed';
import { parsePrismaSizingPrefill } from '@/lib/prisma-sizing/query-state';
import type { SearchParams } from '@/types/prisma-sizing';

export const metadata: Metadata = {
  title: 'Prisma Access Sizing Calculator Embed | The Cyber Adviser',
  description: 'Embeddable Prisma Access sizing calculator for iframe integration.',
};

type Props = {
  searchParams?: SearchParams;
};

export default function PrismaAccessSizingEmbedPage({ searchParams }: Props) {
  const initialValues = parsePrismaSizingPrefill(searchParams);

  return <PrismaAccessSizingEmbed initialValues={initialValues} />;
}
