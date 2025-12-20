/**
 * Confirmation Actions Utilities
 * Helper functions for booking confirmation actions
 */

import { createEvent, EventAttributes } from 'ics';
import type { BookingConfirmation } from '@/types/booking';

/**
 * Generate PDF confirmation (simplified version)
 * In production, this would use a proper PDF library like jsPDF or pdfmake
 */
export function downloadPDFConfirmation(booking: BookingConfirmation): void {
  // Create a simple HTML representation
  const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Booking Confirmation - ${booking.referenceNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
        h1 { color: #2563eb; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; }
        .label { font-weight: bold; color: #6b7280; }
        .value { margin-top: 5px; }
        .total { font-size: 24px; font-weight: bold; color: #2563eb; }
      </style>
    </head>
    <body>
      <h1>Booking Confirmation</h1>
      <div class="section">
        <div class="label">Booking Reference</div>
        <div class="value" style="font-size: 20px; font-weight: bold;">${booking.referenceNumber}</div>
      </div>
      
      <div class="section">
        <h2>Hotel Information</h2>
        <div class="label">Hotel Name</div>
        <div class="value">${booking.hotel.title}</div>
        <div class="label">Location</div>
        <div class="value">${booking.hotel.location}</div>
      </div>
      
      <div class="section">
        <h2>Stay Details</h2>
        <div class="label">Check-in</div>
        <div class="value">${new Date(booking.checkInDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })} at ${booking.hotel.checkInTime || '3:00 PM'}</div>
        <div class="label">Check-out</div>
        <div class="value">${new Date(booking.checkOutDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })} at ${booking.hotel.checkOutTime || '11:00 AM'}</div>
        <div class="label">Number of Nights</div>
        <div class="value">${booking.pricing.numberOfNights}</div>
      </div>
      
      <div class="section">
        <h2>Room Details</h2>
        <div class="label">Room Type</div>
        <div class="value">${booking.roomDetails.name}</div>
        <div class="value">${booking.roomDetails.description}</div>
      </div>
      
      <div class="section">
        <h2>Guest Information</h2>
        <div class="label">Name</div>
        <div class="value">${booking.guestInfo.firstName} ${booking.guestInfo.lastName}</div>
        <div class="label">Email</div>
        <div class="value">${booking.guestInfo.email}</div>
        <div class="label">Phone</div>
        <div class="value">${booking.guestInfo.phone}</div>
      </div>
      
      <div class="section">
        <h2>Pricing Summary</h2>
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
        <hr style="margin: 15px 0;">
        <div class="label">Total</div>
        <div class="total">$${booking.pricing.total.toFixed(2)} ${booking.pricing.currency}</div>
      </div>
    </body>
    </html>
  `;

  // Create a blob and download
  const blob = new Blob([content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `booking-confirmation-${booking.referenceNumber}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate iCal event for calendar integration
 */
export function addToCalendar(booking: BookingConfirmation): void {
  const checkInDate = new Date(booking.checkInDate);
  const checkOutDate = new Date(booking.checkOutDate);

  // Parse check-in time
  const checkInTime = booking.hotel.checkInTime || '15:00';
  const [checkInHour, checkInMinute] = checkInTime.split(':').map(Number);
  checkInDate.setHours(checkInHour, checkInMinute, 0);

  // Parse check-out time
  const checkOutTime = booking.hotel.checkOutTime || '11:00';
  const [checkOutHour, checkOutMinute] = checkOutTime.split(':').map(Number);
  checkOutDate.setHours(checkOutHour, checkOutMinute, 0);

  const event: EventAttributes = {
    start: [
      checkInDate.getFullYear(),
      checkInDate.getMonth() + 1,
      checkInDate.getDate(),
      checkInDate.getHours(),
      checkInDate.getMinutes(),
    ],
    end: [
      checkOutDate.getFullYear(),
      checkOutDate.getMonth() + 1,
      checkOutDate.getDate(),
      checkOutDate.getHours(),
      checkOutDate.getMinutes(),
    ],
    title: `Hotel Stay: ${booking.hotel.title}`,
    description: `Booking Reference: ${booking.referenceNumber}\nRoom: ${booking.roomDetails.name}\nGuest: ${booking.guestInfo.firstName} ${booking.guestInfo.lastName}`,
    location: booking.hotel.location,
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
    organizer: { name: 'Vagabond AI Navigator', email: 'bookings@vagabond.ai' },
    attendees: [
      {
        name: `${booking.guestInfo.firstName} ${booking.guestInfo.lastName}`,
        email: booking.guestInfo.email,
        rsvp: true,
        partstat: 'ACCEPTED',
        role: 'REQ-PARTICIPANT',
      },
    ],
  };

  createEvent(event, (error, value) => {
    if (error) {
      console.error('Error creating calendar event:', error);
      return;
    }

    // Download the .ics file
    const blob = new Blob([value], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `booking-${booking.referenceNumber}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
}

/**
 * Generate Google Calendar URL
 */
export function addToGoogleCalendar(booking: BookingConfirmation): void {
  const checkInDate = new Date(booking.checkInDate);
  const checkOutDate = new Date(booking.checkOutDate);

  // Parse times
  const checkInTime = booking.hotel.checkInTime || '15:00';
  const [checkInHour, checkInMinute] = checkInTime.split(':').map(Number);
  checkInDate.setHours(checkInHour, checkInMinute, 0);

  const checkOutTime = booking.hotel.checkOutTime || '11:00';
  const [checkOutHour, checkOutMinute] = checkOutTime.split(':').map(Number);
  checkOutDate.setHours(checkOutHour, checkOutMinute, 0);

  // Format dates for Google Calendar (YYYYMMDDTHHmmss)
  const formatGoogleDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startDate = formatGoogleDate(checkInDate);
  const endDate = formatGoogleDate(checkOutDate);

  const title = encodeURIComponent(`Hotel Stay: ${booking.hotel.title}`);
  const details = encodeURIComponent(
    `Booking Reference: ${booking.referenceNumber}\nRoom: ${booking.roomDetails.name}\nGuest: ${booking.guestInfo.firstName} ${booking.guestInfo.lastName}`
  );
  const location = encodeURIComponent(booking.hotel.location);

  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}`;

  window.open(googleCalendarUrl, '_blank');
}

/**
 * Share booking via Web Share API or fallback to copy
 */
export async function shareBooking(booking: BookingConfirmation): Promise<void> {
  const shareData = {
    title: `Booking Confirmation - ${booking.hotel.title}`,
    text: `I've booked a stay at ${booking.hotel.title} from ${new Date(
      booking.checkInDate
    ).toLocaleDateString()} to ${new Date(booking.checkOutDate).toLocaleDateString()}. Booking Reference: ${
      booking.referenceNumber
    }`,
    url: window.location.href,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(
        `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`
      );
      alert('Booking details copied to clipboard!');
    }
  } catch (error) {
    console.error('Error sharing booking:', error);
  }
}

/**
 * Get directions URL (Google Maps)
 */
export function getDirectionsUrl(booking: BookingConfirmation): string {
  const location = encodeURIComponent(booking.hotel.location);
  return `https://www.google.com/maps/search/?api=1&query=${location}`;
}
