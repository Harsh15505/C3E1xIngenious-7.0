/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true
  },
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Enable SWC minification
  swcMinify: true,
  // Optimize production builds
  productionBrowserSourceMaps: false,
  // Reduce initial page load
  modularizeImports: {
    '@/components': {
      transform: '@/components/{{member}}',
    },
  },
  // Compression
  compress: true,
  // Optimize fonts
  optimizeFonts: true,
  // Reduce bundle size
  experimental: {
    optimizePackageImports: ['recharts', 'lucide-react'],
  },
}

module.exports = nextConfig
