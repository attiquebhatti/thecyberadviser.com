import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/tools/cyberquiz/auth',
          '/tools/cyberquiz/settings',
          '/tools/cyberquiz/quiz/',
          '/tools/cyberquiz/session/',
          '/tools/cyberquiz/play/',
          '/embed/',
        ],
      },
    ],
    sitemap: 'https://www.thecyberadviser.com/sitemap.xml',
    host: 'https://www.thecyberadviser.com',
  };
}
