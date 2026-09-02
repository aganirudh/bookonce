import type { JourneySegment } from '../schemas/aiSchemas';

export interface DisruptionMatchingNode {
  nodeId: string;
  kind: 'transport';
  flight?: {
    carrierCode: string;
    flightNumber: string;
    originCode?: string;
    destinationCode?: string;
    scheduledDeparture?: string;
  };
}

export function journeySegmentToDisruptionMatchingNode(
  segment: JourneySegment
): DisruptionMatchingNode | undefined {
  if (!segment.activityId || segment.mode !== 'flight') return undefined;
  const identity = segment.externalFlightIdentity;
  return {
    nodeId: segment.activityId,
    kind: 'transport',
    ...(identity
      ? {
          flight: {
            carrierCode: identity.carrierCode,
            flightNumber: identity.flightNumber,
            ...(identity.departureAirportCode ? { originCode: identity.departureAirportCode } : {}),
            ...(identity.arrivalAirportCode ? { destinationCode: identity.arrivalAirportCode } : {}),
            ...(identity.scheduledDeparture ? { scheduledDeparture: identity.scheduledDeparture } : {}),
          },
        }
      : {}),
  };
}
