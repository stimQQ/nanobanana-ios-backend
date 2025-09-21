import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ui/Error";
import ClientOnly from "@/components/ClientOnly";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  metadataBase: new URL('https://nanobanana.app'),
  title: {
    default: "Conversational AI Image Editor - Natural Language Photo Editing | NanoBanana",
    template: "%s | NanoBanana"
  },
  description: "Edit images with natural language. Point, describe, perfect. AI-powered precision editing that maintains object consistency. Try free.",
  keywords: "conversational image editing, natural language photo editing, AI image editor, point and edit, object consistency, smart photo editing, AI photo manipulation, conversational AI, image generation, photo editing app, 对话精准P图, 指哪改哪, 保持物体一致性, NanoBanana",
  authors: [{ name: "NanoBanana Team" }],
  openGraph: {
    title: "Conversational AI Image Editor - Point, Describe, Perfect | NanoBanana",
    description: "Revolutionary AI-powered image editing through natural conversations. Maintain perfect object consistency while making precise edits with simple commands.",
    url: "https://nanobanana.app",
    siteName: "NanoBanana",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NanoBanana - Conversational AI Image Editor",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Conversational AI Image Editor | NanoBanana",
    description: "Edit images with natural language. Point, describe, perfect. Try free.",
    images: ["/og-image.png"],
    creator: "@nanobanana",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://nanobanana.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "NanoBanana",
    "applicationCategory": "PhotographyApplication",
    "operatingSystem": "iOS, Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1250",
    },
    "description": "Conversational AI image editor that allows natural language photo editing with perfect object consistency.",
    "featureList": [
      "Natural language image editing",
      "Point-and-edit precision",
      "Object consistency preservation",
      "AI-powered background replacement",
      "Smart object removal",
      "Style transfer",
      "Professional retouching",
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={`${inter.className} antialiased bg-black text-gray-300`} suppressHydrationWarning>
        <ClientOnly>
          <ErrorBoundary>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ErrorBoundary>
        </ClientOnly>
      </body>
    </html>
  );
}
