import { describe, expect, it } from 'vitest';
import { applyRecoveryCandidate, recoveryFingerprint, type RecoveryApplicationState } from '../recoveryApplication';
import type { RecoveryCandidate } from '../recoveryTypes';

const explanation = { reasonCodes: ['preserves-unaffected' as const, 'minimal-node-change' as const], preservedNodeCount: 1, changedNodeIds: ['transfer'], unresolvedViolationCount: 0 };
const routeCandidate: RecoveryCandidate = {
  id: 'transfer:replace_transport_route:alternate', score: 0, changedNodeIds: ['transfer'], unresolvedViolations: [], explanation,
  action: { type: 'replace_transport_route', nodeId: 'transfer', replacementRouteId: 'alternate' },
};
const shiftCandidate: RecoveryCandidate = {
  id: 'museum:shift_flexible_activity:13:00:14:00', score: 0, changedNodeIds: ['museum'], unresolvedViolations: [],
  explanation: { ...explanation, changedNodeIds: ['museum'] },
  action: { type: 'shift_flexible_activity', nodeId: 'museum', newStartTime: '13:00', newEndTime: '14:00' },
};

function state(): RecoveryApplicationState {
  return { selectedRouteIds: { 0: 'current' }, itinerary: {
    origin: { name: 'Airport' }, destination: { name: 'City' }, summary: 'Trip',
    segments: [
      { activityId: 'transfer', mode: 'car', from: { name: 'Airport' }, to: { name: 'Hotel' }, flexibility: 'flexible', departureTime: '11:00', arrivalTime: '12:00', routeDuration: 3600, routeDistance: 10000, selectedRouteCandidateId: 'current', routingStatus: 'routed', routeGeometry: [[1, 1]], routingAlternatives: [
        { id: 'current', label: 'Current', mode: 'drive', duration: 3600, distance: 10000, geometry: [[1, 1]], rank: 1, score: 0, qualityScore: 100, explanation: { dominantPreference: 'time', advantages: [], tradeOffs: [] } },
        { id: 'alternate', label: 'Alternate', mode: 'drive', duration: 1800, distance: 9000, estimatedCost: 250, geometry: [[2, 2]], rank: 2, score: 0.2, qualityScore: 80, explanation: { dominantPreference: 'time', advantages: ['Shorter'], tradeOffs: [] } },
      ] },
      { activityId: 'museum', activityCategory: 'indoor', mode: 'walk', from: { name: 'Hotel' }, to: { name: 'Museum' }, flexibility: 'flexible', departureTime: '12:00', arrivalTime: '13:00', instructions: 'Museum' },
      { activityId: 'dinner', activityCategory: 'indoor', mode: 'walk', from: { name: 'Hotel' }, to: { name: 'Dinner' }, flexibility: 'fixed', departureTime: '18:00', arrivalTime: '19:00', instructions: 'Dinner' },
    ],
  } };
}

describe('recovery application boundary', () => {
  it('uses a deterministic fingerprint and rejects stale plans atomically', () => {
    const original = state(); const fingerprint = recoveryFingerprint(original, 'delay-180');
    expect(recoveryFingerprint(state(), 'delay-180')).toBe(fingerprint);
    const changed = { ...original, selectedRouteIds: { 0: 'another' } };
    expect(applyRecoveryCandidate(changed, routeCandidate, 'delay-180', fingerprint)).toEqual({ applied: false, reason: 'stale-plan' });
    expect(changed.itinerary).toEqual(original.itinerary);
  });

  it('applies a loaded route without mutating provider data or unaffected segments', () => {
    const original = state(); const providerRoute = original.itinerary.segments[0].routingAlternatives![1];
    const result = applyRecoveryCandidate(original, routeCandidate, 'delay-180', recoveryFingerprint(original, 'delay-180'));
    expect(result.applied).toBe(true);
    if (!result.applied) return;
    expect(result.state.itinerary.segments[0]).toMatchObject({ selectedRouteCandidateId: 'alternate', routeDuration: 1800, routeDistance: 9000, routeGeometry: [[2, 2]], estimatedCost: 250 });
    expect(result.state.itinerary.segments[1]).toBe(original.itinerary.segments[1]);
    expect(result.state.itinerary.segments[2]).toBe(original.itinerary.segments[2]);
    expect(providerRoute.geometry).toEqual([[2, 2]]);
    expect(result.state.itinerary.segments[0].routeGeometry).not.toBe(providerRoute.geometry);
  });

  it('shifts only a flexible activity and never a fixed one', () => {
    const original = state();
    const result = applyRecoveryCandidate(original, shiftCandidate, 'delay', recoveryFingerprint(original, 'delay'));
    expect(result.applied).toBe(true);
    if (!result.applied) return;
    expect(result.state.itinerary.segments[1]).toMatchObject({ departureTime: '13:00', arrivalTime: '14:00' });
    expect(result.state.itinerary.segments[0]).toBe(original.itinerary.segments[0]);
    expect(result.state.itinerary.segments[2]).toBe(original.itinerary.segments[2]);
    const fixed = { ...shiftCandidate, action: { ...shiftCandidate.action, nodeId: 'dinner' } } as RecoveryCandidate;
    expect(applyRecoveryCandidate(original, fixed, 'delay', recoveryFingerprint(original, 'delay'))).toEqual({ applied: false, reason: 'fixed-activity' });
  });
});
