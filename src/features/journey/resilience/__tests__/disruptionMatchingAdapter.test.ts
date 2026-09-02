import { describe, expect, it } from 'vitest';
import { journeySegmentToDisruptionMatchingNode } from '../disruptionMatchingAdapter';

describe('journeySegmentToDisruptionMatchingNode', () => {
  it('maps selected flight identity to the existing Phase 21 matching-node shape', () => {
    expect(journeySegmentToDisruptionMatchingNode({ activityId: 'flight-1', mode: 'flight', from: { name: 'JFK' }, to: { name: 'LHR' }, externalFlightIdentity: { carrierCode: 'DL', flightNumber: '5923', departureAirportCode: 'JFK', arrivalAirportCode: 'LHR', scheduledDeparture: '2026-09-15T18:30:00' } })).toEqual({ nodeId: 'flight-1', kind: 'transport', flight: { carrierCode: 'DL', flightNumber: '5923', originCode: 'JFK', destinationCode: 'LHR', scheduledDeparture: '2026-09-15T18:30:00' } });
  });

  it('does not invent identity for AI-only or non-flight segments', () => {
    expect(journeySegmentToDisruptionMatchingNode({ activityId: 'flight-1', mode: 'flight', from: { name: 'JFK' }, to: { name: 'LHR' } })).toEqual({ nodeId: 'flight-1', kind: 'transport' });
    expect(journeySegmentToDisruptionMatchingNode({ activityId: 'walk-1', mode: 'walk', from: { name: 'A' }, to: { name: 'B' } })).toBeUndefined();
  });
});
