import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ['@vertex/types'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
    ],
  },
  experimental: {
    optimizePackageImports: ['@phosphor-icons/react', 'motion'],
  },
  async headers() {
    let configuredApiOrigin = '';
    if (process.env.NEXT_PUBLIC_API_URL) {
      try {
        configuredApiOrigin = new URL(process.env.NEXT_PUBLIC_API_URL).origin;
      } catch {}
    }

    const connectOrigins = [
      "'self'",
      'https://xydv.duckdns.org',
      ...(configuredApiOrigin && configuredApiOrigin !== 'null' ? [configuredApiOrigin] : []),
      ...(isDev ? ['http://localhost:*', 'http://127.0.0.1:*'] : []),
      'https://*.razorpay.com',
      'https://api.razorpay.com',
      'https://lumberjack.razorpay.com',
    ].filter(Boolean).join(' ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://api.razorpay.com https://cdn.razorpay.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://res.cloudinary.com https://picsum.photos https://images.unsplash.com",
              "font-src 'self' data:",
              "media-src 'self' https://assets.mixkit.co data: blob:",
              `connect-src ${connectOrigins}`,
              "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
