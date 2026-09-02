export const FLIGHT_PROVIDER = 'rapidapi-skyscanner';

export class FlightProviderError extends Error {
  constructor(code, message = 'Flight search provider unavailable') {
    super(message);
    this.name = 'FlightProviderError';
    this.code = code;
  }
}
