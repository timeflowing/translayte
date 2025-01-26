import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true, // Enable React's Strict Mode
  output: "standalone", // Required for deployment to Netlify
  env: {
    TRANSLATOR_SUBSCRIPTION_KEY: process.env.TRANSLATOR_SUBSCRIPTION_KEY,
    TRANSLATOR_ENDPOINT: process.env.TRANSLATOR_ENDPOINT,
    TRANSLATOR_REGION: process.env.TRANSLATOR_REGION,
  },
};

export default nextConfig;
