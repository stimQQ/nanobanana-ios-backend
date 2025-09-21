'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { apiClient } from '@/lib/api/client';
import type { SubscriptionPlan, Subscription } from '@/lib/types/database';
import Link from 'next/link';
import DefaultLayout from '@/components/layout/DefaultLayout';

export default function SubscriptionPage() {
  const { user, isAuthenticated, refreshProfile } = useAuth();
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  const defaultPlans: SubscriptionPlan[] = [
    {
      tier: 'free',
      price: 0,
      credits: 10,
      images: 5,
      name: 'Free',
      description: 'Perfect for trying out NanoBanana',
      apple_product_id: 'com.nanobanana.free',
    },
    {
      tier: 'basic',
      price: 9.99,
      credits: 100,
      images: 50,
      name: 'Basic',
      description: 'Great for hobbyists and casual creators',
      apple_product_id: 'com.nanobanana.basic',
    },
    {
      tier: 'pro',
      price: 29.99,
      credits: 500,
      images: 250,
      name: 'Pro',
      description: 'Ideal for professionals and content creators',
      apple_product_id: 'com.nanobanana.pro',
    },
    {
      tier: 'premium',
      price: 99.99,
      credits: 2000,
      images: 1000,
      name: 'Premium',
      description: 'Unlimited creativity for power users',
      apple_product_id: 'com.nanobanana.premium',
    },
  ];

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscriptionStatus();
    }
  }, [isAuthenticated]);

  const fetchSubscriptionStatus = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getSubscriptionStatus();
      setCurrentSubscription(response.subscription);
      setAvailablePlans(response.available_plans?.length > 0 ? response.available_plans : defaultPlans);
    } catch (err) {
      console.error('Failed to fetch subscription status:', err);
      setAvailablePlans(defaultPlans);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (plan: SubscriptionPlan) => {
    if (!isAuthenticated) {
      alert('Please sign in to purchase a subscription');
      return;
    }

    // In a real app, this would integrate with Apple's in-app purchase system
    alert(`Purchase ${plan.name} plan: This would trigger the iOS in-app purchase flow`);

    // Simulated purchase for demo
    try {
      // const response = await apiClient.purchaseSubscription({
      //   tier: plan.tier,
      //   receipt_data: 'mock_receipt',
      //   transaction_id: 'mock_transaction_' + Date.now(),
      // });
      //
      // if (response.success) {
      //   await refreshProfile();
      //   await fetchSubscriptionStatus();
      //   alert('Subscription activated successfully!');
      // }
    } catch (err) {
      console.error('Purchase failed:', err);
      alert('Purchase failed. Please try again.');
    }
  };

  const getPlanIcon = (tier: string) => {
    const icons = {
      free: '🎈',
      basic: '⭐',
      pro: '🚀',
      premium: '👑',
    };
    return icons[tier as keyof typeof icons] || '📦';
  };

  const isPlanActive = (tier: string) => {
    return user?.subscription_tier === tier;
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-8">
            <div className="mb-6">
              <span className="text-5xl">🔒</span>
            </div>
            <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please sign in to manage your subscription
            </p>
            <Link href="/login">
              <Button variant="primary" fullWidth>
                Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="flex justify-center">
          <Loading size="lg" text="Loading subscription plans..." />
        </div>
      </div>
    );
  }

  return (
    <DefaultLayout>
      <div className="container mx-auto px-4 py-8 bg-dark min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#FFD700] to-[#DAA520] bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Unlock more credits and features with our subscription plans
          </p>
        </div>

        {/* Current Status */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-4 md:mb-0">
                <h3 className="text-lg font-semibold mb-1">Current Plan</h3>
                <p className="text-2xl font-bold text-[#FFD700] capitalize">
                  {user?.subscription_tier || 'Free'} Plan
                </p>
                {currentSubscription?.expires_at && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Expires: {new Date(currentSubscription.expires_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-8">
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#FFD700]">{user?.credits || 0}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Credits Available</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{user?.free_attempts || 0}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Free Attempts</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {availablePlans.map((plan) => (
            <Card
              key={plan.tier}
              className={`relative ${
                isPlanActive(plan.tier)
                  ? 'ring-2 ring-[#FFD700] shadow-xl'
                  : plan.tier === 'pro'
                  ? 'ring-2 ring-orange-400'
                  : ''
              }`}
            >
              {plan.tier === 'pro' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-orange-400 text-black text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}
              {isPlanActive(plan.tier) && (
                <div className="absolute -top-4 right-4">
                  <span className="bg-[#FFD700] text-black text-xs font-bold px-3 py-1 rounded-full">
                    CURRENT
                  </span>
                </div>
              )}
              <CardHeader className="text-center pt-8">
                <div className="text-4xl mb-2">{getPlanIcon(plan.tier)}</div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <p className="text-gray-400 text-sm mt-2">
                  {plan.description}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <p className="text-4xl font-bold">
                    {plan.price === 0 ? 'Free' : `$${plan.price}`}
                  </p>
                  {plan.price > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">/month</p>
                  )}
                </div>

                <ul className="space-y-3">
                  <li className="flex items-center">
                    <span className="text-primary mr-2">✓</span>
                    <span className="text-sm">{plan.credits} credits/month</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-primary mr-2">✓</span>
                    <span className="text-sm">Up to {plan.images} images</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-primary mr-2">✓</span>
                    <span className="text-sm">
                      {plan.tier === 'premium' ? 'Priority' : 'Standard'} processing
                    </span>
                  </li>
                  {plan.tier !== 'free' && (
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-sm">Advanced features</span>
                    </li>
                  )}
                  {(plan.tier === 'pro' || plan.tier === 'premium') && (
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-sm">Priority support</span>
                    </li>
                  )}
                </ul>

                <Button
                  variant={isPlanActive(plan.tier) ? 'secondary' : 'primary'}
                  fullWidth
                  disabled={isPlanActive(plan.tier)}
                  onClick={() => handlePurchase(plan)}
                >
                  {isPlanActive(plan.tier) ? 'Current Plan' : 'Choose Plan'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4">Feature</th>
                    <th className="text-center py-3 px-4">Free</th>
                    <th className="text-center py-3 px-4">Basic</th>
                    <th className="text-center py-3 px-4">Pro</th>
                    <th className="text-center py-3 px-4">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-800">
                    <td className="py-3 px-4">Monthly Credits</td>
                    <td className="text-center py-3 px-4">10</td>
                    <td className="text-center py-3 px-4">100</td>
                    <td className="text-center py-3 px-4">500</td>
                    <td className="text-center py-3 px-4">2000</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-3 px-4">Text to Image</td>
                    <td className="text-center py-3 px-4 text-primary">✓</td>
                    <td className="text-center py-3 px-4 text-primary">✓</td>
                    <td className="text-center py-3 px-4 text-primary">✓</td>
                    <td className="text-center py-3 px-4 text-primary">✓</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-3 px-4">Image to Image</td>
                    <td className="text-center py-3 px-4 text-gray-400">-</td>
                    <td className="text-center py-3 px-4 text-primary">✓</td>
                    <td className="text-center py-3 px-4 text-primary">✓</td>
                    <td className="text-center py-3 px-4 text-primary">✓</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-3 px-4">HD Quality</td>
                    <td className="text-center py-3 px-4 text-gray-400">-</td>
                    <td className="text-center py-3 px-4 text-gray-400">-</td>
                    <td className="text-center py-3 px-4 text-primary">✓</td>
                    <td className="text-center py-3 px-4 text-primary">✓</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-3 px-4">Priority Processing</td>
                    <td className="text-center py-3 px-4 text-gray-400">-</td>
                    <td className="text-center py-3 px-4 text-gray-400">-</td>
                    <td className="text-center py-3 px-4 text-gray-400">-</td>
                    <td className="text-center py-3 px-4 text-primary">✓</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-3 px-4">Commercial Use</td>
                    <td className="text-center py-3 px-4 text-gray-400">-</td>
                    <td className="text-center py-3 px-4 text-gray-400">-</td>
                    <td className="text-center py-3 px-4 text-primary">✓</td>
                    <td className="text-center py-3 px-4 text-primary">✓</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Support</td>
                    <td className="text-center py-3 px-4 text-sm">Community</td>
                    <td className="text-center py-3 px-4 text-sm">Email</td>
                    <td className="text-center py-3 px-4 text-sm">Priority</td>
                    <td className="text-center py-3 px-4 text-sm">24/7 Priority</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 text-center text-primary">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="card-dark">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2 text-primary">How do credits work?</h3>
                <p className="text-sm text-gray-400">
                  Credits are used to generate images. Text-to-image costs 2 credits, while image-to-image costs 3 credits per generation.
                </p>
              </CardContent>
            </Card>
            <Card className="card-dark">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2 text-primary">Can I cancel anytime?</h3>
                <p className="text-sm text-gray-400">
                  Yes! You can cancel your subscription at any time through your Apple ID settings. You&apos;ll keep access until the end of your billing period.
                </p>
              </CardContent>
            </Card>
            <Card className="card-dark">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2 text-primary">Do unused credits roll over?</h3>
                <p className="text-sm text-gray-400">
                  Credits reset each billing cycle and don&apos;t roll over. Make sure to use them before your renewal date!
                </p>
              </CardContent>
            </Card>
            <Card className="card-dark">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2 text-primary">Can I upgrade or downgrade?</h3>
                <p className="text-sm text-gray-400">
                  Absolutely! You can change your plan at any time. Changes take effect at the next billing cycle.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
    </DefaultLayout>
  );
}