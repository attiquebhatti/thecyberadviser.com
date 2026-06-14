/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 3600,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 64, 128, 256, 384],
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
