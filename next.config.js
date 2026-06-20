/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Hostinger's runtime can't run the Next.js image optimizer (/_next/image),
    // which broke every <Image> on the live site. Serve originals directly instead.
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 3600,
  },
  // Server-only packages with native/optional binaries — load at runtime instead
  // of bundling through webpack. (Local-only; chatbot + analytics not yet on live.)
  experimental: {
    serverComponentsExternalPackages: ['@xenova/transformers', '@google-analytics/data'],
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'thecyberadviser.com',
          },
        ],
        destination: 'https://www.thecyberadviser.com/:path*',
        permanent: true,
      },
      {
        source: '/blog',
        destination: '/knowledge-base',
        permanent: true,
      },
      {
        source: '/blog/:slug',
        destination: '/knowledge-base/:slug',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
