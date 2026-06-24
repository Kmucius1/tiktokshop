import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: undefined,
  experimental: {},
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
