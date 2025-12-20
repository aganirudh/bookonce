/**
 * Skyscanner Flight Search Service
 *
 * Integrates with Skyscanner API to fetch real-time flight data
 * API Documentation: https://developers.skyscanner.net/docs/intro
 */

export interface SkyscannerFlightQuery {
  originSkyId: string;
  destinationSkyId: string;
  originEntityId: string;
  destinationEntityId: string;
  date: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD for round trips
  cabinClass: 'economy' | 'premium_economy' | 'business' | 'first';
  adults: number;
  children?: number;
  infants?: number;
  currency?: string;
  locale?: string;
  market?: string;
}

export interface SkyscannerFlight {
  id: string;
  price: {
    amount: number;
    currency: string;
    formatted: string;
  };
  legs: Array<{
    origin: {
      id: string;
      name: string;
      displayCode: string;
      city: string;
    };
    destination: {
      id: string;
      name: string;
      displayCode: string;
      city: string;
    };
    departure: string; // ISO datetime
    arrival: string; // ISO datetime
    duration: number; // minutes
    stopCount: number;
    carriers: Array<{
      id: string;
      name: string;
      logoUrl: string;
      displayCode: string;
    }>;
    segments: Array<{
      origin: string;
      destination: string;
      departure: string;
      arrival: string;
      flightNumber: string;
      carrier: {
        name: string;
        displayCode: string;
      };
    }>;
  }>;
  bookingUrl: string;
  deepLink: string;
}

class SkyscannerService {
  private readonly API_KEY = import.meta.env.VITE_SKYSCANNER_API_KEY || '';
  private readonly BASE_URL = 'https://partners.api.skyscanner.net/apiservices';

  // RapidAPI endpoint (alternative)
  private readonly RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY || '';
  private readonly RAPIDAPI_HOST = 'skyscanner80.p.rapidapi.com';
  private readonly RAPIDAPI_URL = `https://${this.RAPIDAPI_HOST}`;

  /**
   * Search for flights using Skyscanner API
   */
  async searchFlights(query: SkyscannerFlightQuery): Promise<SkyscannerFlight[]> {
    try {
      // Use RapidAPI if available (easier to get started)
      if (this.RAPIDAPI_KEY) {
        return await this.searchFlightsRapidAPI(query);
      }

      // Fallback to direct Skyscanner API
      if (this.API_KEY) {
        return await this.searchFlightsDirectAPI(query);
      }

      throw new Error(
        'No API key configured. Please add VITE_RAPIDAPI_KEY or VITE_SKYSCANNER_API_KEY to .env'
      );
    } catch (error) {
      console.error('Skyscanner API error:', error);
      throw error;
    }
  }

