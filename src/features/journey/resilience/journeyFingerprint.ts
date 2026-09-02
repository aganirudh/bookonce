import type { Itinerary, JourneySegment } from '../schemas/aiSchemas';

export interface JourneyFingerprintState {
  itinerary: Itinerary;
  selectedRouteIds: Readonly<Record<number, string | undefined>>;
}

function canonicalSegment(segment: JourneySegment, index: number, selectedRouteId?: string) {
  return {
    id: segment.activityId ?? `~missing:${String(index).padStart(8, '0')}`,
    selectedRouteId: selectedRouteId ?? segment.selectedRouteCandidateId ?? null,
    departureTime: segment.departureTime ?? null,
    arrivalTime: segment.arrivalTime ?? null,
    routeDuration: segment.routeDuration ?? null,
    routeDistance: segment.routeDistance ?? null,
    estimatedCost: segment.estimatedCost ?? null,
    costEstimateSource: segment.costEstimateSource ?? null,
    costEstimateModel: segment.costEstimateModel ?? null,
    externalFlightIdentity: segment.externalFlightIdentity
      ? {
          carrierCode: segment.externalFlightIdentity.carrierCode,
          flightNumber: segment.externalFlightIdentity.flightNumber,
          departureAirportCode: segment.externalFlightIdentity.departureAirportCode ?? null,
          arrivalAirportCode: segment.externalFlightIdentity.arrivalAirportCode ?? null,
          scheduledDeparture: segment.externalFlightIdentity.scheduledDeparture ?? null,
        }
      : null,
  };
}

export function itineraryFingerprint(state: JourneyFingerprintState): string {
  const segments = state.itinerary.segments
    .map((segment, index) => canonicalSegment(segment, index, state.selectedRouteIds[index]))
    .sort((left, right) => left.id.localeCompare(right.id));
  return JSON.stringify({ segments });
}
