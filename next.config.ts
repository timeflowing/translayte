import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  reactStrictMode: !isProd,
  productionBrowserSourceMaps: false,
  output: "standalone", 
  images: {
    domains: ["source.unsplash.com"],
     remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                port: '',
                pathname: '/**',
            },
        ],
    
  },
  env: {
    TRANSLATOR_SUBSCRIPTION_KEY: process.env.TRANSLATOR_SUBSCRIPTION_KEY,
    TRANSLATOR_ENDPOINT: process.env.TRANSLATOR_ENDPOINT,
    TRANSLATOR_REGION: process.env.TRANSLATOR_REGION,
  },
};

export default nextConfig;
