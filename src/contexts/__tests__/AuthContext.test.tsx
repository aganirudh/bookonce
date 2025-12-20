/**
 * AuthContext Tests
 * Tests for authentication context and hooks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { AuthProvider, useAuth, getAccessToken, refreshAccessToken } from '../AuthContext';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Wrapper component for hooks
const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

describe('AuthContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllTimers();
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });

    it('should provide initial unauthenticated state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should restore user from localStorage on mount', async () => {
      const mockUser = {
        userId: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        notificationPreferences: {
          email: { enabled: true, types: [] },
          push: { enabled: false, types: [] },
        },
      };

      localStorageMock.setItem('auth_access_token', 'mock_token');
      localStorageMock.setItem('auth_user_data', JSON.stringify(mockUser));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isAuthenticated).toBe(true);
      });
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(result.current.user).toBeTruthy();
      expect(result.current.user?.email).toBe('test@example.com');
      expect(result.current.isAuthenticated).toBe(true);
      expect(localStorageMock.getItem('auth_access_token')).toBeTruthy();
      expect(localStorageMock.getItem('auth_refresh_token')).toBeTruthy();
    });

    it('should store user data in localStorage', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      const storedData = localStorageMock.getItem('auth_user_data');
      expect(storedData).toBeTruthy();

      const userData = JSON.parse(storedData!);
      expect(userData.email).toBe('test@example.com');
      expect(userData.notificationPreferences).toBeDefined();
    });
  });

  describe('register', () => {
    it('should register new user successfully', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.register('newuser@example.com', 'password123', 'New', 'User');
      });

      expect(result.current.user).toBeTruthy();
      expect(result.current.user?.email).toBe('newuser@example.com');
      expect(result.current.user?.firstName).toBe('New');
      expect(result.current.user?.lastName).toBe('User');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should create default notification preferences', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.register('newuser@example.com', 'password123', 'New', 'User');
      });

      expect(result.current.user?.notificationPreferences).toBeDefined();
      expect(result.current.user?.notificationPreferences.email.enabled).toBe(true);
      expect(result.current.user?.notificationPreferences.push.enabled).toBe(false);
    });
  });

  describe('logout', () => {
    it('should logout user and clear data', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Login first
      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorageMock.getItem('auth_access_token')).toBeNull();
      expect(localStorageMock.getItem('auth_refresh_token')).toBeNull();
      expect(localStorageMock.getItem('auth_user_data')).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Login first
      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      // Update profile
      await act(async () => {
        await result.current.updateProfile({
          firstName: 'Updated',
          lastName: 'Name',
        });
      });

      expect(result.current.user?.firstName).toBe('Updated');
      expect(result.current.user?.lastName).toBe('Name');
      expect(result.current.user?.email).toBe('test@example.com'); // Should preserve other fields
    });

    it('should throw error when updating without login', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(
        act(async () => {
          await result.current.updateProfile({ firstName: 'Test' });
        })
      ).rejects.toThrow('No user logged in');
    });
  });

  describe('token management', () => {
    it('should get access token', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      const token = getAccessToken();
      expect(token).toBeTruthy();
      expect(token).toContain('mock_access_token');
    });

    it('should refresh access token', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      const oldToken = getAccessToken();

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const newToken = await refreshAccessToken();
      expect(newToken).toBeTruthy();
      expect(newToken).not.toBe(oldToken);
    });

    it('should return null when refreshing without refresh token', async () => {
      const token = await refreshAccessToken();
      expect(token).toBeNull();
    });
  });
});
