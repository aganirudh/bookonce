import { normalizeRapidApiResponse } from '../normalizer.js';
import { FlightProviderError } from '../types.js';

const DEFAULT_TIMEOUT_MS = 9_000;
const DEFAULT_SEARCH_PATH = '/api/v1/search';
const SAFE_PATH = /^\/[a-zA-Z0-9/_-]+$/;
const SAFE_HOST = /^[a-zA-Z0-9.-]+\.p\.rapidapi\.com$/;

export class RapidApiSkyscannerAdapter {
  constructor({
    apiKey = process.env.RAPIDAPI_KEY,
    host = process.env.RAPIDAPI_SKYSCANNER_HOST,
    searchPath = process.env.RAPIDAPI_SKYSCANNER_SEARCH_PATH || DEFAULT_SEARCH_PATH,
    fetchImpl = fetch,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = {}) {
    this.apiKey = apiKey?.trim();
    this.host = host?.trim();
    this.searchPath = searchPath?.trim();
    this.fetchImpl = fetchImpl;
    this.timeoutMs = timeoutMs;
  }

  validateConfiguration() {
    if (!this.apiKey || !this.host || !SAFE_HOST.test(this.host) || !SAFE_PATH.test(this.searchPath)) {
      throw new FlightProviderError('NOT_CONFIGURED');
    }
  }

  async search(query) {
    this.validateConfiguration();
    if (query.children > 0 || query.infants > 0) {
      throw new FlightProviderError('UNSUPPORTED_PASSENGER_COMPOSITION');
    }
    const params = new URLSearchParams({
      origin: query.origin,
      destination: query.destination,
      date: query.departureDate,
      limit: '20',
      adults: String(query.adults),
      cabin: query.cabinClass,
      currency: query.currency,
      market: query.market,
      locale: query.locale,
    });
    const url = new URL(`https://${this.host}${this.searchPath}`);
    url.search = params.toString();

    let response;
    try {
      response = await this.fetchImpl(url, {
        method: 'GET',
        headers: { 'X-RapidAPI-Key': this.apiKey, 'X-RapidAPI-Host': this.host },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      if (error?.name === 'AbortError' || error?.name === 'TimeoutError') throw new FlightProviderError('TIMEOUT');
      throw new FlightProviderError('NETWORK_ERROR');
    }

    if (response.status === 401 || response.status === 403) throw new FlightProviderError('AUTHENTICATION_FAILED');
    if (response.status === 429) throw new FlightProviderError('QUOTA_EXCEEDED');
    if (response.status >= 400 && response.status < 500) throw new FlightProviderError('PROVIDER_REJECTED');
    if (!response.ok) throw new FlightProviderError('PROVIDER_UNAVAILABLE');

    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new FlightProviderError('MALFORMED_RESPONSE');
    }
    if (payload?.success === false || payload?.error) throw new FlightProviderError('PROVIDER_REJECTED');
    return normalizeRapidApiResponse(payload);
  }
}
