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
  const { isAuthenticated, loginWithGoogle, loginDev } = useAuth();
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
            {/* Google Sign In - Custom Button */}
            <button
              onClick={() => {
                // Trigger Google Sign-In programmatically
                const googleButton = document.querySelector('#google-signin-button button') as HTMLButtonElement;
                if (googleButton) googleButton.click();
              }}
              className="w-full bg-white text-gray-900 font-semibold py-4 px-6 rounded-xl flex items-center justify-center space-x-3 hover:bg-gray-100 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] border border-gray-200 shadow-sm"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-lg">Continue with Google</span>
            </button>

            {/* Hidden Google Login Component */}
            <div id="google-signin-button" className="hidden">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  console.log('Login Failed');
                  alert('Google login failed. Please try again.');
                }}
              />
            </div>


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