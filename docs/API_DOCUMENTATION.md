# Booking API Documentation

## Overview

This document describes the booking API endpoints and their usage in the Vagabond hotel booking application.

## Base URL

```
Development: http://localhost:5173/api
Production: https://api.vagabond.com
```

## Authentication

All authenticated endpoints require a valid user session. The application uses session-based authentication with JWT tokens.

### Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

## Endpoints

### 1. Hotel Availability

#### Check Room Availability

```http
GET /api/hotels/:hotelId/availability
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| checkIn | string | Yes | Check-in date (ISO 8601) |
| checkOut | string | Yes | Check-out date (ISO 8601) |
| guests | number | Yes | Number of guests |
| roomType | string | No | Specific room type |

**Response:**

```json
{
  "available": true,
  "rooms": [
    {
      "type": "deluxe",
      "available": 5,
      "pricePerNight": 150,
      "amenities": ["WiFi", "TV", "Mini Bar"]
    }
  ],
  "totalPrice": 750
}
```

### 2. Create Booking

#### Start New Booking

```http
POST /api/bookings
```

**Request Body:**

```json
{
  "hotelId": "hotel-123",
  "checkIn": "2024-12-20T15:00:00Z",
  "checkOut": "2024-12-25T11:00:00Z",
  "guests": 2,
  "roomType": "deluxe",
  "guestInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  }
}
```

**Response:**

```json
{
  "bookingId": "booking-456",
  "status": "pending",
  "totalPrice": 750,
  "createdAt": "2024-12-01T10:00:00Z"
}
```

### 3. Complete Booking

#### Process Payment and Confirm

```http
POST /api/bookings/:bookingId/complete
```

**Request Body:**

```json
{
  "paymentMethod": "card",
  "paymentDetails": {
    "token": "tok_visa",
    "saveCard": true
  }
}
```

**Response:**

```json
{
  "bookingId": "booking-456",
  "status": "confirmed",
  "confirmationNumber": "CONF-789",
  "receipt": {
    "subtotal": 750,
    "taxes": 75,
    "total": 825
  }
}
```

### 4. Get Booking History

#### Retrieve User Bookings

```http
GET /api/bookings
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by status (confirmed, cancelled, completed) |
| limit | number | No | Number of results (default: 10) |
| offset | number | No | Pagination offset |

**Response:**

```json
{
  "bookings": [
    {
      "id": "booking-456",
      "hotelId": "hotel-123",
      "hotelName": "Grand Hotel",
      "checkIn": "2024-12-20T15:00:00Z",
      "checkOut": "2024-12-25T11:00:00Z",
      "status": "confirmed",
      "totalPrice": 825
    }
  ],
  "total": 15,
  "hasMore": true
}
```

### 5. Modify Booking

#### Update Booking Details

```http
PATCH /api/bookings/:bookingId
```

**Request Body:**

```json
{
  "checkIn": "2024-12-21T15:00:00Z",
  "checkOut": "2024-12-26T11:00:00Z",
  "guests": 3
}
```

**Response:**

```json
{
  "bookingId": "booking-456",
  "status": "confirmed",
  "changes": {
    "priceDifference": 150,
    "refundAmount": 0
  },
  "newTotalPrice": 975
}
```

### 6. Cancel Booking

#### Cancel Existing Booking

```http
DELETE /api/bookings/:bookingId
```

**Request Body:**

```json
{
  "reason": "Change of plans",
  "requestRefund": true
}
```

**Response:**

```json
{
  "bookingId": "booking-456",
  "status": "cancelled",
  "refund": {
    "amount": 825,
    "method": "original_payment",
    "estimatedDays": 5
  }
}
```

### 7. Get Booking Details

#### Retrieve Single Booking

```http
GET /api/bookings/:bookingId
```

**Response:**

```json
{
  "id": "booking-456",
  "hotelId": "hotel-123",
  "hotelName": "Grand Hotel",
  "checkIn": "2024-12-20T15:00:00Z",
  "checkOut": "2024-12-25T11:00:00Z",
  "guests": 2,
  "roomType": "deluxe",
  "status": "confirmed",
  "totalPrice": 825,
  "guestInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  },
  "confirmationNumber": "CONF-789"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "error": "INVALID_REQUEST",
  "message": "Invalid date format",
  "details": {
    "field": "checkIn",
    "value": "invalid-date"
  }
}
```

### 401 Unauthorized

```json
{
  "error": "UNAUTHORIZED",
  "message": "Authentication required"
}
```

### 404 Not Found

```json
{
  "error": "NOT_FOUND",
  "message": "Booking not found"
}
```

### 409 Conflict

```json
{
  "error": "BOOKING_CONFLICT",
  "message": "Room not available for selected dates"
}
```

### 500 Internal Server Error

```json
{
  "error": "INTERNAL_ERROR",
  "message": "An unexpected error occurred"
}
```

## Rate Limiting

API requests are rate-limited to:
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1638360000
```

## Webhooks

The booking system supports webhooks for real-time notifications:

### Events

- `booking.created` - New booking created
- `booking.confirmed` - Booking confirmed
- `booking.modified` - Booking details changed
- `booking.cancelled` - Booking cancelled
- `payment.completed` - Payment processed

### Webhook Payload

```json
{
  "event": "booking.confirmed",
  "timestamp": "2024-12-01T10:00:00Z",
  "data": {
    "bookingId": "booking-456",
    "status": "confirmed"
  }
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { BookingAPIService } from '@/features/booking/services/BookingAPIService';

const bookingService = new BookingAPIService();

// Check availability
const availability = await bookingService.checkAvailability({
  hotelId: 'hotel-123',
  checkIn: new Date('2024-12-20'),
  checkOut: new Date('2024-12-25'),
  guests: 2,
});

// Create booking
const booking = await bookingService.createBooking({
  hotelId: 'hotel-123',
  checkIn: new Date('2024-12-20'),
  checkOut: new Date('2024-12-25'),
  guests: 2,
  roomType: 'deluxe',
  guestInfo: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890',
  },
});
```

## Testing

Use the mock adapter for testing:

```typescript
import { MockBookingAdapter } from '@/features/booking/services/adapters/MockBookingAdapter';

const mockAdapter = new MockBookingAdapter();
const availability = await mockAdapter.checkAvailability({
  hotelId: 'hotel-123',
  checkIn: new Date('2024-12-20'),
  checkOut: new Date('2024-12-25'),
  guests: 2,
});
```

## Support

For API support, contact: api-support@vagabond.com
