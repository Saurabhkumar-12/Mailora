import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.auth.getCurrentUser();
      if (res.success && res.authenticated && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check if redirected with session_token from Google OAuth callback
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const sessionToken = searchParams.get('session_token');
      if (sessionToken) {
        localStorage.setItem('mailora_session_token', sessionToken);
        // Remove query parameter cleanly from browser address bar without reloading
        searchParams.delete('session_token');
        const newSearch = searchParams.toString();
        const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}${window.location.hash}`;
        window.history.replaceState({}, document.title, newUrl);
      }
    } catch {
      // Ignore URL parsing errors
    }

    fetchUser();
  }, []);

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const authUrl = await api.auth.getGoogleAuthUrl();
      window.location.href = authUrl;
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : 'Unable to initiate Google sign in. Please try again.';
      setError(msg);
    }
  };

  const loginWithPassword = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.auth.login({ email, password });
      if (res.data?.sessionToken) {
        localStorage.setItem('mailora_session_token', res.data.sessionToken);
      }
      if (res.data?.user) {
        setUser(res.data.user);
      } else {
        await fetchUser();
      }
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : 'Sign in failed. Please check your credentials.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const registerUser = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.auth.register({ name, email, password });
      if (res.data?.sessionToken) {
        localStorage.setItem('mailora_session_token', res.data.sessionToken);
      }
      if (res.data?.user) {
        setUser(res.data.user);
      } else {
        await fetchUser();
      }
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await api.auth.logout();
      localStorage.removeItem('mailora_session_token');
      setUser(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Logout failed. Please try again.';
      setError(msg);
    } finally {
      localStorage.removeItem('mailora_session_token');
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        error,
        loginWithGoogle,
        loginWithPassword,
        register: registerUser,
        logout,
        refetchUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
