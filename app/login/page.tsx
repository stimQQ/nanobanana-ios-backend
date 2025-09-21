'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '@/contexts/AuthContext';

interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, login, loginWithGoogle, loginDev } = useAuth();
  const [isDevMode, setIsDevMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setIsDevMode(process.env.NODE_ENV === 'development');
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/generate');
    }
  }, [isAuthenticated, router]);

  const handleAppleSignIn = async () => {
    // In a real iOS app, this would trigger Apple Sign In
    alert('This would trigger Apple Sign In on iOS. For demo, use Google Sign In or Test Login.');
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const credential = credentialResponse.credential;
      const decoded: any = jwtDecode(credential);

      const userInfo: GoogleUserInfo = {
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
      };

      await loginWithGoogle(credential, userInfo);
      // Pass isNewUser flag to show welcome message on generate page
      router.push('/generate?welcome=true');
    } catch (error) {
      console.error('Google login failed:', error);
      alert('Login failed. Please try again.');
    }
  };

  const handleDevLogin = async () => {
    try {
      await loginDev();
      router.push('/generate');
    } catch (error) {
      console.error('Dev login failed:', error);
      alert('Dev login failed. Please check your environment configuration.');
    }
  };

  // Don't render Google OAuth provider until mounted to prevent hydration issues
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#FFD700] rounded-2xl mb-4 shadow-xl animate-pulse">
            <span className="text-5xl">🍌</span>
          </div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '85523758539-mmka868bo5486mpmssjmlsm1o3l061q1.apps.googleusercontent.com';

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-8">
        {/* Main Content Container */}
        <div className="w-full max-w-md space-y-8 sm:max-w-lg">
          {/* App Logo and Title */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-[#FFD700] rounded-3xl mb-6 shadow-2xl">
              <span className="text-5xl sm:text-6xl">🍌</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#FFD700] mb-3">
              NanoBanana
            </h1>
            <p className="text-base sm:text-lg text-gray-400 px-4 mb-4">
              Sign in to start creating amazing AI-generated images
            </p>
            {/* Free Trial Banner */}
            <div className="bg-gradient-to-r from-[#FFD700]/20 to-[#DAA520]/20 border border-[#FFD700]/50 rounded-xl p-4 mx-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className="text-2xl">🎁</span>
                <h2 className="text-lg font-bold text-[#FFD700]">Get 10 Free Generations!</h2>
              </div>
              <p className="text-sm text-gray-300">
                Sign in with Google and instantly receive 10 free AI image generations.
                No credit card required!
              </p>
            </div>
          </div>

          {/* Login Options */}
          <div className="space-y-4">
            {/* Google Sign In */}
            <div className="flex justify-center">
              <div className="w-full google-signin-button">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    console.log('Login Failed');
                    alert('Google login failed. Please try again.');
                  }}
                  theme="filled_blue"
                  size="large"
                  width="100%"
                  text="continue_with"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-[#0a0a0a] text-gray-400">
                  OR
                </span>
              </div>
            </div>

            {/* Apple Sign In */}
            <button
              onClick={handleAppleSignIn}
              className="w-full bg-gray-800 text-gray-300 font-semibold py-4 px-6 rounded-xl flex items-center justify-center space-x-3 hover:bg-gray-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
              </svg>
              <span className="text-lg">Sign in with Apple</span>
            </button>

            {/* Dev/Test Login */}
            {isDevMode && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-[#0a0a0a] text-gray-400">
                      Development Mode
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleDevLogin}
                  className="w-full bg-[#FFD700] text-black font-semibold py-4 px-6 rounded-xl flex items-center justify-center space-x-3 hover:bg-[#DAA520] transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-lg">Quick Test Login</span>
                </button>

                <div className="bg-[#1a1a1a] border border-[#FFD700]/30 rounded-xl p-4">
                  <p className="text-sm text-gray-300">
                    <span className="text-[#FFD700] font-semibold">Test Mode:</span> Click &ldquo;Quick Test Login&rdquo; to instantly access the app with 100 test credits. This is only available in development mode.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Info Section */}
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
            <h3 className="font-semibold text-[#FFD700] mb-3 text-center">
              Sign In Options
            </h3>
            <ul className="text-sm text-gray-300 space-y-2">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-[#FFD700] rounded-full"></div>
                <span>Sign in with Google (Recommended)</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-[#FFD700] rounded-full"></div>
                <span>Sign in with Apple (iOS App)</span>
              </li>
              {isDevMode && (
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-[#FFD700] rounded-full"></div>
                  <span>Quick Test Login (Dev Only)</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 sm:mt-12 w-full max-w-md sm:max-w-lg text-center space-y-4">
          <div>
            <p className="text-sm text-gray-400 mb-2">
              Need the iOS app?
            </p>
            <a
              href="https://apps.apple.com/app/nanobanana"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-[#FBBF24] hover:text-[#F59E0B] font-medium text-sm transition-colors"
            >
              <span>Download from App Store</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-gray-500">
            <a href="/privacy" className="hover:text-[#FBBF24] transition-colors">
              Privacy Policy
            </a>
            <span className="hidden sm:inline">•</span>
            <a href="/terms" className="hover:text-[#FBBF24] transition-colors">
              Terms of Service
            </a>
            <span className="hidden sm:inline">•</span>
            <a href="/help" className="hover:text-[#FBBF24] transition-colors">
              Help
            </a>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}