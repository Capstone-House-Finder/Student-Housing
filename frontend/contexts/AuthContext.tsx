'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { authApi } from '@/lib/api';

interface User {
  id: number;
  email: string;
  role: 'student' | 'landlord' | 'admin';
  full_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  bio?: string;
  created_at?: string;
}

interface RegisterInput {
  full_name: string;
  phone: string;
  bio: string;
  email: string;
  password: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterInput) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async (authToken: string) => {
    const response = await authApi.getMe(authToken);
    if (response.success && response.data) {
      const data = response.data as { user: User };
      setUser(data.user);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      // Sync with cookies for Middleware support
      const savedToken = sessionStorage.getItem(TOKEN_KEY) || Cookies.get('authToken');
      if (savedToken) {
        if (!sessionStorage.getItem(TOKEN_KEY)) {
          sessionStorage.setItem(TOKEN_KEY, savedToken);
        }
        setToken(savedToken);
        const success = await fetchUser(savedToken);
        if (!success) {
          sessionStorage.removeItem(TOKEN_KEY);
          Cookies.remove('authToken');
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });

    if (response.success && response.data) {
      const { user: userData, token: authToken } = response.data as { user: User; token: string };
      setUser(userData);
      setToken(authToken);
      // Store in sessionStorage for independent tab sessions
      sessionStorage.setItem(TOKEN_KEY, authToken);
      // Set cookie for Middleware support
      Cookies.set('authToken', authToken, { expires: 7, sameSite: 'lax' });
      return { success: true };
    }

    return {
      success: false,
      error: response.error?.message || 'Login failed',
    };
  };

  const register = async (data: RegisterInput) => {
    const response = await authApi.register(data);

    if (response.success && response.data) {
      const { user: userData, token: authToken } = response.data as { user: User; token: string };
      setUser(userData);
      setToken(authToken);
      sessionStorage.setItem(TOKEN_KEY, authToken);
      Cookies.set('authToken', authToken, { expires: 7, sameSite: 'lax' });
      return { success: true };
    }

    return {
      success: false,
      error: response.error?.message || 'Registration failed',
    };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem(TOKEN_KEY);
    Cookies.remove('authToken');
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...data });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
