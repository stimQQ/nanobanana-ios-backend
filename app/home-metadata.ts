import { Metadata } from 'next';

export const homeMetadata: Metadata = {
  title: 'Conversational AI Image Editor - Natural Language Photo Editing | NanoBanana',
  description: 'Edit images with natural language. Point, describe, perfect. AI-powered precision editing that maintains object consistency. Try free.',
  keywords: [
    'conversational image editing',
    'natural language photo editing',
    'AI image editor',
    'point and edit',
    'object consistency',
    'smart photo editing',
    'AI photo manipulation',
    'conversational AI',
    'image generation',
    'photo editing app',
    '对话精准P图',
    '指哪改哪',
    '保持物体一致性',
    'NanoBanana'
  ].join(', '),
  openGraph: {
    title: 'Conversational AI Image Editor - Point, Describe, Perfect | NanoBanana',
    description: 'Revolutionary AI-powered image editing through natural conversations. Maintain perfect object consistency while making precise edits with simple commands.',
    url: 'https://nanobanana.app',
    siteName: 'NanoBanana',
    images: [
      {
        url: '/og-image-home.png',
        width: 1200,
        height: 630,
        alt: 'NanoBanana - Conversational AI Image Editor',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Conversational AI Image Editor | NanoBanana',
    description: 'Edit images with natural language. Point, describe, perfect. Try free.',
    images: ['/og-image-home.png'],
    creator: '@nanobanana',
  },
  alternates: {
    canonical: 'https://nanobanana.app',
    languages: {
      'en-US': 'https://nanobanana.app/en-US',
      'zh-CN': 'https://nanobanana.app/zh-CN',
    },
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
  verification: {
    google: 'google-verification-code',
  },
};

// Structured data for SEO
export const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'NanoBanana',
  applicationCategory: 'PhotographyApplication',
  operatingSystem: 'iOS, Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '1250',
  },
  description: 'Conversational AI image editor that allows natural language photo editing with perfect object consistency.',
  featureList: [
    'Natural language image editing',
    'Point-and-edit precision',
    'Object consistency preservation',
    'AI-powered background replacement',
    'Smart object removal',
    'Style transfer',
    'Professional retouching',
  ],
};