import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({
  authCallback: null as null | ((user: unknown) => void),
  signOut: vi.fn().mockResolvedValue(undefined),
  signIn: vi.fn(),
  register: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((_auth, callback) => {
    authMocks.authCallback = callback;
    callback(null);
    return vi.fn();
  }),
  signInAnonymously: vi.fn(),
}));
vi.mock('@/lib/firebase', () => ({ auth: { signOut: authMocks.signOut } }));
vi.mock('@/auth/googleAuth', () => ({
  googleAuth: { signInWithPopup: vi.fn().mockResolvedValue({ success: true, message: 'ok' }) },
}));
vi.mock('@/auth/emailAuth', () => ({
  emailAuth: {
    signIn: authMocks.signIn,
    register: authMocks.register,
    resetPassword: vi.fn().mockResolvedValue({ success: true, message: 'ok' }),
  },
}));
vi.mock('@/auth/emailOTPAuth', () => ({
  emailOTPAuth: {
    init: vi.fn(),
    sendOTP: vi.fn().mockResolvedValue({ success: true, message: 'sent' }),
    verifyOTP: vi.fn().mockReturnValue({ success: true, message: 'verified' }),
    clearOTP: vi.fn(),
  },
}));

import { AuthProvider, useAuth } from '../AuthContext';

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

describe('AuthContext', () => {
  beforeEach(() => {
    sessionStorage.clear();
    authMocks.signOut.mockClear();
    authMocks.signIn.mockResolvedValue({ success: true, message: 'signed in' });
    authMocks.register.mockResolvedValue({ success: true, message: 'registered' });
  });

  it('rejects use outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider'
    );
    vi.restoreAllMocks();
  });

  it('starts unauthenticated after the auth listener resolves', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('maps the authenticated Firebase user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() =>
      authMocks.authCallback?.({
        uid: 'user-1',
        email: 'traveler@example.com',
        displayName: 'Traveler',
        photoURL: null,
        phoneNumber: null,
        emailVerified: true,
      })
    );
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(result.current.user?.email).toBe('traveler@example.com');
  });

  it('delegates login and registration to the Firebase adapters', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(() => result.current.login('a@example.com', 'password'));
    await act(() => result.current.register('b@example.com', 'password', 'Book', 'Once'));
    expect(authMocks.signIn).toHaveBeenCalledWith('a@example.com', 'password');
    expect(authMocks.register).toHaveBeenCalledWith('b@example.com', 'password', 'Book', 'Once');
  });

  it('updates an authenticated profile and logs out cleanly', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() =>
      authMocks.authCallback?.({
        uid: 'user-1',
        email: 'a@example.com',
        displayName: 'Old',
        photoURL: null,
        phoneNumber: null,
        emailVerified: true,
      })
    );
    await act(() => result.current.updateProfile({ firstName: 'New', displayName: 'New Name' }));
    expect(result.current.user?.firstName).toBe('New');
    await act(() => result.current.logout());
    expect(authMocks.signOut).toHaveBeenCalledOnce();
    expect(result.current.user).toBeNull();
  });
});
