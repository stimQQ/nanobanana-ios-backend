'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/lib/types/database';
import { apiClient } from '@/lib/api/client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (appleIdToken: string) => Promise<void>;
  loginWithGoogle: (credential: string, userInfo: { name: string; email: string; picture?: string }) => Promise<void>;
  loginDev: (email?: string, name?: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = apiClient.getToken();
        if (token) {
          const profile = await apiClient.getProfile();
          setUser(profile);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        apiClient.clearToken();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (appleIdToken: string) => {
    try {
      setIsLoading(true);
      const { user: loggedInUser } = await apiClient.login(appleIdToken);
      setUser(loggedInUser);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (credential: string, userInfo: { name: string; email: string; picture?: string }) => {
    try {
      setIsLoading(true);
      const { user: loggedInUser } = await apiClient.loginWithGoogle(credential, userInfo);
      setUser(loggedInUser);
    } finally {
      setIsLoading(false);
    }
  };

  const loginDev = async (email?: string, name?: string) => {
    try {
      setIsLoading(true);
      const { user: loggedInUser } = await apiClient.loginDev(email, name);
      setUser(loggedInUser);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiClient.logout();
    setUser(null);
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const profile = await apiClient.getProfile();
      setUser(profile);
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    loginWithGoogle,
    loginDev,
    logout,
    refreshProfile,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};