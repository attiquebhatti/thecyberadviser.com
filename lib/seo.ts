import type { Article } from '@/data/articles';

export const SITE_URL = 'https://www.thecyberadviser.com';

export const publisher = {
  '@type': 'Organization',
  name: 'The Cyber Adviser',
  url: SITE_URL,
  logo: `${SITE_URL}/images/header-logo.png`,
};

export const author = {
  '@type': 'Person',
  name: 'Attique Bhatti',
  url: `${SITE_URL}/about`,
  jobTitle: 'Enterprise Cloud Security Consultant and Certified Instructor',
  worksFor: publisher,
  sameAs: ['https://www.linkedin.com/in/attiquebhatti'],
};

export function absoluteUrl(path = '/') {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function articleImage(article?: Pick<Article, 'image'>) {
  if (!article?.image) return absoluteUrl('/images/home-architecture.jpg');
  return article.image.startsWith('http') ? article.image : absoluteUrl(article.image);
}

export function cleanMetaTitle(title: string) {
  return title
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function titleWithBrand(title: string) {
  const cleanTitle = cleanMetaTitle(title);
  return cleanTitle.endsWith('| The Cyber Adviser')
    ? cleanTitle
    : `${cleanTitle} | The Cyber Adviser`;
}

export function metaDescription(description: string, maxLength = 158) {
  const cleanDescription = description
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleanDescription.length <= maxLength) return cleanDescription;

  const truncated = cleanDescription.slice(0, maxLength + 1);
  return `${truncated.slice(0, truncated.lastIndexOf(' ')).replace(/[.,;:!?-]+$/, '')}.`;
}

export function articleJsonLd(article: Article, path: string, type: 'Article' | 'BlogPosting' | 'TechArticle' = 'Article') {
  const url = absoluteUrl(path);

  return {
    '@context': 'https://schema.org',
    '@type': type,
    headline: article.title,
    description: article.excerpt,
    image: articleImage(article),
    datePublished: article.date,
    dateModified: article.date,
    author,
    publisher,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };
}

export function serviceJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Enterprise Cybersecurity Advisory Services',
    serviceType: 'Cybersecurity consulting, Zero Trust architecture, SASE transformation, SOC automation, and cloud security advisory',
    provider: publisher,
    areaServed: ['United Arab Emirates', 'GCC', 'Global'],
    url: absoluteUrl('/services'),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Cybersecurity Advisory Services',
      itemListElement: [
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Zero Trust Architecture Review' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'SASE and Prisma Access Transformation' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'NGFW and Segmentation Design' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Cortex XDR, XSOAR, and XSIAM Operations Advisory' } },
      ],
    },
  };
}

export function webApplicationJsonLd({
  name,
  description,
  path,
  features,
}: {
  name: string;
  description: string;
  path: string;
  features: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    applicationCategory: 'SecurityApplication',
    operatingSystem: 'Web browser',
    url: absoluteUrl(path),
    description,
    featureList: features,
    publisher,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  };
}
