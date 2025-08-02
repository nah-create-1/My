/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable App Router
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: [],
  },

  // PWA Configuration for mobile
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ]
  },

  // Optimize for mobile performance
  swcMinify: true,
  compress: true,
  poweredByHeader: false,

  // Image optimization for mobile
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Webpack configuration for Monaco Editor
  webpack: (config, { dev, isServer }) => {
    // Monaco Editor configuration
    config.module.rules.push({
      test: /\.worker\.js$/,
      use: { loader: 'worker-loader' }
    })

    // Optimize for mobile bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Monaco Editor chunk
          monaco: {
            name: 'monaco',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](monaco-editor|@monaco-editor)[\\/]/,
            priority: 30,
          },
          // UI libraries chunk
          ui: {
            name: 'ui',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](@radix-ui|framer-motion|lucide-react)[\\/]/,
            priority: 20,
          },
          // Common vendor chunk
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
          },
        },
      }
    }

    return config
  },

  // Redirect configuration
  async redirects() {
    return [
      {
        source: '/app',
        destination: '/',
        permanent: true,
      },
    ]
  },

  // Environment variables for client
  env: {
    NEXT_PUBLIC_APP_NAME: 'Cursor Mobile AI',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },

  // Output configuration for Vercel
  output: 'standalone',

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Experimental features for mobile optimization
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    legacyBrowsers: false,
    browsersListForSwc: true,
  },
}

module.exports = nextConfig