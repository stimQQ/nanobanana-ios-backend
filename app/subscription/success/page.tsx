'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight, Package, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sessionDetails, setSessionDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      setError('No session ID found');
      setLoading(false);
      return;
    }

    fetchSessionDetails(sessionId);
  }, [searchParams]);

  const fetchSessionDetails = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/stripe/create-checkout-session?session_id=${sessionId}`);
      const data = await response.json();

      if (data.success) {
        setSessionDetails(data.session);
      } else {
        setError(data.error || 'Failed to retrieve session details');
      }
    } catch (err) {
      console.error('Error fetching session details:', err);
      setError('Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Payment Error</h2>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
            <div className="mt-6">
              <Link
                href="/subscription"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Return to Subscriptions
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-3xl mx-auto pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-12 w-12 text-green-600 animate-pulse" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-lg text-gray-600">
            Your subscription has been activated
          </p>
        </div>

        {/* Payment Details Card */}
        {sessionDetails && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">Payment Details</h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-600">Amount Paid</span>
                </div>
                <span className="font-semibold text-gray-900">
                  ${((sessionDetails.amount_total || 0) / 100).toFixed(2)} {sessionDetails.currency?.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center">
                  <Package className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-600">Payment Status</span>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {sessionDetails.payment_status || 'Completed'}
                </span>
              </div>

              {sessionDetails.customer_email && (
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600">Email</span>
                  <span className="font-medium text-gray-900">{sessionDetails.customer_email}</span>
                </div>
              )}

              <div className="flex items-center justify-between py-3">
                <span className="text-gray-600">Transaction ID</span>
                <span className="font-mono text-xs text-gray-500">{sessionDetails.id}</span>
              </div>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold">
                    1
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-gray-900 font-medium">Your credits have been added</p>
                  <p className="text-gray-600 text-sm mt-1">
                    You can now start generating AI images with your new credits
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold">
                    2
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-gray-900 font-medium">Check your email</p>
                  <p className="text-gray-600 text-sm mt-1">
                    We've sent you a receipt and subscription details
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold">
                    3
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-gray-900 font-medium">Manage your subscription</p>
                  <p className="text-gray-600 text-sm mt-1">
                    Visit your account page anytime to manage or cancel your subscription
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/generate"
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Start Creating
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Support Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@nanobanana.app" className="text-blue-600 hover:text-blue-500">
              support@nanobanana.app
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}