import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true, // Enable React's Strict Mode
  output: "standalone", // Required for deployment to Netlify
};

export default nextConfig;
