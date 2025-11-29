/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: '**.githubusercontent.com',
            },
        ],
        formats: ['image/webp', 'image/avif'],
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    compress: true,
    poweredByHeader: false,
    experimental: {
        optimizeCss: true,
    },
}

module.exports = nextConfig
