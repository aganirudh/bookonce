import type { Itinerary } from '../schemas/aiSchemas';
import { parseTemporalValue } from './TemporalConstraintValidator';
import type { AdapterLimitation, TravelDependencyEdge, TravelNode } from './types';

export interface ItineraryGraphAdapterResult {
  nodes: TravelNode[];
  edges: TravelDependencyEdge[];
  limitations: AdapterLimitation[];
}

export function adaptItineraryToGraph(
  itinerary: Itinerary,
  explicitDependencies: readonly Omit<TravelDependencyEdge, 'dependencySource'>[] = []
): ItineraryGraphAdapterResult {
  const nodes: TravelNode[] = [];
  const limitations: AdapterLimitation[] = [];
  itinerary.segments.forEach((segment, segmentIndex) => {
    if (!segment.activityId) {
      limitations.push({ type: 'missing-stable-id', segmentIndex });
      return;
    }
    const node: TravelNode = {
      id: segment.activityId,
      kind: !segment.activityCategory || segment.activityCategory === 'transport' ? 'transport' : 'activity',
      flexibility: segment.flexibility ?? 'fixed',
      location: { name: segment.to.name },
      metadata: {
        mode: segment.mode,
        category: segment.activityCategory ?? 'transport',
        ...(segment.mode === 'flight' && segment.externalFlightIdentity
          ? { externalFlightIdentity: { ...segment.externalFlightIdentity } }
          : {}),
      },
    };
    if (segment.departureTime) {
      if (parseTemporalValue(segment.departureTime) === undefined) limitations.push({ type: 'invalid-start-time', segmentIndex, value: segment.departureTime });
      else node.startTime = segment.departureTime;
    }
    if (segment.arrivalTime) {
      if (parseTemporalValue(segment.arrivalTime) === undefined) limitations.push({ type: 'invalid-end-time', segmentIndex, value: segment.arrivalTime });
      else node.endTime = segment.arrivalTime;
    }
    nodes.push(node);
  });
  return {
    nodes,
    edges: explicitDependencies.map(edge => ({ ...edge, dependencySource: 'explicit' })),
    limitations,
  };
}
