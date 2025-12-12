/**
 * Authentication Context
 * Provides authentication state and methods throughout the application
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserProfile } from '@/types/booking';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * JWT Token storage keys
 */
const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_DATA_KEY = 'auth_user_data';

/**
 * Token expiration time (30 minutes)
 */
const TOKEN_EXPIRY_MS = 30 * 60 * 1000;

/**
 * Authentication Provider Component
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());

  /**
   * Initialize auth state from localStorage
   */
  useEffect(() => {
    const initAuth = () => {
      try {
        const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
        const userData = localStorage.getItem(USER_DATA_KEY);

        if (accessToken && userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        // Clear invalid data
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_DATA_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Session timeout handler (30 minutes of inactivity)
   */
  useEffect(() => {
    if (!user) return;

    const checkSessionTimeout = () => {
      const now = Date.now();
      if (now - lastActivity > TOKEN_EXPIRY_MS) {
        logout();
      }
    };

    const interval = setInterval(checkSessionTimeout, 60000); // Check every minute

    // Update last activity on user interaction
    const updateActivity = () => setLastActivity(Date.now());
    window.addEventListener('mousedown', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('touchstart', updateActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousedown', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
    };
  }, [user, lastActivity]);

  /**
   * Login user
   */
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // In production, this would call an API endpoint
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock JWT tokens
      const accessToken = `mock_access_token_${Date.now()}`;
      const refreshToken = `mock_refresh_token_${Date.now()}`;

      // Mock user data
      const userData: UserProfile = {
        userId: `user_${Date.now()}`,
        email,
        firstName: email.split('@')[0],
        lastName: 'User',
        phone: '+1 (555) 123-4567',
        notificationPreferences: {
          email: {
            enabled: true,
            types: [
              'booking_confirmation',
              'booking_modification',
              'booking_cancellation',
              'check_in_reminder',
              'booking_status_change',
              'hotel_cancellation',
            ],
          },
          push: {
            enabled: false,
            types: [
              'booking_status_change',
              'check_in_reminder',
              'hotel_cancellation',
            ],
          },
        },
      };

      // Store tokens and user data
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));

      setUser(userData);
      setLastActivity(Date.now());
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Register new user
   */
  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => {
    setIsLoading(true);
    try {
      // In production, this would call an API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock JWT tokens
      const accessToken = `mock_access_token_${Date.now()}`;
      const refreshToken = `mock_refresh_token_${Date.now()}`;

      // Create user data
      const userData: UserProfile = {
        userId: `user_${Date.now()}`,
        email,
        firstName,
        lastName,
        notificationPreferences: {
          email: {
            enabled: true,
            types: [
              'booking_confirmation',
              'booking_modification',
              'booking_cancellation',
              'check_in_reminder',
              'booking_status_change',
              'hotel_cancellation',
            ],
          },
          push: {
            enabled: false,
            types: [
              'booking_status_change',
              'check_in_reminder',
              'hotel_cancellation',
            ],
          },
        },
      };

      // Store tokens and user data
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));

      setUser(userData);
      setLastActivity(Date.now());
    } catch (error) {
      console.error('Registration failed:', error);
      throw new Error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = () => {
    // Clear tokens and user data
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);

    setUser(null);
  };

  /**
   * Update user profile
   */
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    setIsLoading(true);
    try {
      // In production, this would call an API endpoint
      await new Promise(resolve => setTimeout(resolve, 500));

      const updatedUser = { ...user, ...updates };
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Profile update failed:', error);
      throw new Error('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Get access token for API calls
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Get refresh token
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    // In production, this would call an API endpoint
    await new Promise(resolve => setTimeout(resolve, 500));

    const newAccessToken = `mock_access_token_${Date.now()}`;
    localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
    return newAccessToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
}
