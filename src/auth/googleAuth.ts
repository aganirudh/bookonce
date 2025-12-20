import { signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

export interface GoogleAuthResult {
  success: boolean;
  user?: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  };
  message: string;
}

export const googleAuth = {
  // Sign in with Google popup
  signInWithPopup: async (): Promise<GoogleAuthResult> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        },
        message: 'Google sign-in successful!',
      };
    } catch (error: any) {
      console.error('Google sign-in error:', error);

      let message = 'Google sign-in failed';
      if (error.code === 'auth/popup-closed-by-user') {
        message = 'Sign-in popup was closed';
      } else if (error.code === 'auth/popup-blocked') {
        message = 'Popup was blocked. Please allow popups for this site.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        message = 'Sign-in was cancelled';
      } else if (error.code === 'auth/network-request-failed') {
        message = 'Network error. Please check your connection.';
      }

      return {
        success: false,
        message,
      };
    }
  },

  // Sign in with redirect (for mobile)
  signInWithRedirect: async (): Promise<void> => {
    await signInWithRedirect(auth, googleProvider);
  },

  // Get redirect result
  getRedirectResult: async (): Promise<GoogleAuthResult> => {
    try {
      const result = await getRedirectResult(auth);
      if (result) {
        const user = result.user;
        return {
          success: true,
          user: {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          },
          message: 'Google sign-in successful!',
        };
      }
      return {
        success: false,
        message: 'No redirect result',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to get redirect result',
      };
    }
  },

  // Sign out
  signOut: async (): Promise<void> => {
    await auth.signOut();
  },
};
