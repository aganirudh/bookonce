const ORS_BASE_URL = 'https://api.openrouteservice.org/v2';
const OSRM_BASE_URL = 'https://router.project-osrm.org';
const REQUEST_TIMEOUT_MS = 10_000;

const profiles = { walk: 'foot-walking', drive: 'driving-car', bike: 'cycling-regular' };
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

function normalizedRoute(mode, distance, duration, geometry, steps) {
  return {
    segments: [{ mode, distance, duration, steps, geometry }],
    totalDistance: distance,
    totalDuration: duration,
    summary: `${formatDistance(distance)} • ${formatDuration(duration)}`,
  };
}

async function getORSRoute(start, end, mode, apiKey) {
  const data = await providerFetch(`${ORS_BASE_URL}/directions/${profiles[mode]}/geojson`, {
    method: 'POST',
    headers: { Authorization: apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ coordinates: [[start.lng, start.lat], [end.lng, end.lat]], instructions: true, elevation: false }),
  });
  const feature = data.features[0];
  const segment = feature.properties.segments[0];
  const steps = segment.steps.map(step => ({ instruction: step.instruction, distance: step.distance, duration: step.duration, type: String(step.type) }));
  return normalizedRoute(mode, feature.properties.summary.distance, feature.properties.summary.duration, feature.geometry.coordinates, steps);
}

async function getOSRMRoute(start, end, mode) {
  if (mode !== 'drive') {
    const error = new Error('Routing mode unavailable without OpenRouteService');
    error.code = 'UNSUPPORTED_MODE';
    throw error;
  }
  const data = await providerFetch(`${OSRM_BASE_URL}/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&steps=true&geometries=geojson`);
  const route = data.routes[0];
  const leg = route.legs[0];
  const steps = leg.steps.map(step => ({ instruction: step.maneuver.instruction || `Continue for ${formatDistance(step.distance)}`, distance: step.distance, duration: step.duration, type: step.maneuver.type }));
  return normalizedRoute(mode, route.distance, route.duration, route.geometry.coordinates, steps);
}

export async function getRoute(start, end, mode) {
  const apiKey = process.env.OPENROUTE_API_KEY;
  return apiKey ? getORSRoute(start, end, mode, apiKey) : getOSRMRoute(start, end, mode);
}

export { REQUEST_TIMEOUT_MS };
