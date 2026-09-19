import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * `@ecom/contracts` ships TypeScript source rather than a built `dist`, so there is
   * exactly one copy of every schema and no build-ordering step between the packages.
   * Next has to be told to compile it like first-party code.
   */
  transpilePackages: ['@ecom/contracts'],

  compress: true,
  poweredByHeader: false,

  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [{ protocol: 'https', hostname: 'picsum.photos' }],
  },

  /**
   * Defence-in-depth headers. None of these replace server-side authorisation, but
   * they close off the cheap attacks: clickjacking via framing, MIME sniffing, and
   * leaking the full URL (which can carry an order number) to third-party sites.
   */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
