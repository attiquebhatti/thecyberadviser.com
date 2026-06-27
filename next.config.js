/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Hostinger's runtime can't run the Next.js image optimizer (/_next/image),
    // which broke every <Image> on the live site. Serve originals directly instead.
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 3600,
  },
  // Server-only package with native/optional binaries — load at runtime instead
  // of bundling through webpack.
  experimental: {
    serverComponentsExternalPackages: ['@google-analytics/data'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; upgrade-insecure-requests" },
          { key: 'Cache-Control', value: 's-maxage=600, stale-while-revalidate=60' },
        ],
      },
    ];
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
