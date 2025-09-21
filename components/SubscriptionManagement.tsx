'use client';

import React, { useState, useEffect } from 'react';
import { SubscriptionTier } from '@/lib/types/database';
import { SUBSCRIPTION_PLANS } from '@/lib/config/subscriptions';
import {
  getSubscriptionStatus,
  cancelSubscription,
  resumeSubscription,
  openBillingPortal,
} from '@/lib/utils/stripe-client';
import { CreditCard, Calendar, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface SubscriptionManagementProps {
  userToken: string;
  userId: string;
  currentTier?: SubscriptionTier;
}

const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({
  userToken,
  userId: _userId,
  currentTier: _currentTier = 'free',
}) => {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSubscriptionStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userToken]);

  const fetchSubscriptionStatus = async () => {
    setLoading(true);
    try {
      const data = await getSubscriptionStatus(userToken);
      if (data.success) {
        setSubscription(data.subscription);
      }
    } catch (_error) {
      console.error('Error fetching subscription:', _error);
      setMessage({ type: 'error', text: 'Failed to load subscription details' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of the billing period.')) {
      return;
    }

    setActionLoading(true);
    setMessage(null);

    try {
      const data = await cancelSubscription(userToken);
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        setSubscription(data.subscription);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to cancel subscription' });
      }
    } catch (_error) {
      setMessage({ type: 'error', text: 'Failed to cancel subscription' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeSubscription = async () => {
    setActionLoading(true);
    setMessage(null);

    try {
      const data = await resumeSubscription(userToken);
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        setSubscription(data.subscription);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to resume subscription' });
      }
    } catch (_error) {
      setMessage({ type: 'error', text: 'Failed to resume subscription' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenBillingPortal = async () => {
    setActionLoading(true);
    setMessage(null);

    try {
      const result = await openBillingPortal(userToken);
      if (!result.success) {
        setMessage({ type: 'error', text: result.error || 'Failed to open billing portal' });
      }
    } catch (_error) {
      setMessage({ type: 'error', text: 'Failed to open billing portal' });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Active Subscription</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don&apos;t have an active Stripe subscription.
          </p>
        </div>
      </div>
    );
  }

  const plan = SUBSCRIPTION_PLANS[subscription.tier as SubscriptionTier];
  const isWebSubscription = subscription.payment_provider === 'stripe';
  const isCancelled = subscription.stripe_details?.cancel_at_period_end || !subscription.auto_renew;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Subscription Management</h3>
      </div>

      {message && (
        <div className="mx-6 mt-4">
          <div
            className={`flex items-center p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <XCircle className="h-5 w-5 mr-2" />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      <div className="px-6 py-4 space-y-4">
        {/* Plan Details */}
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">{plan.name} Plan</h4>
              <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-gray-900">${plan.price}</span>
              <span className="text-gray-500">/month</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Credits per month:</span>
              <span className="ml-2 font-medium">{plan.credits}</span>
            </div>
            <div>
              <span className="text-gray-500">Images per month:</span>
              <span className="ml-2 font-medium">{plan.images}</span>
            </div>
          </div>
        </div>

        {/* Subscription Status */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Status</span>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                isCancelled
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {isCancelled ? 'Cancelling' : 'Active'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Payment Method</span>
            <div className="flex items-center">
              <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm font-medium">
                {isWebSubscription ? 'Credit Card (Stripe)' : 'Apple Pay'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {isCancelled ? 'Expires on' : 'Next billing date'}
            </span>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm font-medium">{formatDate(subscription.expires_at)}</span>
            </div>
          </div>

          {subscription.purchased_at && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Started on</span>
              <span className="text-sm font-medium">{formatDate(subscription.purchased_at)}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {isWebSubscription && (
          <div className="flex flex-col sm:flex-row gap-3">
            {isCancelled ? (
              <button
                onClick={handleResumeSubscription}
                disabled={actionLoading}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Processing...' : 'Resume Subscription'}
              </button>
            ) : (
              <button
                onClick={handleCancelSubscription}
                disabled={actionLoading}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Processing...' : 'Cancel Subscription'}
              </button>
            )}

            <button
              onClick={handleOpenBillingPortal}
              disabled={actionLoading}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? 'Loading...' : 'Manage Billing'}
            </button>
          </div>
        )}

        {!isWebSubscription && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              This subscription was purchased through Apple Pay. To manage or cancel this subscription,
              please use your iPhone&apos;s Settings &gt; Apple ID &gt; Subscriptions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionManagement;