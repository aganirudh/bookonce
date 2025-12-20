import emailjs from '@emailjs/browser';

// EmailJS Configuration from .env
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_nq6isjp';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_hram4sh';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'pM8tyRzqYSayytZAO';

// Store OTP temporarily
interface OTPStore {
  otp: string;
  email: string;
  expiresAt: number;
  attempts: number;
}

let otpStore: OTPStore | null = null;

export interface EmailOTPResult {
  success: boolean;
  message: string;
}

// Generate 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const emailOTPAuth = {
  // Initialize EmailJS
  init: () => {
    try {
      emailjs.init(EMAILJS_PUBLIC_KEY);
      console.log('✅ EmailJS initialized');
    } catch (error) {
      console.error('❌ EmailJS init error:', error);
    }
  },

  // Send OTP to email
  sendOTP: async (email: string, userName?: string): Promise<EmailOTPResult> => {
    try {
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          success: false,
          message: 'Please enter a valid email address',
        };
      }

      // Check if too many attempts
      if (otpStore && otpStore.email === email && otpStore.attempts >= 3) {
        const timeLeft = Math.ceil((otpStore.expiresAt - Date.now()) / 1000 / 60);
        if (timeLeft > 0) {
          return {
            success: false,
            message: `Too many attempts. Please try again in ${timeLeft} minutes.`,
          };
        }
      }

      // Generate new OTP
      const otp = generateOTP();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

      // Store OTP
      otpStore = {
        otp,
        email,
        expiresAt,
        attempts: 0,
      };

      // EmailJS template parameters - MUST match your template exactly
      const templateParams = {
        email: email, // {{email}} in template
        to_name: userName || email.split('@')[0], // {{to_name}} in template
        otp_code: otp, // {{otp_code}} in template
        expiry_time: '10 minutes', // {{expiry_time}} in template
      };

      console.log('📧 Sending OTP to:', email);
      console.log('📧 Template params:', templateParams);

      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );

      console.log('✅ EmailJS response:', response);

      return {
        success: true,
        message: 'OTP sent to your email! Check your inbox.',
      };
    } catch (error: any) {
      console.error('❌ Email OTP error:', error);

      // Better error message
      let message = 'Failed to send OTP. Please try again.';
      if (error.status === 422) {
        message = 'Email service configuration error. Please contact support.';
      } else if (error.text) {
        message = error.text;
      }

      return {
        success: false,
        message,
      };
    }
  },

  // Verify OTP
  verifyOTP: (email: string, enteredOTP: string): EmailOTPResult => {
    try {
      if (!otpStore) {
        return {
          success: false,
          message: 'Please request an OTP first',
        };
      }

      if (otpStore.email !== email) {
        return {
          success: false,
          message: 'Email mismatch. Please request a new OTP.',
        };
      }

      if (Date.now() > otpStore.expiresAt) {
        otpStore = null;
        return {
          success: false,
          message: 'OTP has expired. Please request a new one.',
        };
      }

      otpStore.attempts += 1;

      if (otpStore.attempts > 5) {
        return {
          success: false,
          message: 'Too many failed attempts. Please request a new OTP.',
        };
      }

      if (otpStore.otp !== enteredOTP) {
        return {
          success: false,
          message: `Invalid OTP. ${5 - otpStore.attempts} attempts remaining.`,
        };
      }

      otpStore = null;
      return {
        success: true,
        message: 'Email verified successfully!',
      };
    } catch (error) {
      console.error('OTP verification error:', error);
      return {
        success: false,
        message: 'Verification failed. Please try again.',
      };
    }
  },

  resendOTP: async (email: string): Promise<EmailOTPResult> => {
    if (otpStore && otpStore.email === email) {
      otpStore = null;
    }
    return emailOTPAuth.sendOTP(email);
  },

  clearOTP: () => {
    otpStore = null;
  },

  getTimeRemaining: (): number => {
    if (!otpStore) return 0;
    const remaining = Math.ceil((otpStore.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  },
};
