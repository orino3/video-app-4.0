import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['jpxtnsqnnwadmvqluore.supabase.co'], // Your Supabase storage domain
  },
  // Disable source maps in production for security
  productionBrowserSourceMaps: false,
  // Enable strict mode for better error detection
  reactStrictMode: true,
};

export default nextConfig;
