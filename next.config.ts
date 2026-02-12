import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@prisma/client'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  outputFileTracingIncludes: {
    '/**': ['node_modules/.prisma/client/**', 'node_modules/@prisma/client/**'],
  },
};

export default nextConfig;
