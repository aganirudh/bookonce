import type { FlightCandidate } from '@/services/SkyscannerService';
import type { ExternalFlightIdentity, Itinerary, JourneySegment } from '../schemas/aiSchemas';

export function flightCandidateToExternalIdentity(candidate: FlightCandidate): ExternalFlightIdentity | undefined {
  if (!candidate.carrierCode || !candidate.flightNumber) return undefined;
  return {
    carrierCode: candidate.carrierCode,
    flightNumber: candidate.flightNumber,
    ...(candidate.departureAirportCode ? { departureAirportCode: candidate.departureAirportCode } : {}),
    ...(candidate.arrivalAirportCode ? { arrivalAirportCode: candidate.arrivalAirportCode } : {}),
    ...(candidate.scheduledDeparture ? { scheduledDeparture: candidate.scheduledDeparture } : {}),
    ...(candidate.scheduledArrival ? { scheduledArrival: candidate.scheduledArrival } : {}),
    ...(candidate.provider ? { provider: candidate.provider } : {}),
    ...(candidate.providerItineraryId ? { providerItineraryId: candidate.providerItineraryId } : {}),
  };
}

export function attachFlightCandidateIdentity(segment: JourneySegment, candidate: FlightCandidate): JourneySegment {
  if (segment.mode !== 'flight') return segment;
  const externalFlightIdentity = flightCandidateToExternalIdentity(candidate);
  return externalFlightIdentity ? { ...segment, externalFlightIdentity } : segment;
}

export function bindSelectedFlightToItinerary(
  itinerary: Itinerary,
  segmentId: string,
  candidate: FlightCandidate
): Itinerary {
  return {
    ...itinerary,
    segments: itinerary.segments.map((segment, index) =>
      (segment.activityId ?? `flight-segment-${index}`) === segmentId ? attachFlightCandidateIdentity(segment, candidate) : segment
    ),
  };
}
