import type { Metadata } from 'next';
import '@/styles/globals.css';
import { siteConfig } from '@/config/site.config';
import RootProviders from '@/components/providers';

// Font variables are defined in globals.css

// Metadata
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.origin),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  creator: siteConfig.name,
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.origin,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.og,
        width: 2880,
        height: 1800,
        alt: siteConfig.name,
      },
    ],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    site: siteConfig.socials.x,
    title: siteConfig.title,
    description: siteConfig.description,
    images: {
      url: siteConfig.og,
      width: 2880,
      height: 1800,
      alt: siteConfig.name,
    },
  },
};

// Viewport configuration
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  userScalable: false,
  interactiveWidget: 'resizes-visual',
} as const;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // NOTE: The call to initialize PayGo at startup has been removed from this file.
  // It caused a WASM initialization error during server-side rendering.
  // The client will now be lazy-loaded on its first use in an API route or server action.

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="relative min-h-screen w-screen max-w-full bg-background font-sans antialiased"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'none',
          touchAction: 'pan-y',
        }}
      >
        <RootProviders>
          {children}
        </RootProviders>
      </body>
    </html>
  );
}
