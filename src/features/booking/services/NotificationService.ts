/**
 * Notification Service
 * Handles email and push notifications for booking events
 */

import type { BookingConfirmation, NotificationType, Hotel } from '@/types/booking';
import {
  isEmailNotificationEnabled,
  isPushNotificationEnabled,
} from '../utils/notificationPreferences';

/**
 * Email template configuration
 */
interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Notification Service class
 */
export class NotificationService {
  private apiEndpoint: string;

  constructor(apiEndpoint: string = '/api/notifications') {
    this.apiEndpoint = apiEndpoint;
  }

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmation(booking: BookingConfirmation, email: string): Promise<void> {
    // Check if email notifications are enabled for this type
    if (!isEmailNotificationEnabled('booking_confirmation')) {
      console.log('Booking confirmation email notifications are disabled');
      return;
    }

    const template = this.generateBookingConfirmationTemplate(booking);

    try {
      await this.sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      console.log(`Booking confirmation email sent to ${email}`);

      // Send push notification if enabled
      if (isPushNotificationEnabled('booking_confirmation') && booking.guestInfo.email) {
        await this.sendPushNotification(
          booking.guestInfo.email,
          'Booking Confirmed',
          `Your reservation at ${booking.hotel.title} is confirmed!`,
          { bookingId: booking.bookingId, type: 'booking_confirmation' }
        );
      }
    } catch (error) {
      console.error('Failed to send booking confirmation email:', error);
      throw new Error('Failed to send confirmation email');
    }
  }

  /**
   * Send modification confirmation email
   */
  async sendModificationConfirmation(booking: BookingConfirmation, email: string): Promise<void> {
    // Check if email notifications are enabled for this type
    if (!isEmailNotificationEnabled('booking_modification')) {
      console.log('Booking modification email notifications are disabled');
      return;
    }

    const template = this.generateModificationConfirmationTemplate(booking);

    try {
      await this.sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      console.log(`Modification confirmation email sent to ${email}`);

      // Send push notification if enabled
      if (isPushNotificationEnabled('booking_modification') && booking.guestInfo.email) {
        await this.sendPushNotification(
          booking.guestInfo.email,
          'Booking Modified',
          `Your reservation at ${booking.hotel.title} has been updated`,
          { bookingId: booking.bookingId, type: 'booking_modification' }
        );
      }
    } catch (error) {
      console.error('Failed to send modification confirmation email:', error);
      throw new Error('Failed to send modification confirmation email');
    }
  }

  /**
   * Send cancellation confirmation email
   */
  async sendCancellationConfirmation(
    booking: BookingConfirmation,
    refundAmount: number,
    email: string
  ): Promise<void> {
    // Check if email notifications are enabled for this type
    if (!isEmailNotificationEnabled('booking_cancellation')) {
      console.log('Booking cancellation email notifications are disabled');
      return;
    }

    const template = this.generateCancellationConfirmationTemplate(booking, refundAmount);

    try {
      await this.sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      console.log(`Cancellation confirmation email sent to ${email}`);

      // Send push notification if enabled
      if (isPushNotificationEnabled('booking_cancellation') && booking.guestInfo.email) {
        await this.sendPushNotification(
          booking.guestInfo.email,
          'Booking Cancelled',
          `Your reservation at ${booking.hotel.title} has been cancelled`,
          { bookingId: booking.bookingId, type: 'booking_cancellation', refundAmount }
        );
      }
    } catch (error) {
      console.error('Failed to send cancellation confirmation email:', error);
      throw new Error('Failed to send cancellation confirmation email');
    }
  }

  /**
   * Send check-in reminder email (24 hours before)
   */
  async sendCheckInReminder(booking: BookingConfirmation, email: string): Promise<void> {
    // Check if email notifications are enabled for this type
    if (!isEmailNotificationEnabled('check_in_reminder')) {
      console.log('Check-in reminder email notifications are disabled');
      return;
    }

    const template = this.generateCheckInReminderTemplate(booking);

    try {
      await this.sendEmail({
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      console.log(`Check-in reminder email sent to ${email}`);

      // Send push notification if enabled
      if (isPushNotificationEnabled('check_in_reminder') && booking.guestInfo.email) {
        await this.sendPushNotification(
          booking.guestInfo.email,
          'Check-in Tomorrow',
          `Your stay at ${booking.hotel.title} begins tomorrow!`,
          { bookingId: booking.bookingId, type: 'check_in_reminder' }
        );
      }
    } catch (error) {
      console.error('Failed to send check-in reminder email:', error);
      throw new Error('Failed to send check-in reminder email');
    }
  }

  /**
   * Send push notification
   */
  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      // In production, this would integrate with a push notification service
      // like Firebase Cloud Messaging, OneSignal, or similar
      await fetch(`${this.apiEndpoint}/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          title,
          body,
          data,
        }),
      });

      console.log(`Push notification sent to user ${userId}`);
    } catch (error) {
      console.error('Failed to send push notification:', error);
      // Don't throw - push notifications are not critical
    }
  }

  /**
   * Send booking status change notification
   */
  async sendBookingStatusChange(
    booking: BookingConfirmation,
    oldStatus: string,
    newStatus: string,
    email: string
  ): Promise<void> {
    // Check if notifications are enabled for this type
    const emailEnabled = isEmailNotificationEnabled('booking_status_change');
    const pushEnabled = isPushNotificationEnabled('booking_status_change');

    if (!emailEnabled && !pushEnabled) {
      console.log('Booking status change notifications are disabled');
      return;
    }

    const subject = `Booking Status Update - ${booking.hotel.title}`;
    const message = `Your booking status has changed from ${oldStatus} to ${newStatus}`;

    try {
      if (emailEnabled) {
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #2563eb; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Booking Status Update</h1>
              </div>
              <div class="content">
                <p>${message}</p>
                <p><strong>Booking Reference:</strong> ${booking.referenceNumber}</p>
                <p><strong>Hotel:</strong> ${booking.hotel.title}</p>
                <p><strong>Previous Status:</strong> ${oldStatus}</p>
                <p><strong>New Status:</strong> ${newStatus}</p>
              </div>
            </div>
          </body>
          </html>
        `;

        await this.sendEmail({
          to: email,
          subject,
          html,
          text: `${message}\n\nBooking Reference: ${booking.referenceNumber}\nHotel: ${booking.hotel.title}\nPrevious Status: ${oldStatus}\nNew Status: ${newStatus}`,
        });

        console.log(`Booking status change email sent to ${email}`);
      }

      if (pushEnabled && booking.guestInfo.email) {
        await this.sendPushNotification(booking.guestInfo.email, 'Booking Status Update', message, {
          bookingId: booking.bookingId,
          type: 'booking_status_change',
          oldStatus,
          newStatus,
        });
      }
    } catch (error) {
      console.error('Failed to send booking status change notification:', error);
      throw new Error('Failed to send status change notification');
    }
  }

  /**
   * Send hotel cancellation notification with alternatives
   */
  async sendHotelCancellation(
    booking: BookingConfirmation,
    reason: string,
    alternativeHotels: Hotel[],
    email: string
  ): Promise<void> {
    // Check if notifications are enabled for this type
    const emailEnabled = isEmailNotificationEnabled('hotel_cancellation');
    const pushEnabled = isPushNotificationEnabled('hotel_cancellation');

    if (!emailEnabled && !pushEnabled) {
      console.log('Hotel cancellation notifications are disabled');
      return;
    }

    const subject = `URGENT: Hotel Cancellation - ${booking.hotel.title}`;

    try {
      if (emailEnabled) {
        const alternativesHtml =
          alternativeHotels.length > 0
            ? `
            <div style="margin-top: 20px;">
              <h3>Alternative Hotels</h3>
              <p>We've found similar hotels in the area:</p>
              ${alternativeHotels
                .map(
                  hotel => `
                <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 8px;">
                  <h4>${hotel.title}</h4>
                  <p>${hotel.location}</p>
                  <p>Rating: ⭐ ${hotel.rating} (${hotel.reviews} reviews)</p>
                  <p>From $${hotel.price}/night</p>
                </div>
              `
                )
                .join('')}
            </div>
          `
            : '';

        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .alert { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⚠️ Hotel Cancellation</h1>
                <p>Important Update About Your Booking</p>
              </div>
              <div class="content">
                <div class="alert">
                  <strong>We're sorry to inform you that your booking has been cancelled by the hotel.</strong>
                </div>
                <p><strong>Booking Reference:</strong> ${booking.referenceNumber}</p>
                <p><strong>Hotel:</strong> ${booking.hotel.title}</p>
                <p><strong>Reason:</strong> ${reason}</p>
                <p><strong>Refund:</strong> Full refund of ${booking.pricing.total.toFixed(2)} ${booking.pricing.currency} will be processed within 5-7 business days.</p>
                ${alternativesHtml}
                <p style="margin-top: 20px;">Our support team will contact you shortly to assist with rebooking. You can also reach us at support@vagabond.ai</p>
              </div>
            </div>
          </body>
          </html>
        `;

        const alternativesText =
          alternativeHotels.length > 0
            ? `\n\nAlternative Hotels:\n${alternativeHotels.map(h => `- ${h.title} (${h.location}) - $${h.price}/night - Rating: ${h.rating}`).join('\n')}`
            : '';

        await this.sendEmail({
          to: email,
          subject,
          html,
          text: `URGENT: Hotel Cancellation\n\nWe're sorry to inform you that your booking has been cancelled by the hotel.\n\nBooking Reference: ${booking.referenceNumber}\nHotel: ${booking.hotel.title}\nReason: ${reason}\nRefund: Full refund of ${booking.pricing.total.toFixed(2)} ${booking.pricing.currency}${alternativesText}`,
        });

        console.log(`Hotel cancellation email sent to ${email}`);
      }

      if (pushEnabled && booking.guestInfo.email) {
        await this.sendPushNotification(
          booking.guestInfo.email,
          'URGENT: Hotel Cancellation',
          `Your booking at ${booking.hotel.title} has been cancelled by the hotel. Full refund will be processed.`,
          { bookingId: booking.bookingId, type: 'hotel_cancellation', reason }
        );
      }
    } catch (error) {
      console.error('Failed to send hotel cancellation notification:', error);
      throw new Error('Failed to send hotel cancellation notification');
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Send email via API
   */
  private async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    // In production, this would call a backend API that integrates with
    // SendGrid, AWS SES, or similar email service
    // For now, we'll simulate the API call

    const response = await fetch(`${this.apiEndpoint}/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Email API returned ${response.status}`);
    }

