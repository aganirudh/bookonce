import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';

let confirmationResult: ConfirmationResult | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;

export interface PhoneAuthResult {
  success: boolean;
  user?: {
    uid: string;
    phoneNumber: string | null;
  };
  message: string;
}

export const phoneAuth = {
  // Initialize reCAPTCHA verifier
  initRecaptcha: (buttonId: string = 'recaptcha-container'): RecaptchaVerifier => {
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
    }

    recaptchaVerifier = new RecaptchaVerifier(auth, buttonId, {
      size: 'invisible',
      callback: () => {
        console.log('reCAPTCHA solved');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
      },
    });

    return recaptchaVerifier;
  },

  // Send OTP to phone number
  sendOTP: async (phoneNumber: string): Promise<PhoneAuthResult> => {
    try {
      // Format phone number (ensure it has country code)
      let formattedPhone = phoneNumber.trim();
      if (!formattedPhone.startsWith('+')) {
        // Default to India country code, change as needed
        formattedPhone = `+91${formattedPhone.replace(/\D/g, '')}`;
      }

      // Initialize reCAPTCHA if not already done
      if (!recaptchaVerifier) {
        phoneAuth.initRecaptcha('recaptcha-container');
      }

      confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier!);

      return {
        success: true,
        message: 'OTP sent successfully!',
      };
    } catch (error: any) {
      console.error('Phone OTP error:', error);

      // Reset reCAPTCHA on error
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        recaptchaVerifier = null;
      }

      let message = 'Failed to send OTP';
      if (error.code === 'auth/invalid-phone-number') {
        message = 'Invalid phone number format. Include country code (e.g., +91)';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Please try again later.';
      } else if (error.code === 'auth/quota-exceeded') {
        message = 'SMS quota exceeded. Please try again later.';
      } else if (error.code === 'auth/captcha-check-failed') {
        message = 'reCAPTCHA verification failed. Please refresh and try again.';
      }

      return {
        success: false,
        message,
      };
    }
  },

  // Verify OTP
  verifyOTP: async (otp: string): Promise<PhoneAuthResult> => {
    try {
      if (!confirmationResult) {
        return {
          success: false,
          message: 'Please request OTP first',
        };
      }

      const result = await confirmationResult.confirm(otp);
      const user = result.user;

      // Clear after successful verification
      confirmationResult = null;
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        recaptchaVerifier = null;
      }

      return {
        success: true,
        user: {
          uid: user.uid,
          phoneNumber: user.phoneNumber,
        },
        message: 'Phone verified successfully!',
      };
    } catch (error: any) {
      console.error('OTP verification error:', error);

      let message = 'Invalid OTP';
      if (error.code === 'auth/invalid-verification-code') {
        message = 'Invalid verification code';
      } else if (error.code === 'auth/code-expired') {
        message = 'OTP has expired. Please request a new one.';
      }

      return {
        success: false,
        message,
      };
    }
  },

  // Clear reCAPTCHA
  clearRecaptcha: () => {
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
      recaptchaVerifier = null;
    }
    confirmationResult = null;
  },

  // Sign out
  signOut: async (): Promise<void> => {
    await auth.signOut();
  },
};
