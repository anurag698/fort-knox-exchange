
import { parse } from 'dotenv';
import { readFileSync } from 'fs';
import type {NextConfig} from 'next';

// Read the .env file
const env = parse(readFileSync('.env'));

const nextConfig: NextConfig = {
  /* config options here */
  serverRuntimeConfig: {
    // Expose the .env variables to the server runtime
    ...env,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
       {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'tokens.1inch.io',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // This is to make sure the API key is available in server components/actions
    if (!isServer) {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            // This is required to make ethers work on the client side
            "crypto": require.resolve("crypto-browserify"),
            "stream": require.resolve("stream-browserify"),
            "http": require.resolve("stream-http"),
            "https": require.resolve("https-browserify"),
            "os": require.resolve("os-browserify/browser"),
        };
    }

    return config;
  }
};

export default nextConfig;
