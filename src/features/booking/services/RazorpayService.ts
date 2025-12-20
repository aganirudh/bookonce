/**
 * Razorpay Payment Service
 * Handles all Razorpay payment operations
 */

import type { BookingConfirmation } from '@/types/booking';

// Razorpay types
interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    prefill: {
        name: string;
        email: string;
        contact: string;
    };
    theme: {
        color: string;
    };
    handler: (response: RazorpaySuccessResponse) => void;
    modal: {
        ondismiss: () => void;
    };
}

interface RazorpaySuccessResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

// Extend Window interface to include Razorpay
declare global {
    interface Window {
        Razorpay: new (options: RazorpayOptions) => {
            open: () => void;
            close: () => void;
        };
    }
}

export class RazorpayService {
    private keyId: string;
    private isScriptLoaded: boolean = false;

    constructor() {
        this.keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || '';
        if (!this.keyId) {
            console.warn('Razorpay Key ID not found in environment variables');
        }
    }

    /**
     * Load Razorpay script dynamically
     */
    private loadRazorpayScript(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.isScriptLoaded || window.Razorpay) {
                this.isScriptLoaded = true;
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onload = () => {
                this.isScriptLoaded = true;
                resolve();
            };
            script.onerror = () => {
                reject(new Error('Failed to load Razorpay SDK'));
            };
            document.body.appendChild(script);
        });
    }

    /**
     * Create Razorpay order
     */
    async createOrder(amount: number, currency: string = 'INR'): Promise<{ orderId: string; amount: number }> {
        try {
            // In production, this should call your backend API
            // For now, we'll simulate creating an order
            const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;

            console.log('Creating Razorpay order:', { amount, currency });

            return {
                orderId,
                amount: amount * 100, // Convert to paise
            };
        } catch (error) {
            console.error('Error creating Razorpay order:', error);
            throw new Error('Failed to create payment order');
        }
    }

    /**
     * Open Razorpay checkout
     */
    async openCheckout(
        amount: number,
        guestInfo: {
            firstName: string;
            lastName: string;
            email: string;
            phone: string;
        },
        hotelName: string,
        onSuccess: (paymentId: string, orderId: string, signature: string) => void,
        onDismiss?: () => void
    ): Promise<void> {
        try {
            // Load Razorpay script
            await this.loadRazorpayScript();

            // Create order
            const { orderId, amount: orderAmount } = await this.createOrder(amount);

            // Configure Razorpay options
            const options: RazorpayOptions = {
                key: this.keyId,
                amount: orderAmount,
                currency: 'INR',
                name: 'BookOnce',
                description: `Booking for ${hotelName}`,
                order_id: orderId,
                prefill: {
                    name: `${guestInfo.firstName} ${guestInfo.lastName}`,
                    email: guestInfo.email,
                    contact: guestInfo.phone,
                },
                theme: {
                    color: '#3b82f6', // Blue color matching your theme
                },
                handler: (response: RazorpaySuccessResponse) => {
                    console.log('Payment successful:', response);
                    onSuccess(
                        response.razorpay_payment_id,
                        response.razorpay_order_id,
                        response.razorpay_signature
                    );
                },
                modal: {
                    ondismiss: () => {
                        console.log('Payment cancelled by user');
                        if (onDismiss) {
                            onDismiss();
                        }
                    },
                },
            };

            // Open Razorpay checkout
            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (error) {
            console.error('Error opening Razorpay checkout:', error);
            throw error;
        }
    }

    /**
     * Verify payment signature (should be done on backend)
     */
    async verifyPayment(
        orderId: string,
        paymentId: string,
        signature: string
    ): Promise<boolean> {
        try {
            // In production, this should call your backend API to verify the signature
            // For now, we'll just return true
            console.log('Verifying payment:', { orderId, paymentId, signature });

            // TODO: Implement backend verification
            // const response = await fetch('/api/verify-payment', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify({ orderId, paymentId, signature }),
            // });
            // return response.ok;

            return true;
        } catch (error) {
            console.error('Error verifying payment:', error);
            return false;
        }
    }
}

// Export singleton instance
export const razorpayService = new RazorpayService();
