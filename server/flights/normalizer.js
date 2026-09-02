import { FLIGHT_PROVIDER, FlightProviderError } from './types.js';

const text = value => (typeof value === 'string' && value.trim() ? value.trim() : undefined);
const finiteNumber = value => (typeof value === 'number' && Number.isFinite(value) ? value : undefined);

function operationalIdentity(segment) {
  const flight = text(segment?.flight);
  const match = flight?.match(/^([A-Z0-9]{2,3})[\s-]+(\d{1,4}[A-Z]?)$/i)
    ?? flight?.match(/^([A-Z0-9]{2})(\d{1,4}[A-Z]?)$/i);
  if (!match) return undefined;
  return { carrierCode: match[1].toUpperCase(), flightNumber: match[2].toUpperCase() };
}

export function normalizeRapidApiResponse(payload) {
  if (payload?.success !== true || !Array.isArray(payload?.results)) {
    throw new FlightProviderError('MALFORMED_RESPONSE');
  }

  const candidates = [];
  for (const result of payload.results) {
    const legs = Array.isArray(result?.legs) ? result.legs : [];
    const segments = legs.length === 1 && Array.isArray(legs[0]?.segments) ? legs[0].segments : [];
    // FlightCandidate represents exactly one operational flight. Connections
    // remain visible provider results but cannot become one fabricated identity.
    if (segments.length !== 1) continue;
    const segment = segments[0];
    const identity = operationalIdentity(segment);
    const departureAirportCode = text(segment?.from);
    const arrivalAirportCode = text(segment?.to);
    const scheduledDeparture = text(segment?.dep);
    const scheduledArrival = text(segment?.arr);
    if (!identity || !departureAirportCode || !arrivalAirportCode || !scheduledDeparture || !scheduledArrival) continue;

    const price = finiteNumber(result?.price_raw);
    const currency = text(payload?.currency);
    const formattedPrice = text(result?.price);
    const carrierName = Array.isArray(result?.carriers) ? text(result.carriers[0]) : undefined;

    candidates.push({
      provider: FLIGHT_PROVIDER,
      ...(text(result?.id) ? { providerItineraryId: text(result.id) } : {}),
      ...identity,
      ...(carrierName ? { carrierName } : {}),
      departureAirportCode,
      arrivalAirportCode,
      scheduledDeparture,
      scheduledArrival,
      ...(price !== undefined ? { price } : {}),
      ...(currency ? { currency } : {}),
      ...(formattedPrice ? { formattedPrice } : {}),
    });
  }
  return candidates;
}
