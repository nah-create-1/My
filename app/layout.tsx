import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Toaster } from 'sonner'
import './globals.css'

// Optimize fonts for mobile
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Cursor Mobile AI - AI-Powered Code Editor',
  description: 'Mobile-first AI code editor with Cursor features, optimized for touch devices and mobile development',
  keywords: [
    'AI code editor',
    'mobile development',
    'Cursor AI',
    'code completion',
    'mobile coding',
    'typescript',
    'javascript',
    'AI assistant'
  ],
  authors: [{ name: 'Cursor Mobile AI Team' }],
  creator: 'Cursor Mobile AI',
  publisher: 'Cursor Mobile AI',
  
  // Open Graph metadata for social sharing
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://cursor-mobile-ai.vercel.app',
    title: 'Cursor Mobile AI - AI-Powered Code Editor',
    description: 'Mobile-first AI code editor with Cursor features, optimized for touch devices and mobile development',
    siteName: 'Cursor Mobile AI',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Cursor Mobile AI - AI-Powered Code Editor',
      },
    ],
  },

  // Twitter Card metadata
  twitter: {
    card: 'summary_large_image',
    title: 'Cursor Mobile AI - AI-Powered Code Editor',
    description: 'Mobile-first AI code editor with Cursor features, optimized for touch devices and mobile development',
    images: ['/og-image.png'],
    creator: '@cursormobileai',
  },

  // PWA metadata
  manifest: '/manifest.json',
  
  // Additional metadata for mobile
  applicationName: 'Cursor Mobile AI',
  appleWebApp: {
    capable: true,
    title: 'Cursor Mobile AI',
    statusBarStyle: 'black-translucent',
  },
  
  // Verification
  verification: {
    google: 'google-verification-code',
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  // Mobile-optimized viewport
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  
  // Theme colors for mobile browsers
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0d1117' },
  ],
  
  // Color scheme
  colorScheme: 'dark light',
  
  // Viewport fit for devices with notches
  viewportFit: 'cover',
  
  // Mobile web app settings
  minimumScale: 1,
  shrinkToFit: false,
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html 
      lang="en" 
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* PWA icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Splash screens for iOS PWA */}
        <link 
          rel="apple-touch-startup-image" 
          href="/splash-2048x2732.png" 
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link 
          rel="apple-touch-startup-image" 
          href="/splash-1668x2224.png" 
          media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link 
          rel="apple-touch-startup-image" 
          href="/splash-1536x2048.png" 
          media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link 
          rel="apple-touch-startup-image" 
          href="/splash-1125x2436.png" 
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link 
          rel="apple-touch-startup-image" 
          href="/splash-1242x2208.png" 
          media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link 
          rel="apple-touch-startup-image" 
          href="/splash-750x1334.png" 
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link 
          rel="apple-touch-startup-image" 
          href="/splash-640x1136.png" 
          media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />

        {/* Meta tags for mobile optimization */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Cursor AI" />
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        
        {/* Prevent zoom on input focus (iOS) */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        
        {/* Preload critical resources */}
        <link rel="preload" href="/fonts/JetBrainsMono-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        
        {/* DNS prefetch for better performance */}
        <link rel="dns-prefetch" href="//vercel.com" />
        <link rel="dns-prefetch" href="//vitals.vercel-insights.com" />
      </head>
      <body className="font-sans antialiased dark min-h-screen bg-background text-foreground">
        {/* Skip to main content for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
        >
          Skip to main content
        </a>

        {/* Main application content */}
        <div id="main-content" className="h-screen overflow-hidden">
          {children}
        </div>

        {/* Toast notifications */}
        <Toaster 
          position="top-center"
          toastOptions={{
            className: 'mobile-toast',
            duration: 3000,
            style: {
              background: 'hsl(var(--card))',
              color: 'hsl(var(--card-foreground))',
              border: '1px solid hsl(var(--border))',
            },
          }}
        />

        {/* Analytics */}
        <Analytics />
        <SpeedInsights />

        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('SW registered: ', registration);
                  }).catch(function(registrationError) {
                    console.log('SW registration failed: ', registrationError);
                  });
                });
              }
            `,
          }}
        />

        {/* Prevent context menu on mobile for better UX */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener('contextmenu', function(e) {
                if (window.innerWidth <= 768) {
                  e.preventDefault();
                }
              });
              
              // Prevent pull-to-refresh
              let lastTouchY = 0;
              const el = document.body;
              
              el.addEventListener('touchstart', function(e) {
                if (e.touches.length === 1) {
                  lastTouchY = e.touches[0].clientY;
                }
              }, { passive: false });
              
              el.addEventListener('touchmove', function(e) {
                const touchY = e.touches[0].clientY;
                const touchYDelta = touchY - lastTouchY;
                lastTouchY = touchY;
                
                if (el.scrollTop === 0 && touchYDelta > 0) {
                  e.preventDefault();
                }
              }, { passive: false });

              // Improve touch performance
              document.addEventListener('touchstart', function() {}, { passive: true });
              document.addEventListener('touchmove', function() {}, { passive: true });
            `,
          }}
        />
      </body>
    </html>
  )
}