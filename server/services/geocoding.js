const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const REQUEST_TIMEOUT_MS = 8_000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1_000;
const cache = new Map();

const normalizeKey = value => value.trim().toLocaleLowerCase();
const normalizeResult = item => ({
  lat: Number(item.lat),
  lng: Number(item.lon),
  displayName: item.display_name,
  address: {
    road: item.address?.road,
    city: item.address?.city || item.address?.town || item.address?.village,
    state: item.address?.state,
    country: item.address?.country,
    postcode: item.address?.postcode,
  },
  type: item.type,
});

async function fetchNominatim(path, params) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${NOMINATIM_BASE_URL}${path}?${new URLSearchParams(params)}`, {
      headers: { 'User-Agent': process.env.NOMINATIM_USER_AGENT || 'BookOnceTravel/1.0 (contact: admin@bookonce.local)' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('Geocoding provider failed');
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function searchLocations(query) {
  const key = `search:${normalizeKey(query)}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const raw = await fetchNominatim('/search', { q: query.trim(), format: 'json', addressdetails: '1', limit: '5' });
  const value = raw.map(normalizeResult);
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

export async function reverseLocation(lat, lng) {
  const key = `reverse:${lat}:${lng}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const raw = await fetchNominatim('/reverse', { lat: String(lat), lon: String(lng), format: 'json', addressdetails: '1' });
  const value = normalizeResult(raw);
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

export function resetGeocodingCache() {
  cache.clear();
}

export { CACHE_TTL_MS, REQUEST_TIMEOUT_MS };
