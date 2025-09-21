'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { apiClient } from '@/lib/api/client';
import type { Language, CreditTransaction } from '@/lib/types/database';
import Link from 'next/link';
import DefaultLayout from '@/components/layout/DefaultLayout';

export default function ProfilePage() {
  const { user, isAuthenticated, updateUser, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [languageCode, setLanguageCode] = useState<Language>('en');
  const [creditHistory, setCreditHistory] = useState<CreditTransaction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'cn', name: '中文', flag: '🇨🇳' },
    { code: 'jp', name: '日本語', flag: '🇯🇵' },
    { code: 'kr', name: '한국어', flag: '🇰🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ];

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '');
      setLanguageCode(user.language_code || 'en');
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCreditHistory();
    }
  }, [isAuthenticated]);

  const fetchCreditHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await apiClient.getCreditHistory(10, 0);
      setCreditHistory(response.transactions);
    } catch (err) {
      console.error('Failed to fetch credit history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const updatedUser = await apiClient.updateProfile({
        display_name: displayName,
        language_code: languageCode,
      });

      updateUser(updatedUser);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      setDisplayName(user.display_name || '');
      setLanguageCode(user.language_code || 'en');
    }
    setIsEditing(false);
  };

  const getTransactionIcon = (type: string) => {
    const icons: Record<string, string> = {
      subscription: '💎',
      purchase: '💰',
      usage: '🎨',
      refund: '↩️',
      initial: '🎁',
    };
    return icons[type] || '📝';
  };

  const getTransactionColor = (amount: number) => {
    return amount > 0
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';
  };

  if (!isAuthenticated || !user) {
    return (
      <DefaultLayout>
        <div className="container mx-auto px-4 py-20">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-8">
            <div className="mb-6">
              <span className="text-5xl">🔒</span>
            </div>
            <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please sign in to view your profile
            </p>
            <Link href="/login">
              <Button variant="primary" fullWidth>
                Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#FFD700] to-[#DAA520] bg-clip-text text-transparent">
            Your Profile
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Profile Information</CardTitle>
                  {!isEditing && (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center space-x-4">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={displayName || 'User'}
                      className="w-20 h-20 rounded-full border-2 border-[#FFD700]"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FFD700] to-[#DAA520] flex items-center justify-center text-black text-2xl font-bold">
                      {(displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">User ID</p>
                    <p className="font-mono text-xs">{user.id}</p>
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium mb-2">Display Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your display name"
                      className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-dark-tertiary focus:ring-2 focus:ring-primary focus:border-transparent text-gray-300"
                    />
                  ) : (
                    <p className="text-gray-300">
                      {user.display_name || 'Not set'}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <p className="text-gray-300">
                    {user.email || 'Connected via Apple ID'}
                  </p>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-medium mb-2">Language</label>
                  {isEditing ? (
                    <select
                      value={languageCode}
                      onChange={(e) => setLanguageCode(e.target.value as Language)}
                      className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-dark-tertiary focus:ring-2 focus:ring-primary focus:border-transparent text-gray-300"
                    >
                      {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-300">
                      {languages.find(l => l.code === user.language_code)?.flag}{' '}
                      {languages.find(l => l.code === user.language_code)?.name}
                    </p>
                  )}
                </div>

                {/* Member Since */}
                <div>
                  <label className="block text-sm font-medium mb-2">Member Since</label>
                  <p className="text-gray-300">
                    {new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex space-x-3">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      isLoading={isSaving}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Credit History */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Credit Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingHistory ? (
                  <div className="flex justify-center py-8">
                    <Loading />
                  </div>
                ) : creditHistory.length > 0 ? (
                  <div className="space-y-3">
                    {creditHistory.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">
                            {getTransactionIcon(transaction.transaction_type)}
                          </span>
                          <div>
                            <p className="font-medium text-sm">
                              {transaction.description || transaction.transaction_type}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(transaction.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${getTransactionColor(transaction.amount)}`}>
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                          </p>
                          <p className="text-xs text-gray-500">
                            Balance: {transaction.balance_after}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No credit activity yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Account Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Credits</span>
                  <span className="text-2xl font-bold text-[#FFD700]">{user.credits}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Free Attempts</span>
                  <span className="text-2xl font-bold">{user.free_attempts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Subscription</span>
                  <span className="font-medium capitalize">{user.subscription_tier}</span>
                </div>
                {user.subscription_expires_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Expires</span>
                    <span className="text-sm">
                      {new Date(user.subscription_expires_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="text-primary">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/subscription">
                  <Button variant="secondary" fullWidth className="btn-secondary">
                    Manage Subscription
                  </Button>
                </Link>
                <Link href="/generate">
                  <Button variant="primary" fullWidth className="btn-primary">
                    Generate Image
                  </Button>
                </Link>
                <Link href="/gallery">
                  <Button variant="ghost" fullWidth className="btn-dark">
                    View Gallery
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="card-dark border-red-800">
              <CardHeader>
                <CardTitle className="text-red-400">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button variant="danger" fullWidth disabled>
                  Delete Account (Coming Soon)
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
    </DefaultLayout>
  );
}