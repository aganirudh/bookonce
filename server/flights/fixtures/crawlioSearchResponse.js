// Sanitized from the verified Crawlio /api/v1/search response shape. It keeps
// only fields required by deterministic normalization tests.
export const crawlioDirectSearchResponse = {
  success: true,
  trip_type: 'one-way',
  results_count: 1,
  market: 'US',
  locale: 'en-US',
  currency: 'USD',
  results: [{
    price_raw: 294.5,
    price: '$295',
    carriers: ['Delta'],
    tags: ['Direct'],
    legs: [{
      from: 'JFK', to: 'LHR', dep: '2026-09-15T18:30:00', arr: '2026-09-16T06:30:00',
      segments: [{ flight: 'DL5923', from: 'JFK', to: 'LHR', dep: '2026-09-15T18:30:00', arr: '2026-09-16T06:30:00' }],
    }],
  }],
};
