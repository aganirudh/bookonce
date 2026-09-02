/** Provider-neutral client for BookOnce's server-side flight search. */
export interface SkyscannerFlightQuery {
  originSkyId: string;
  destinationSkyId: string;
  originEntityId: string;
  destinationEntityId: string;
  date: string;
  returnDate?: string;
  cabinClass: 'economy' | 'premium_economy' | 'business' | 'first';
  adults: number;
  children?: number;
  infants?: number;
  currency?: string;
  locale?: string;
  market?: string;
}

export interface FlightCandidate {
  provider: string;
  providerItineraryId?: string;
  carrierCode: string;
  carrierName?: string;
  flightNumber: string;
  departureAirportCode: string;
  arrivalAirportCode: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  price?: number;
  currency?: string;
  formattedPrice?: string;
  bookingUrl?: string;
}

export type SkyscannerFlight = FlightCandidate;

class SkyscannerService {
  async searchFlights(query: SkyscannerFlightQuery): Promise<FlightCandidate[]> {
    const response = await fetch('/api/flights/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: query.originSkyId,
        destination: query.destinationSkyId,
        departureDate: query.date,
        adults: query.adults,
        children: query.children ?? 0,
        infants: query.infants ?? 0,
        cabinClass: query.cabinClass,
        currency: query.currency ?? 'INR',
        market: query.market ?? 'IN',
        locale: query.locale ?? 'en-IN',
      }),
    });

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new Error('Flight search is temporarily unavailable');
    }
    if (!response.ok || !isFlightSearchResponse(body)) {
      throw new Error('Flight search is temporarily unavailable');
    }
    return body.candidates;
  }

  async searchPlaces(): Promise<never> {
    throw new Error('Flight place search is not available through the BookOnce backend');
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  formatTime(isoString: string): string {
    return new Date(isoString).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
  }
}

function isFlightSearchResponse(value: unknown): value is { success: true; candidates: FlightCandidate[] } {
  return Boolean(value && typeof value === 'object' && (value as { success?: unknown }).success === true && Array.isArray((value as { candidates?: unknown }).candidates));
}

export const skyscannerService = new SkyscannerService();
export default skyscannerService;
