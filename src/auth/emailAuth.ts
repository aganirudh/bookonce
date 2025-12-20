import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export interface EmailAuthResult {
  success: boolean;
  user?: {
    uid: string;
    email: string | null;
    displayName: string | null;
    emailVerified: boolean;
  };
  message: string;
}

export const emailAuth = {
  // Register with email and password
  register: async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<EmailAuthResult> => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      // Update profile with name
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`,
      });

      // Send verification email
      await sendEmailVerification(user);

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: `${firstName} ${lastName}`,
          emailVerified: user.emailVerified,
        },
        message: 'Account created! Please check your email to verify.',
      };
    } catch (error: any) {
      console.error('Email registration error:', error);

      let message = 'Registration failed';
      if (error.code === 'auth/email-already-in-use') {
        message = 'This email is already registered';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password is too weak (minimum 6 characters)';
      }

      return {
        success: false,
        message,
      };
    }
  },

  // Sign in with email and password
  signIn: async (email: string, password: string): Promise<EmailAuthResult> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified,
        },
        message: 'Sign-in successful!',
      };
    } catch (error: any) {
      console.error('Email sign-in error:', error);

      let message = 'Sign-in failed';
      if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/invalid-credential') {
        message = 'Invalid email or password';
      }

      return {
        success: false,
        message,
      };
    }
  },

  // Send password reset email
  resetPassword: async (email: string): Promise<EmailAuthResult> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
        message: 'Password reset email sent!',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to send reset email',
      };
    }
  },

  // Sign out
  signOut: async (): Promise<void> => {
    await auth.signOut();
  },
};
