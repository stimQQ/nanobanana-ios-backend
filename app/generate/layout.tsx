'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api/client';
import type { Language } from '@/lib/types/database';

function GenerateHeader() {
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [languageCode, setLanguageCode] = useState<Language>('en');
  const [isSaving, setIsSaving] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'cn', name: '中文', flag: '🇨🇳' },
    { code: 'jp', name: '日本語', flag: '🇯🇵' },
    { code: 'kr', name: '한국어', flag: '🇰🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
        setIsEditing(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '');
      setLanguageCode(user.language_code || 'en');
    }
  }, [user]);

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

  return (
    <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-gray-800">
      <nav className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-[#FFD700] rounded-lg flex items-center justify-center">
              <span className="text-xl">🍌</span>
            </div>
            <span className="text-lg font-bold text-[#FFD700]">
              NanoBanana
            </span>
          </Link>

          {/* User Section */}
          <div className="flex items-center space-x-3">
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3" ref={profileMenuRef}>
                {/* Credits Display */}
                <div className="flex items-center space-x-1 bg-[#B8860B]/30 px-3 py-1.5 rounded-lg">
                  <span className="text-xl">💰</span>
                  <span className="font-semibold text-[#FFD700]">
                    {user.credits}
                  </span>
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center hover:opacity-80 transition-opacity"
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt="Profile"
                        className="w-9 h-9 rounded-full border-2 border-[#FFD700]"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#FFD700] flex items-center justify-center text-black font-bold shadow-md">
                        {(user.display_name || 'U')[0].toUpperCase()}
                      </div>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-gray-900 rounded-lg shadow-lg border border-gray-700 py-2 z-50 max-h-[80vh] overflow-y-auto">
                      {/* Profile Section */}
                      <div className="px-4 py-3 border-b border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold text-gray-300">Profile</h3>
                          {!isEditing && (
                            <button
                              onClick={() => setIsEditing(true)}
                              className="text-xs text-[#FFD700] hover:underline"
                            >
                              Edit
                            </button>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs text-gray-400">Display Name</label>
                              <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Enter your name"
                                className="w-full mt-1 px-2 py-1 text-sm border border-gray-600 rounded bg-gray-800 text-gray-300 focus:ring-1 focus:ring-[#FFD700] focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-400">Language</label>
                              <select
                                value={languageCode}
                                onChange={(e) => setLanguageCode(e.target.value as Language)}
                                className="w-full mt-1 px-2 py-1 text-sm border border-gray-600 rounded bg-gray-800 text-gray-300 focus:ring-1 focus:ring-[#FFD700] focus:border-transparent"
                              >
                                {languages.map((lang) => (
                                  <option key={lang.code} value={lang.code}>
                                    {lang.flag} {lang.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="yellow"
                                onClick={handleSaveProfile}
                                disabled={isSaving}
                                isLoading={isSaving}
                                className="flex-1"
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelEdit}
                                disabled={isSaving}
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-medium text-gray-300">
                                {user.display_name || 'User'}
                              </p>
                              <p className="text-xs text-gray-400">
                                {user.email}
                              </p>
                            </div>
                            <div className="flex items-center text-xs text-gray-400">
                              <span className="mr-1">
                                {languages.find(l => l.code === user.language_code)?.flag}
                              </span>
                              {languages.find(l => l.code === user.language_code)?.name}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Account Stats */}
                      <div className="px-4 py-3 border-b border-gray-700">
                        <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase">Account Stats</h4>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-lg font-bold text-[#FFD700]">{user.credits}</p>
                            <p className="text-xs text-gray-500">Credits</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold">{user.free_attempts}</p>
                            <p className="text-xs text-gray-500">Free Uses</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold capitalize">{user.subscription_tier || 'free'}</p>
                            <p className="text-xs text-gray-500">Plan</p>
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <Link
                        href="/gallery"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        🖼️ My Gallery
                      </Link>
                      <Link
                        href="/subscription"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        💎 Pricing & Plans
                      </Link>

                      <div className="border-t border-gray-700 mt-2 pt-2">
                        <button
                          onClick={() => {
                            logout();
                            setIsProfileMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 transition-colors"
                        >
                          🚪 Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="yellow" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

export default function GenerateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <GenerateHeader />
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
}