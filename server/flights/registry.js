import { RapidApiSkyscannerAdapter } from './adapters/rapidApiSkyscanner.js';

export function createFlightProvider(options) {
  return new RapidApiSkyscannerAdapter(options);
}
