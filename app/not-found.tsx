'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-dark-secondary border border-primary/20 flex items-center justify-center">
          <span className="text-3xl font-bold text-primary">404</span>
        </div>

        {/* Content */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-yellow-400 mb-4">
            Page Not Found
          </h1>
          <p className="text-gray-400 mb-2">
            Sorry, the page you are looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link href="/" className="block">
            <Button variant="yellow" fullWidth>
              Go Home
            </Button>
          </Link>
          <Link href="/generate" className="block">
            <Button variant="secondary" fullWidth>
              Try Image Generation
            </Button>
          </Link>
        </div>

        {/* Additional Links */}
        <div className="mt-8 pt-6 border-t border-primary/20">
          <p className="text-sm text-gray-500 mb-4">
            Looking for something else?
          </p>
          <div className="flex justify-center space-x-6 text-sm">
            <Link href="/gallery" className="text-primary hover:underline">
              Gallery
            </Link>
            <Link href="/subscription" className="text-primary hover:underline">
              Pricing
            </Link>
            <Link href="/profile" className="text-primary hover:underline">
              Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}