const ORS_BASE_URL = 'https://api.openrouteservice.org/v2';
const OSRM_BASE_URL = 'https://router.project-osrm.org';
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_ALTERNATIVES = 3;
const DUPLICATE_DISTANCE_TOLERANCE_METERS = 25;
const DUPLICATE_DURATION_TOLERANCE_SECONDS = 5;

const profiles = { walk: 'foot-walking', drive: 'driving-car', bike: 'cycling-regular' };
const PROVIDER_CAPABILITIES = {
  ors: { modes: ['walk', 'drive', 'bike'], alternatives: true },
  osrm: { modes: ['drive'], alternatives: true },
};
const formatDistance = meters => meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
const formatDuration = seconds => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
};

async function providerFetch(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error('Routing provider failed');
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function routeId(mode, provider, providerRouteIndex, distance, duration) {
  return `${mode}-${provider}-${providerRouteIndex}-${Math.round(distance)}-${Math.round(duration)}`;
}

function normalizedRoute(mode, distance, duration, geometry, steps, provider, providerRouteIndex) {
  return {
    id: routeId(mode, provider, providerRouteIndex, distance, duration),
    provider,
    providerRouteIndex,
    segments: [{ mode, distance, duration, steps, geometry }],
    totalDistance: distance,
    totalDuration: duration,
    summary: `${formatDistance(distance)} • ${formatDuration(duration)}`,
  };
}

function normalizeORSFeature(feature, mode, index) {
  const segment = feature.properties.segments[0];
  const steps = (segment.steps ?? []).map(step => ({
    instruction: step.instruction,
    distance: step.distance,
    duration: step.duration,
    type: String(step.type),
  }));
  return normalizedRoute(
    mode,
    feature.properties.summary.distance,
    feature.properties.summary.duration,
    feature.geometry.coordinates,
    steps,
    'ors',
    index
  );
}

async function getORSRoutes(start, end, mode, apiKey, maxAlternatives) {
  const body = {
    coordinates: [[start.lng, start.lat], [end.lng, end.lat]],
    instructions: true,
    elevation: false,
  };
  if (maxAlternatives > 1) {
    body.alternative_routes = {
      target_count: maxAlternatives - 1,
      weight_factor: 1.4,
      share_factor: 0.6,
    };
  }
  const data = await providerFetch(`${ORS_BASE_URL}/directions/${profiles[mode]}/geojson`, {
    method: 'POST',
    headers: { Authorization: apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!Array.isArray(data.features) || data.features.length === 0) throw new Error('Routing provider returned no routes');
  return data.features.slice(0, maxAlternatives).map((feature, index) => normalizeORSFeature(feature, mode, index));
}

function normalizeOSRMRoute(route, mode, index) {
  const leg = route.legs[0];
  const steps = (leg.steps ?? []).map(step => ({
    instruction: step.maneuver.instruction || `Continue for ${formatDistance(step.distance)}`,
    distance: step.distance,
    duration: step.duration,
    type: step.maneuver.type,
  }));
  return normalizedRoute(mode, route.distance, route.duration, route.geometry.coordinates, steps, 'osrm', index);
}

async function getOSRMRoutes(start, end, mode, maxAlternatives) {
  if (mode !== 'drive') {
    const error = new Error('Routing mode unavailable without OpenRouteService');
    error.code = 'UNSUPPORTED_MODE';
    throw error;
  }
  const alternativeCount = Math.max(0, maxAlternatives - 1);
  const data = await providerFetch(
    `${OSRM_BASE_URL}/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&steps=true&geometries=geojson&alternatives=${alternativeCount}`
  );
  if (!Array.isArray(data.routes) || data.routes.length === 0) throw new Error('Routing provider returned no routes');
  return data.routes.slice(0, maxAlternatives).map((route, index) => normalizeOSRMRoute(route, mode, index));
}

export function deduplicateRoutes(routes) {
  return routes.reduce((unique, route) => {
    const duplicate = unique.some(previous =>
      Math.abs(previous.totalDistance - route.totalDistance) <= DUPLICATE_DISTANCE_TOLERANCE_METERS &&
      Math.abs(previous.totalDuration - route.totalDuration) <= DUPLICATE_DURATION_TOLERANCE_SECONDS
    );
    if (!duplicate) unique.push(route);
    return unique;
  }, []);
}

export async function getRoutes(start, end, mode, maxAlternatives = 3) {
  const boundedCount = Math.min(MAX_ALTERNATIVES, Math.max(1, maxAlternatives));
  const apiKey = process.env.OPENROUTE_API_KEY;
  if (!apiKey) return deduplicateRoutes(await getOSRMRoutes(start, end, mode, boundedCount));

  try {
    return deduplicateRoutes(await getORSRoutes(start, end, mode, apiKey, boundedCount));
  } catch (alternativeError) {
    if (boundedCount > 1) {
      try {
        return deduplicateRoutes(await getORSRoutes(start, end, mode, apiKey, 1));
      } catch {
        // Drive can safely fall back to the public OSRM driving profile.
      }
    }
    if (mode === 'drive') return deduplicateRoutes(await getOSRMRoutes(start, end, mode, boundedCount));
    throw alternativeError;
  }
}

export async function getRoute(start, end, mode) {
  const [route] = await getRoutes(start, end, mode, 1);
  if (!route) throw new Error('Routing provider returned no routes');
  return route;
}

export {
  DUPLICATE_DISTANCE_TOLERANCE_METERS,
  DUPLICATE_DURATION_TOLERANCE_SECONDS,
  MAX_ALTERNATIVES,
  PROVIDER_CAPABILITIES,
  REQUEST_TIMEOUT_MS,
};
