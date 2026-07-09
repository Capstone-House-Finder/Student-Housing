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

interface StoredSession {
  user: User;
  token: string;
  timestamp: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessions: StoredSession[];
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; code?: string }>;
  register: (data: RegisterInput) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  logoutAll: () => void;
  switchAccount: (userId: number) => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';
const SESSIONS_KEY = 'auth_sessions';
const ACTIVE_SESSION_KEY = 'active_session_id';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<StoredSession[]>([]);

  const fetchUser = useCallback(async (authToken: string) => {
    const response = await authApi.getMe(authToken);
    if (response.success && response.data) {
      const data = response.data as { user: User };
      setUser(data.user);
      return true;
    }
    return false;
  }, []);

  const saveSessions = useCallback((newSessions: StoredSession[]) => {
    setSessions(newSessions);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(newSessions));
  }, []);

  const setActiveSession = useCallback((userId: number) => {
    localStorage.setItem(ACTIVE_SESSION_KEY, userId.toString());
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      // Load all sessions from localStorage
      const storedSessions = localStorage.getItem(SESSIONS_KEY);
      const parsedSessions: StoredSession[] = storedSessions ? JSON.parse(storedSessions) : [];
      setSessions(parsedSessions);

      // Get active session ID
      const activeSessionId = localStorage.getItem(ACTIVE_SESSION_KEY);
      
      // Try to get token from sessionStorage first (current tab)
      let savedToken = sessionStorage.getItem(TOKEN_KEY);
      
      // If no token in sessionStorage, use active session from localStorage
      if (!savedToken && activeSessionId && parsedSessions.length > 0) {
        const activeSession = parsedSessions.find(s => s.user.id === parseInt(activeSessionId));
        if (activeSession) {
          savedToken = activeSession.token;
          sessionStorage.setItem(TOKEN_KEY, savedToken);
        }
      }

      // Fallback to cookie for middleware support
      if (!savedToken) {
        savedToken = Cookies.get('authToken') ?? null;
      }

      if (savedToken) {
        setToken(savedToken);
        const success = await fetchUser(savedToken);
        if (success && user) {
          // Update active session ID
          setActiveSession(user.id);
        } else {
          // Invalid token, remove it
          sessionStorage.removeItem(TOKEN_KEY);
          Cookies.remove('authToken');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [fetchUser, setActiveSession]);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });

    if (response.success && response.data) {
      const { user: userData, token: authToken } = response.data as { user: User; token: string };
      
      // Check if this user already has a session
      const existingSessionIndex = sessions.findIndex(s => s.user.id === userData.id);
      const newSession: StoredSession = {
        user: userData,
        token: authToken,
        timestamp: Date.now(),
      };

      let newSessions: StoredSession[];
      if (existingSessionIndex >= 0) {
        // Update existing session
        newSessions = [...sessions];
        newSessions[existingSessionIndex] = newSession;
      } else {
        // Add new session
        newSessions = [...sessions, newSession];
      }

      saveSessions(newSessions);
      setActiveSession(userData.id);
      
      setUser(userData);
      setToken(authToken);
      sessionStorage.setItem(TOKEN_KEY, authToken);
      Cookies.set('authToken', authToken, { expires: 7, sameSite: 'lax' });
      
      return { success: true };
    }

    return {
      success: false,
      error: response.error?.message || 'Login failed',
      code: response.error?.code,
    };
  };

  const register = async (data: RegisterInput) => {
    const response = await authApi.register(data);

    if (response.success) {
      return { success: true };
    }

    return {
      success: false,
      error: response.error?.message || 'Registration failed',
    };
  };

  const logout = () => {
    // Remove current session
    if (user) {
      const newSessions = sessions.filter(s => s.user.id !== user.id);
      saveSessions(newSessions);
      
      // If there are other sessions, switch to the most recent one
      if (newSessions.length > 0) {
        const mostRecent = newSessions[newSessions.length - 1];
        switchAccount(mostRecent.user.id);
        return;
      }
    }
    
    // No more sessions, clear everything
    setUser(null);
    setToken(null);
    sessionStorage.removeItem(TOKEN_KEY);
    Cookies.remove('authToken');
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  };

  const logoutAll = () => {
    setUser(null);
    setToken(null);
    setSessions([]);
    sessionStorage.removeItem(TOKEN_KEY);
    Cookies.remove('authToken');
    localStorage.removeItem(SESSIONS_KEY);
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  };

  const switchAccount = (userId: number) => {
    const session = sessions.find(s => s.user.id === userId);
    if (session) {
      setUser(session.user);
      setToken(session.token);
      sessionStorage.setItem(TOKEN_KEY, session.token);
      Cookies.set('authToken', session.token, { expires: 7, sameSite: 'lax' });
      setActiveSession(userId);
    }
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      
      // Update the session in localStorage
      const newSessions = sessions.map(s => 
        s.user.id === user.id ? { ...s, user: updatedUser } : s
      );
      saveSessions(newSessions);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        sessions,
        login,
        register,
        logout,
        logoutAll,
        switchAccount,
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
