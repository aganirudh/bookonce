import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { googleAuth } from '@/auth/googleAuth';
import { emailAuth } from '@/auth/emailAuth';
import { emailOTPAuth } from '@/auth/emailOTPAuth';

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  emailVerified: boolean;
  authMethod?: 'google' | 'email' | 'email-otp' | 'anonymous';
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => Promise<{ success: boolean; message: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; message: string }>;
  sendEmailOTP: (email: string, name?: string) => Promise<{ success: boolean; message: string }>;
  verifyEmailOTP: (email: string, otp: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize EmailJS
  useEffect(() => {
    emailOTPAuth.init();
  }, []);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          phoneNumber: firebaseUser.phoneNumber,
          emailVerified: firebaseUser.emailVerified,
        });
      } else {
        // Check sessionStorage for session-based OTP login (expires when browser closes)
        const sessionToken = sessionStorage.getItem('auth_session_token');
        const authEmail = sessionStorage.getItem('auth_email');
        const authMethod = sessionStorage.getItem('auth_method');

        if (sessionToken && authEmail && authMethod === 'otp') {
          // Restore OTP session
          setUser({
            uid: sessionToken,
            email: authEmail,
            displayName: authEmail.split('@')[0],
            photoURL: null,
            phoneNumber: null,
            emailVerified: true,
            authMethod: 'email-otp',
          });
        } else {
          setUser(null);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Email/Password Login
  const login = async (email: string, password: string) => {
    const result = await emailAuth.signIn(email, password);
    return { success: result.success, message: result.message };
  };

  // Email/Password Register
  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    const result = await emailAuth.register(email, password, firstName, lastName);
    return { success: result.success, message: result.message };
  };

  // Google Login
  const loginWithGoogle = async () => {
    const result = await googleAuth.signInWithPopup();
    return { success: result.success, message: result.message };
  };

  // Email OTP - Send
  const sendEmailOTP = async (email: string, name?: string) => {
    const result = await emailOTPAuth.sendOTP(email, name);
    return { success: result.success, message: result.message };
  };

  // Email OTP - Verify
  const verifyEmailOTP = async (email: string, otp: string) => {
    const result = emailOTPAuth.verifyOTP(email, otp);

    if (result.success) {
      // Create user session for email OTP login
      const sessionToken = `email_${email.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
      const emailUser: AuthUser = {
        uid: sessionToken,
        email: email,
        displayName: email.split('@')[0],
        photoURL: null,
        phoneNumber: null,
        emailVerified: true,
        authMethod: 'email-otp',
      };

      // Save to sessionStorage (expires when browser closes)
      sessionStorage.setItem('auth_session_token', sessionToken);
      sessionStorage.setItem('auth_email', email);
      sessionStorage.setItem('auth_method', 'otp');
      setUser(emailUser);
    }

    return { success: result.success, message: result.message };
  };

  // Logout
  const logout = async () => {
    await auth.signOut();
    sessionStorage.removeItem('auth_session_token');
    sessionStorage.removeItem('auth_email');
    sessionStorage.removeItem('auth_method');
    emailOTPAuth.clearOTP();
    setUser(null);
  };

  // Reset Password
  const resetPassword = async (email: string) => {
    const result = await emailAuth.resetPassword(email);
    return { success: result.success, message: result.message };
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    loginWithGoogle,
    sendEmailOTP,
    verifyEmailOTP,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