    // Simulate delay for email sending
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Generate booking confirmation email template
   */
  private generateBookingConfirmationTemplate(booking: BookingConfirmation): EmailTemplate {
    const checkInDate = new Date(booking.checkInDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const checkOutDate = new Date(booking.checkOutDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const subject = `Booking Confirmed - ${booking.hotel.title} - ${booking.referenceNumber}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .section { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .label { font-weight: bold; color: #6b7280; margin-top: 10px; }
          .value { margin-top: 5px; }
          .total { font-size: 24px; font-weight: bold; color: #2563eb; margin-top: 15px; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Booking Confirmed!</h1>
            <p>Your reservation has been successfully confirmed</p>
          </div>
          <div class="content">
            <div class="section">
              <div class="label">Booking Reference</div>
              <div class="value" style="font-size: 20px; font-weight: bold; color: #2563eb;">${booking.referenceNumber}</div>
            </div>
            
            <div class="section">
              <h2 style="margin-top: 0;">Hotel Information</h2>
              <div class="label">Hotel Name</div>
              <div class="value">${booking.hotel.title}</div>
              <div class="label">Location</div>
              <div class="value">${booking.hotel.location}</div>
              <div class="label">Rating</div>
              <div class="value">⭐ ${booking.hotel.rating} (${booking.hotel.reviews} reviews)</div>
            </div>
            
            <div class="section">
              <h2 style="margin-top: 0;">Stay Details</h2>
              <div class="label">Check-in</div>
              <div class="value">${checkInDate} at ${booking.hotel.checkInTime || '3:00 PM'}</div>
              <div class="label">Check-out</div>
              <div class="value">${checkOutDate} at ${booking.hotel.checkOutTime || '11:00 AM'}</div>
              <div class="label">Number of Nights</div>
              <div class="value">${booking.pricing.numberOfNights}</div>
            </div>
            
            <div class="section">
              <h2 style="margin-top: 0;">Room Details</h2>
              <div class="label">Room Type</div>
              <div class="value">${booking.roomDetails.name}</div>
              <div class="value">${booking.roomDetails.description}</div>
              <div class="label">Capacity</div>
              <div class="value">${booking.roomDetails.capacity} ${booking.roomDetails.capacity === 1 ? 'guest' : 'guests'}</div>
            </div>
            
            <div class="section">
              <h2 style="margin-top: 0;">Guest Information</h2>
              <div class="label">Name</div>
              <div class="value">${booking.guestInfo.firstName} ${booking.guestInfo.lastName}</div>
              <div class="label">Email</div>
              <div class="value">${booking.guestInfo.email}</div>
              <div class="label">Phone</div>
              <div class="value">${booking.guestInfo.phone}</div>
            </div>
            
            <div class="section">
              <h2 style="margin-top: 0;">Pricing Summary</h2>
              <div class="label">Subtotal</div>
              <div class="value">$${booking.pricing.subtotal.toFixed(2)}</div>
              ${booking.pricing.taxes
                .map(
                  tax => `
                <div class="label">${tax.name}</div>
                <div class="value">$${tax.amount.toFixed(2)}</div>
              `
                )
                .join('')}
              ${booking.pricing.fees
                .map(
                  fee => `
                <div class="label">${fee.name}</div>
                <div class="value">$${fee.amount.toFixed(2)}</div>
              `
                )
                .join('')}
              <hr style="margin: 15px 0; border: none; border-top: 2px solid #e5e7eb;">
              <div class="total">Total: $${booking.pricing.total.toFixed(2)} ${booking.pricing.currency}</div>
            </div>
            
            <div style="text-align: center;">
              <a href="${window.location.origin}/booking-confirmation/${booking.bookingId}" class="button">
                View Booking Details
              </a>
            </div>
            
            <div class="footer">
              <p>Thank you for booking with Vagabond AI Navigator!</p>
              <p>If you have any questions, please contact us at support@vagabond.ai</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Booking Confirmed!

Booking Reference: ${booking.referenceNumber}

Hotel Information:
${booking.hotel.title}
${booking.hotel.location}
Rating: ${booking.hotel.rating} (${booking.hotel.reviews} reviews)

Stay Details:
Check-in: ${checkInDate} at ${booking.hotel.checkInTime || '3:00 PM'}
Check-out: ${checkOutDate} at ${booking.hotel.checkOutTime || '11:00 AM'}
Number of Nights: ${booking.pricing.numberOfNights}

Room Details:
${booking.roomDetails.name}
${booking.roomDetails.description}
Capacity: ${booking.roomDetails.capacity} ${booking.roomDetails.capacity === 1 ? 'guest' : 'guests'}

Guest Information:
Name: ${booking.guestInfo.firstName} ${booking.guestInfo.lastName}
Email: ${booking.guestInfo.email}
Phone: ${booking.guestInfo.phone}

Pricing Summary:
Subtotal: $${booking.pricing.subtotal.toFixed(2)}
${booking.pricing.taxes.map(tax => `${tax.name}: $${tax.amount.toFixed(2)}`).join('\n')}
${booking.pricing.fees.map(fee => `${fee.name}: $${fee.amount.toFixed(2)}`).join('\n')}
Total: $${booking.pricing.total.toFixed(2)} ${booking.pricing.currency}

View your booking details: ${window.location.origin}/booking-confirmation/${booking.bookingId}

Thank you for booking with Vagabond AI Navigator!
    `;

    return { subject, html, text };
  }

  /**
   * Generate modification confirmation email template
   */
  private generateModificationConfirmationTemplate(booking: BookingConfirmation): EmailTemplate {
    const subject = `Booking Modified - ${booking.hotel.title} - ${booking.referenceNumber}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .section { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Modified</h1>
            <p>Your reservation has been successfully updated</p>
          </div>
          <div class="content">
            <p>Your booking for ${booking.hotel.title} has been modified.</p>
            <p>Booking Reference: <strong>${booking.referenceNumber}</strong></p>
            <p>Please review your updated booking details in your account.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Booking Modified\n\nYour reservation has been successfully updated.\n\nBooking Reference: ${booking.referenceNumber}\nHotel: ${booking.hotel.title}`;

    return { subject, html, text };
  }

  /**
   * Generate cancellation confirmation email template
   */
  private generateCancellationConfirmationTemplate(
    booking: BookingConfirmation,
    refundAmount: number
  ): EmailTemplate {
    const subject = `Booking Cancelled - ${booking.hotel.title} - ${booking.referenceNumber}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .section { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Cancelled</h1>
            <p>Your reservation has been cancelled</p>
          </div>
          <div class="content">
            <p>Your booking for ${booking.hotel.title} has been cancelled.</p>
            <p>Booking Reference: <strong>${booking.referenceNumber}</strong></p>
            <p>Refund Amount: <strong>$${refundAmount.toFixed(2)} ${booking.pricing.currency}</strong></p>
            <p>The refund will be processed within 5-7 business days.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Booking Cancelled\n\nYour reservation has been cancelled.\n\nBooking Reference: ${booking.referenceNumber}\nHotel: ${booking.hotel.title}\nRefund Amount: $${refundAmount.toFixed(2)} ${booking.pricing.currency}`;

    return { subject, html, text };
  }

  /**
   * Generate check-in reminder email template
   */
  private generateCheckInReminderTemplate(booking: BookingConfirmation): EmailTemplate {
    const checkInDate = new Date(booking.checkInDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const subject = `Check-in Reminder - ${booking.hotel.title} - Tomorrow`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .section { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Check-in Reminder</h1>
            <p>Your stay begins tomorrow!</p>
          </div>
          <div class="content">
            <p>This is a friendly reminder that your check-in at ${booking.hotel.title} is tomorrow.</p>
            <div class="section">
              <p><strong>Check-in:</strong> ${checkInDate} at ${booking.hotel.checkInTime || '3:00 PM'}</p>
              <p><strong>Booking Reference:</strong> ${booking.referenceNumber}</p>
              <p><strong>Location:</strong> ${booking.hotel.location}</p>
            </div>
            <p>We hope you have a wonderful stay!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Check-in Reminder\n\nYour stay begins tomorrow!\n\nCheck-in: ${checkInDate} at ${booking.hotel.checkInTime || '3:00 PM'}\nBooking Reference: ${booking.referenceNumber}\nHotel: ${booking.hotel.title}\nLocation: ${booking.hotel.location}`;

    return { subject, html, text };
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

export default notificationService;