  /**
   * Search flights using RapidAPI (recommended for development)
   */
  private async searchFlightsRapidAPI(query: SkyscannerFlightQuery): Promise<SkyscannerFlight[]> {
    const url = `${this.RAPIDAPI_URL}/api/v1/flights/search-one-way`;

    const params = new URLSearchParams({
      fromId: query.originEntityId,
      toId: query.destinationEntityId,
      departDate: query.date,
      adults: query.adults.toString(),
      cabinClass: query.cabinClass,
      currency: query.currency || 'INR',
      market: query.market || 'IN',
      locale: query.locale || 'en-IN',
    });

    if (query.children) params.append('children', query.children.toString());
    if (query.infants) params.append('infants', query.infants.toString());

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': this.RAPIDAPI_KEY,
        'X-RapidAPI-Host': this.RAPIDAPI_HOST,
      },
    });

    if (!response.ok) {
      throw new Error(`RapidAPI error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return this.parseRapidAPIResponse(data);
  }

  /**
   * Search flights using direct Skyscanner API
   */
  private async searchFlightsDirectAPI(query: SkyscannerFlightQuery): Promise<SkyscannerFlight[]> {
    // Step 1: Create a session
    const sessionUrl = `${this.BASE_URL}/v3/flights/live/search/create`;

    const sessionResponse = await fetch(sessionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.API_KEY,
      },
      body: JSON.stringify({
        query: {
          market: query.market || 'IN',
          locale: query.locale || 'en-IN',
          currency: query.currency || 'INR',
          queryLegs: [
            {
              originPlaceId: { iata: query.originSkyId },
              destinationPlaceId: { iata: query.destinationSkyId },
              date: {
                year: parseInt(query.date.split('-')[0]),
                month: parseInt(query.date.split('-')[1]),
                day: parseInt(query.date.split('-')[2]),
              },
            },
          ],
          cabinClass: query.cabinClass.toUpperCase(),
          adults: query.adults,
          children: query.children || 0,
          infants: query.infants || 0,
        },
      }),
    });

    if (!sessionResponse.ok) {
      throw new Error(`Skyscanner API error: ${sessionResponse.status}`);
    }

    const sessionData = await sessionResponse.json();
    const sessionToken = sessionData.sessionToken;

    // Step 2: Poll for results
    const pollUrl = `${this.BASE_URL}/v3/flights/live/search/poll/${sessionToken}`;

    const pollResponse = await fetch(pollUrl, {
      method: 'GET',
      headers: {
        'x-api-key': this.API_KEY,
      },
    });

    if (!pollResponse.ok) {
      throw new Error(`Skyscanner poll error: ${pollResponse.status}`);
    }

    const pollData = await pollResponse.json();
    return this.parseDirectAPIResponse(pollData);
  }

  /**
   * Get place ID for autocomplete/search
   */
  async searchPlaces(query: string): Promise<
    Array<{
      id: string;
      name: string;
      iata: string;
      city: string;
      country: string;
    }>
  > {
    if (!this.RAPIDAPI_KEY) {
      throw new Error('RapidAPI key required for place search');
    }

    const url = `${this.RAPIDAPI_URL}/api/v1/flights/auto-complete`;
    const params = new URLSearchParams({
      query: query,
      locale: 'en-IN',
    });

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': this.RAPIDAPI_KEY,
        'X-RapidAPI-Host': this.RAPIDAPI_HOST,
      },
    });

    if (!response.ok) {
      throw new Error(`Place search error: ${response.status}`);
    }

    const data = await response.json();
    return (
      data.data?.map((place: any) => ({
        id: place.entityId,
        name: place.presentation.title,
        iata: place.iata || place.skyId,
        city: place.presentation.subtitle,
        country: place.navigation.relevantFlightParams.market,
      })) || []
    );
  }

  /**
   * Parse RapidAPI response
   */
  private parseRapidAPIResponse(data: any): SkyscannerFlight[] {
    if (!data.data?.itineraries) {
      return [];
    }

    return data.data.itineraries.map((itinerary: any) => {
      const pricingOption = itinerary.pricingOptions?.[0];

      return {
        id: itinerary.id,
        price: {
          amount: pricingOption?.price?.amount || 0,
          currency: pricingOption?.price?.unit || 'INR',
          formatted: pricingOption?.price?.formatted || '₹0',
        },
        legs: itinerary.legs.map((leg: any) => ({
          origin: {
            id: leg.origin.id,
            name: leg.origin.name,
            displayCode: leg.origin.displayCode,
            city: leg.origin.city || leg.origin.name,
          },
          destination: {
            id: leg.destination.id,
            name: leg.destination.name,
            displayCode: leg.destination.displayCode,
            city: leg.destination.city || leg.destination.name,
          },
          departure: leg.departure,
          arrival: leg.arrival,
          duration: leg.durationInMinutes,
          stopCount: leg.stopCount,
          carriers: leg.carriers.marketing.map((carrier: any) => ({
            id: carrier.id,
            name: carrier.name,
            logoUrl: carrier.logoUrl || '',
            displayCode: carrier.alternateId || carrier.id,
          })),
          segments:
            leg.segments?.map((segment: any) => ({
              origin: segment.origin.displayCode,
              destination: segment.destination.displayCode,
              departure: segment.departure,
              arrival: segment.arrival,
              flightNumber: segment.flightNumber,
              carrier: {
                name: segment.marketingCarrier.name,
                displayCode: segment.marketingCarrier.alternateId,
              },
            })) || [],
        })),
        bookingUrl: pricingOption?.items?.[0]?.deepLink || '',
        deepLink: pricingOption?.items?.[0]?.deepLink || '',
      };
    });
  }

  /**
   * Parse direct API response
   */
  private parseDirectAPIResponse(data: any): SkyscannerFlight[] {
    if (!data.content?.results?.itineraries) {
      return [];
    }

    return Object.values(data.content.results.itineraries).map((itinerary: any) => {
      const pricing = itinerary.pricingOptions?.[0];

      return {
        id: itinerary.id,
        price: {
          amount: pricing?.price?.amount || 0,
          currency: pricing?.price?.unit || 'INR',
          formatted: `₹${pricing?.price?.amount || 0}`,
        },
        legs: itinerary.legIds.map((legId: string) => {
          const leg = data.content.results.legs[legId];
          return {
            origin: {
              id: leg.originPlaceId,
              name: leg.originPlace?.name || '',
              displayCode: leg.originPlace?.iata || '',
              city: leg.originPlace?.city || '',
            },
            destination: {
              id: leg.destinationPlaceId,
              name: leg.destinationPlace?.name || '',
              displayCode: leg.destinationPlace?.iata || '',
              city: leg.destinationPlace?.city || '',
            },
            departure: leg.departureDateTime,
            arrival: leg.arrivalDateTime,
            duration: leg.durationInMinutes,
            stopCount: leg.stopCount,
            carriers:
              leg.carriers?.marketing?.map((carrierId: string) => {
                const carrier = data.content.results.carriers[carrierId];
                return {
                  id: carrier.id,
                  name: carrier.name,
                  logoUrl: carrier.imageUrl || '',
                  displayCode: carrier.iata || carrier.id,
                };
              }) || [],
            segments: [],
          };
        }),
        bookingUrl: pricing?.items?.[0]?.url || '',
        deepLink: pricing?.items?.[0]?.url || '',
      };
    });
  }

  /**
   * Format duration from minutes to readable string
   */
  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  /**
   * Format time from ISO string
   */
  formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
}

export const skyscannerService = new SkyscannerService();
export default skyscannerService;
