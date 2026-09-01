import type { Itinerary, JourneySegment } from '../schemas/aiSchemas';
import type { RecoveryCandidate } from './recoveryTypes';
import { itineraryFingerprint, type JourneyFingerprintState } from './journeyFingerprint';

export type RecoveryApplicationState = JourneyFingerprintState;

export type RecoveryApplicationResult =
  | { applied: true; state: RecoveryApplicationState }
  | { applied: false; reason: 'stale-plan' | 'target-not-found' | 'unsupported-action' | 'route-not-found' | 'fixed-activity' };

export function recoveryFingerprint(state: RecoveryApplicationState, _disruptionId?: string): string {
  return itineraryFingerprint(state);
}

export function applyRecoveryCandidate(
  current: RecoveryApplicationState,
  candidate: RecoveryCandidate,
  disruptionId: string,
  expectedFingerprint: string
): RecoveryApplicationResult {
  if (recoveryFingerprint(current, disruptionId) !== expectedFingerprint) return { applied: false, reason: 'stale-plan' };
  const index = current.itinerary.segments.findIndex(segment => segment.activityId === candidate.action.nodeId);
  if (index < 0) return { applied: false, reason: 'target-not-found' };
  const target = current.itinerary.segments[index];
  const segments = [...current.itinerary.segments];
  const selectedRouteIds = { ...current.selectedRouteIds };

  if (candidate.action.type === 'replace_transport_route') {
    const replacementRouteId = candidate.action.replacementRouteId;
    const replacement = target.routingAlternatives?.find(route => route.id === replacementRouteId);
    if (!replacement) return { applied: false, reason: 'route-not-found' };
    segments[index] = {
      ...target,
      selectedRouteCandidateId: replacement.id,
      routeGeometry: replacement.geometry.map(point => [...point] as [number, number]),
      routeDuration: replacement.duration,
      routeDistance: replacement.distance,
      estimatedCost: replacement.estimatedCost,
      costEstimateSource: replacement.costEstimateSource,
      costEstimateModel: replacement.costEstimateModel,
      routingStatus: 'routed',
    };
    selectedRouteIds[index] = replacement.id;
  } else if (candidate.action.type === 'shift_flexible_activity') {
    if (target.flexibility !== 'flexible') return { applied: false, reason: 'fixed-activity' };
    segments[index] = { ...target, departureTime: candidate.action.newStartTime, arrivalTime: candidate.action.newEndTime };
  } else {
    return { applied: false, reason: 'unsupported-action' };
  }

  return { applied: true, state: { itinerary: { ...current.itinerary, segments }, selectedRouteIds } };
}
