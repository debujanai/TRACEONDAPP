import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      'gateway.pinata.cloud',
      'ipfs.io',
      'gmgn.ai',
      'dweb.link',
      'cloudflare-ipfs.com',
      'supabase.co',
      'supabase.in',
      'supabasestorage.com',
      'vdhsjibfdtpghblpgocr.supabase.co', // Add your specific Supabase instance if needed
      'traceondapp.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
