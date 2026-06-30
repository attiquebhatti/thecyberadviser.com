import { MetadataRoute } from 'next';

const disallow = [
  '/api/',
  '/tools/cyberquiz/auth',
  '/tools/cyberquiz/settings',
  '/tools/cyberquiz/quiz/',
  '/tools/cyberquiz/session/',
  '/tools/cyberquiz/play/',
  '/embed/',
];

// Explicitly welcome AI answer/generative engines so they can ingest and cite
// the site (GEO/AEO). Private paths above stay disallowed for them too.
const aiCrawlers = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'CCBot',
  'Applebot-Extended',
  'Amazonbot',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      { userAgent: aiCrawlers, allow: '/', disallow },
    ],
    sitemap: 'https://www.thecyberadviser.com/sitemap.xml',
    host: 'https://www.thecyberadviser.com',
  };
}
