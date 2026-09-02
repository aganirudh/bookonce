import { describe, expect, it } from 'vitest';
import type { FlightCandidate } from '@/services/SkyscannerService';
import { attachFlightCandidateIdentity, bindSelectedFlightToItinerary, flightCandidateToExternalIdentity } from '../flightIdentityAdapter';

const candidate: FlightCandidate = { provider: 'rapidapi-skyscanner', carrierCode: 'AI', flightNumber: '202', departureAirportCode: 'BLR', arrivalAirportCode: 'DEL', scheduledDeparture: '2026-10-10T10:00:00Z', scheduledArrival: '2026-10-10T12:00:00Z' };

describe('flight identity adapter', () => {
  it('copies structured operational identity and supported provider provenance', () => {
    expect(flightCandidateToExternalIdentity(candidate)).toEqual({ carrierCode: 'AI', flightNumber: '202', departureAirportCode: 'BLR', arrivalAirportCode: 'DEL', scheduledDeparture: '2026-10-10T10:00:00Z', scheduledArrival: '2026-10-10T12:00:00Z', provider: 'rapidapi-skyscanner' });
  });

  it('attaches identity to a flight segment', () => {
    const segment = { mode: 'flight' as const, from: { name: 'Bengaluru' }, to: { name: 'Delhi' } };
    expect(attachFlightCandidateIdentity(segment, candidate).externalFlightIdentity).toMatchObject({ carrierCode: 'AI', flightNumber: '202' });
  });

  it('does not fabricate identity when required fields are unavailable', () => {
    expect(flightCandidateToExternalIdentity({ ...candidate, carrierCode: '' })).toBeUndefined();
  });

  it('binds a selected provider candidate at the itinerary boundary only to the selected flight', () => {
    const itinerary = { origin: { name: 'Bengaluru' }, destination: { name: 'Delhi' }, summary: 'Trip', segments: [
      { activityId: 'flight-1', mode: 'flight' as const, from: { name: 'BLR' }, to: { name: 'DEL' } },
      { activityId: 'taxi-1', mode: 'taxi' as const, from: { name: 'DEL' }, to: { name: 'Hotel' } },
    ] };
    const bound = bindSelectedFlightToItinerary(itinerary, 'flight-1', candidate);
    expect(bound.segments[0].externalFlightIdentity).toEqual(flightCandidateToExternalIdentity(candidate));
    expect(bound.segments[1].externalFlightIdentity).toBeUndefined();
    expect(itinerary.segments[0]).not.toHaveProperty('externalFlightIdentity');
  });

  it('never attaches provider flight identity to a non-flight segment', () => {
    const segment = { mode: 'walk' as const, from: { name: 'A' }, to: { name: 'B' } };
    expect(attachFlightCandidateIdentity(segment, candidate)).toBe(segment);
  });
});
