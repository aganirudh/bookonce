import emailjs from '@emailjs/browser';

// Initialize EmailJS
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';

if (EMAILJS_PUBLIC_KEY) {
  emailjs.init(EMAILJS_PUBLIC_KEY);
}

export const emailJSService = {
  /**
   * Send OTP via email using EmailJS
   */
  async sendOTP(email: string, otp: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID) {
        console.warn('EmailJS not configured. Check environment variables.');
        return {
          success: false,
          message: 'Email service not configured',
        };
      }

      const templateParams = {
        to_email: email,
        otp_code: otp,
        subject: 'Your BookOnce OTP Code',
      };

      const response = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);

      if (response.status === 200) {
        console.log(`✅ OTP sent to ${email}`);
        return {
          success: true,
          message: `OTP sent to ${email}. Check your inbox!`,
        };
      }

      return {
        success: false,
        message: 'Failed to send OTP',
      };
    } catch (error: any) {
      console.error('EmailJS error:', error);
      return {
        success: false,
        message: error.message || 'Failed to send OTP',
      };
    }
  },

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(
    email: string,
    firstName: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID) {
        return {
          success: false,
          message: 'Email service not configured',
        };
      }

      const templateParams = {
        to_email: email,
        user_name: firstName,
        subject: 'Welcome to BookOnce!',
      };

      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        'welcome_template', // You'll need to create this template
        templateParams
      );

      if (response.status === 200) {
        console.log(`✅ Welcome email sent to ${email}`);
        return {
          success: true,
          message: 'Welcome email sent!',
        };
      }

      return {
        success: false,
        message: 'Failed to send welcome email',
      };
    } catch (error: any) {
      console.error('EmailJS error:', error);
      return {
        success: false,
        message: error.message || 'Failed to send email',
      };
    }
  },

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    resetLink: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID) {
        return {
          success: false,
          message: 'Email service not configured',
        };
      }

      const templateParams = {
        to_email: email,
        reset_link: resetLink,
        subject: 'Reset Your BookOnce Password',
      };

      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        'password_reset_template', // You'll need to create this template
        templateParams
      );

      if (response.status === 200) {
        console.log(`✅ Password reset email sent to ${email}`);
        return {
          success: true,
          message: 'Password reset email sent!',
        };
      }

      return {
        success: false,
        message: 'Failed to send password reset email',
      };
    } catch (error: any) {
      console.error('EmailJS error:', error);
      return {
        success: false,
        message: error.message || 'Failed to send email',
      };
    }
  },
};
