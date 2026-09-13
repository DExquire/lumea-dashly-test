import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { env } from '@/lib/env';
import '@/styles/globals.scss';

/**
 * Fonts are self-hosted rather than loaded from Google Fonts: no third-party
 * request on the critical path, no FOUT from a blocked CDN, and `next/font`
 * still gives us preloading plus a `size-adjust` fallback so swapping in the
 * real font does not shift the layout.
 */
const manrope = localFont({
  src: [{ path: '../fonts/manrope-latin-variable.woff2', weight: '200 800', style: 'normal' }],
  variable: '--font-sans',
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
});

const caveat = localFont({
  src: [{ path: '../fonts/caveat-latin-variable.woff2', weight: '400 700', style: 'normal' }],
  variable: '--font-script',
  display: 'swap',
  fallback: ['Segoe Script', 'cursive'],
});

const inter = localFont({
  src: [{ path: '../fonts/inter-latin-700.woff2', weight: '700', style: 'normal' }],
  variable: '--font-logo',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
});

const title = 'LUMEA — Skincare made simple';
const description =
  'Thoughtful formulas for healthy, glowing skin. Build your routine in four simple steps: cleanse, treat, moisturise and protect.';

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title,
  description,
  applicationName: 'LUMEA',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'LUMEA',
    title,
    description,
    locale: 'en_GB',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'LUMEA — skincare made simple',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/og-image.jpg'],
  },
};

export const viewport: Viewport = {
  themeColor: '#fdfdfd',
  colorScheme: 'light',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${caveat.variable} ${inter.variable}`}>{children}</body>
    </html>
  );
}
