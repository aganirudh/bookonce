import { describe, expect, it } from 'vitest';
import { ItinerarySchema, JourneySegmentSchema, LocationSchema } from '../aiSchemas';

const origin = { name: 'Bengaluru', latitude: 12.9716, longitude: 77.5946 };
const destination = { name: 'Mysuru' };
const segment = { mode: 'train', from: origin, to: destination, duration: 150 };

describe('AI journey schemas', () => {
  it('accepts a valid Location', () => expect(LocationSchema.safeParse(origin).success).toBe(true));
  it('rejects an invalid Location', () =>
    expect(LocationSchema.safeParse({ name: '', latitude: 100 }).success).toBe(false));
  it('accepts a valid JourneySegment', () =>
    expect(JourneySegmentSchema.safeParse(segment).success).toBe(true));
  it('rejects an invalid JourneySegment', () =>
    expect(JourneySegmentSchema.safeParse({ ...segment, mode: 'teleport' }).success).toBe(false));

  it('accepts structured external flight identity without requiring it for other modes', () => {
    expect(JourneySegmentSchema.safeParse({ ...segment, mode: 'flight', externalFlightIdentity: { carrierCode: 'AI', flightNumber: '202', departureAirportCode: 'BLR', arrivalAirportCode: 'DEL', scheduledDeparture: '2026-10-10T10:00:00Z' } }).success).toBe(true);
    expect(JourneySegmentSchema.safeParse(segment).success).toBe(true);
  });
  it('accepts a valid Itinerary', () =>
    expect(ItinerarySchema.safeParse({ origin, destination, segments: [segment], summary: 'A proposed train journey.' }).success).toBe(true));
  it('rejects an invalid Itinerary', () =>
    expect(ItinerarySchema.safeParse({ origin, destination, segments: [], summary: '' }).success).toBe(false));
});
