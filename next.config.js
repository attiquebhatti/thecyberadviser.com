/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: { 
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
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
