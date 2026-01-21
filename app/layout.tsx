import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import { AuthProvider } from "@/components/AuthProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SkipNavigation } from "@/components/SkipNavigation";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#00ADB5',
};

export const metadata: Metadata = {
  title: {
    default: "InvoiceDesk - Professional GST Invoice & Billing Software",
    template: "%s | InvoiceDesk"
  },
  description: "Create professional GST-compliant invoices instantly. Manage clients, products, and billing with InvoiceDesk - the complete invoice management solution for Indian businesses.",
  keywords: [
    "invoice software",
    "GST invoice",
    "billing software",
    "invoice generator",
    "GST billing",
    "invoice management",
    "business invoicing",
    "CGST SGST IGST",
    "invoice maker",
    "professional invoices",
    "B2B billing",
    "invoice tracking",
    "payment management",
    "client management",
    "product catalog"
  ],
  authors: [{ name: "InvoiceDesk" }],
  creator: "InvoiceDesk",
  publisher: "InvoiceDesk",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "InvoiceDesk - Professional GST Invoice & Billing Software",
    description: "Create professional GST-compliant invoices instantly. Manage clients, products, and billing with ease.",
    url: '/',
    siteName: "InvoiceDesk",
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/sndt logo.webp',
        width: 1200,
        height: 630,
        alt: 'InvoiceDesk - Invoice Management Software',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "InvoiceDesk - Professional GST Invoice & Billing Software",
    description: "Create professional GST-compliant invoices instantly. Manage clients, products, and billing with ease.",
    images: ['/sndt logo.webp'],
  },
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
  icons: {
    icon: '/sndt logo.webp',
    shortcut: '/sndt logo.webp',
    apple: '/sndt logo.webp',
  },
  manifest: '/manifest.json',
  category: 'business',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'InvoiceDesk',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
    },
    description: 'Professional GST-compliant invoice and billing management software for Indian businesses. Create invoices, manage clients, track payments, and handle GST calculations automatically.',
    featureList: [
      'GST-compliant invoicing',
      'Client management',
      'Product catalog',
      'Payment tracking',
      'PDF invoice generation',
      'CGST, SGST, IGST calculations',
      'Invoice history',
      'Business settings'
    ],
    screenshot: '/sndt logo.webp',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
    },
  };

  return (
    <html lang="en-IN">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SkipNavigation />
        <ErrorBoundary>
          <AuthProvider>
            <LayoutWrapper>
              <main id="main-content" tabIndex={-1}>
                {children}
              </main>
            </LayoutWrapper>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
