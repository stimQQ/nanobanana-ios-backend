'use client';

import React, { useState } from 'react';
import { SUBSCRIPTION_PLANS } from '@/lib/config/subscriptions';
import { SubscriptionTier } from '@/lib/types/database';
import { createCheckoutSession, redirectToCheckout } from '@/lib/utils/stripe-client';
import { Check, Zap, Crown, Diamond } from 'lucide-react';

interface SubscriptionPlansProps {
  currentTier?: SubscriptionTier;
  userToken?: string;
  isWebPlatform?: boolean;
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  currentTier = 'free',
  userToken,
  isWebPlatform = true,
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (tier: Exclude<SubscriptionTier, 'free'>) => {
    if (!userToken) {
      setError('Please sign in to subscribe');
      return;
    }

    if (!isWebPlatform) {
      setError('Please use the mobile app to subscribe with Apple Pay');
      return;
    }

    setLoading(tier);
    setError(null);

    try {
      // Create checkout session
      const { sessionId, error: sessionError } = await createCheckoutSession(
        {
          tier,
          successUrl: `${window.location.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/subscription`,
        },
        userToken
      );

      if (sessionError) {
        setError(sessionError);
        setLoading(null);
        return;
      }

      if (sessionId) {
        // Redirect to Stripe checkout
        const { error: redirectError } = await redirectToCheckout(sessionId);
        if (redirectError) {
          setError(redirectError);
        }
      }
    } catch (err) {
      setError('Failed to start checkout process');
      console.error('Subscription error:', err);
    } finally {
      setLoading(null);
    }
  };

  const getPlanIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'basic':
        return <Zap className="w-8 h-8" />;
      case 'pro':
        return <Crown className="w-8 h-8" />;
      case 'premium':
        return <Diamond className="w-8 h-8" />;
      default:
        return null;
    }
  };

  const getPlanColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'basic':
        return 'from-blue-500 to-blue-600';
      case 'pro':
        return 'from-purple-500 to-purple-600';
      case 'premium':
        return 'from-yellow-500 to-yellow-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const tiers: SubscriptionTier[] = ['basic', 'pro', 'premium'];

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Unlock premium features and generate amazing AI images
          </p>
        </div>

        {error && (
          <div className="mt-6 mx-auto max-w-2xl">
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          </div>
        )}

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6 lg:max-w-4xl lg:mx-auto">
          {tiers.map((tier) => {
            const plan = SUBSCRIPTION_PLANS[tier];
            const isCurrentPlan = currentTier === tier;

            return (
              <div
                key={tier}
                className={`border-2 rounded-lg shadow-sm divide-y divide-gray-200 ${
                  tier === 'pro' ? 'border-purple-500' : 'border-gray-200'
                }`}
              >
                {tier === 'pro' && (
                  <div className="bg-purple-500 text-white text-center py-2 rounded-t-lg">
                    <span className="text-sm font-semibold">MOST POPULAR</span>
                  </div>
                )}

                <div className="p-6">
                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${getPlanColor(tier)} text-white`}>
                    {getPlanIcon(tier)}
                  </div>

                  <h3 className="text-2xl font-semibold text-gray-900 mt-4">
                    {plan.name}
                  </h3>

                  <p className="mt-4 text-sm text-gray-500">
                    {plan.description}
                  </p>

                  <p className="mt-8">
                    <span className="text-4xl font-extrabold text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-base font-medium text-gray-500">
                      /month
                    </span>
                  </p>

                  <ul className="mt-6 space-y-4">
                    <li className="flex">
                      <Check className="flex-shrink-0 w-5 h-5 text-green-500" />
                      <span className="ml-3 text-sm text-gray-700">
                        {plan.credits} credits per month
                      </span>
                    </li>
                    <li className="flex">
                      <Check className="flex-shrink-0 w-5 h-5 text-green-500" />
                      <span className="ml-3 text-sm text-gray-700">
                        {plan.images} AI image generations
                      </span>
                    </li>
                    <li className="flex">
                      <Check className="flex-shrink-0 w-5 h-5 text-green-500" />
                      <span className="ml-3 text-sm text-gray-700">
                        Priority processing
                      </span>
                    </li>
                    {tier === 'premium' && (
                      <li className="flex">
                        <Check className="flex-shrink-0 w-5 h-5 text-green-500" />
                        <span className="ml-3 text-sm text-gray-700">
                          Advanced AI models
                        </span>
                      </li>
                    )}
                  </ul>

                  <div className="mt-8">
                    {isCurrentPlan ? (
                      <button
                        disabled
                        className="w-full bg-gray-100 text-gray-500 py-2 px-4 rounded-md text-sm font-semibold cursor-not-allowed"
                      >
                        Current Plan
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSubscribe(tier as Exclude<SubscriptionTier, 'free'>)}
                        disabled={loading === tier}
                        className={`w-full bg-gradient-to-r ${getPlanColor(
                          tier
                        )} text-white py-2 px-4 rounded-md text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {loading === tier ? 'Processing...' : 'Subscribe'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-gray-500">
            {isWebPlatform
              ? 'Secure payment processing by Stripe. Cancel anytime.'
              : 'iOS users: Subscribe through the mobile app with Apple Pay'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;