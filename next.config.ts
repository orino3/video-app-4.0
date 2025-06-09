import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['jpxtnsqnnwadmvqluore.supabase.co'], // Your Supabase storage domain
  },
  // Disable source maps in production for security
  productionBrowserSourceMaps: false,
  // Enable strict mode for better error detection
  reactStrictMode: true,
  // instrumentation.js is now enabled by default in Next.js 15
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: process.env.SENTRY_ORG || "your-org-name",
  project: process.env.SENTRY_PROJECT || "coaching-platform",

  // Disable source map upload until auth token is properly configured
  authToken: process.env.SENTRY_AUTH_TOKEN,
  
  // Skip source map upload if no auth token
  disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  disableClientWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,

  // Only print logs for uploading source maps in CI
  silent: true,

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
});
