import type { Metadata, Viewport } from 'next';
import { DM_Sans } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/store/CartDrawer';
import { CustomerAuthModal } from '@/components/store/CustomerAuthModal';
import { NotificationManager } from '@/components/store/NotificationManager';
import { RouteTelemetry } from '@/components/telemetry/RouteTelemetry';
import { SmoothCursor } from '@/components/ui/SmoothCursor';
import { InitialLoadingScreen } from '@/components/ui/InitialLoadingScreen';
import { Providers } from './providers';

const dmSans = DM_Sans({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-secondary',
  display: 'swap',
  axes: ['opsz'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://xydv-performance.com'),
  title: {
    default: 'XYDV — Premium Performance Fashion',
    template: '%s | XYDV',
  },
  description:
    'Premium performance fashion engineered for the relentless. Shop tops, bottoms, outerwear and accessories.',
  keywords: [
    'XYDV',
    'performance fashion',
    'sportswear',
    'activewear',
    'premium apparel',
    'technical division',
  ],
  icons: {
    icon: [
      { url: '/brand/xydv-logo.png', media: '(prefers-color-scheme: light)' },
      { url: '/brand/xydv-logo-outline.png', media: '(prefers-color-scheme: dark)' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [{ url: '/brand/xydv-logo.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://xydv-performance.com',
    siteName: 'XYDV',
    title: 'XYDV — Premium Performance Fashion',
    description: 'Premium performance fashion engineered for the relentless.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'XYDV Fashion' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'XYDV — Premium Performance Fashion',
    description: 'Premium performance fashion engineered for the relentless.',
    images: ['/og-image.jpg'],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} light`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('xydv-theme') || localStorage.getItem('vertex-theme');
                  if (stored === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  } else {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <InitialLoadingScreen />
          <a
            href="#main-content"
            className="sr-only font-mono text-xs font-bold uppercase shadow-2xl focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:border focus:border-[var(--accent)] focus:bg-[var(--bg)] focus:px-4 focus:py-2.5 focus:text-[var(--text-primary)]"
          >
            Skip to main content
          </a>
          <SmoothCursor />
          <Navbar />
          <main id="main-content">{children}</main>
          <Footer />
          <CartDrawer />
          <CustomerAuthModal />
          <NotificationManager />
          <RouteTelemetry />
        </Providers>
      </body>
    </html>
  );
}
