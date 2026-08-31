import { randomUUID } from 'node:crypto';
import { searchLocations } from '../services/geocoding.js';
import { getRoutes } from '../services/routing.js';
import { fetchWeatherForecast } from '../services/weather.js';
import { getRegisteredTool } from './toolRegistry.js';

const presets = { FASTEST: { timeWeight: 7, costWeight: 1, walkingWeight: 1, transfersWeight: 1 }, CHEAPEST: { timeWeight: 1, costWeight: 7, walkingWeight: 1, transfersWeight: 1 }, BALANCED: { timeWeight: 1, costWeight: 1, walkingWeight: 1, transfersWeight: 1 }, COMFORT: { timeWeight: 1, costWeight: 1, walkingWeight: 3, transfersWeight: 3, comfortWeight: 4 } };
const round5 = value => Math.round(value / 5) * 5;

function estimateCost({ mode, distanceMeters }) {
  const km = distanceMeters / 1000;
  if (mode === 'walk') return { estimatedCost: 0, currency: 'INR', source: 'bookonce-estimate', model: 'walking-monetary-v1' };
  const models = { car: [0, 105 / 14 + 2, 'private-car-v1'], taxi: [80, 16, 'taxi-distance-v1'], auto: [35, 12, 'auto-distance-v1'], rapido: [25, 9, 'rapido-distance-v1'] };
  const [base, perKm, model] = models[mode];
  return { estimatedCost: round5(base + km * perKm), currency: 'INR', source: 'bookonce-estimate', model };
}

function optimize({ candidates, preferences, constraints = {} }) {
  const eligible = candidates.filter(item => !(constraints.maxCost !== undefined && item.cost !== undefined && item.cost > constraints.maxCost) && !(constraints.maxDurationSeconds !== undefined && item.durationSeconds > constraints.maxDurationSeconds));
  const metrics = [['durationSeconds', preferences.timeWeight], ['cost', preferences.costWeight], ['walkingDistanceMeters', preferences.walkingWeight], ['transfers', preferences.transfersWeight]];
  const scored = eligible.map(candidate => ({ candidate, score: metrics.reduce((sum, [key, weight]) => {
    const known = eligible.map(item => item[key]).filter(value => value !== undefined); if (!known.length || candidate[key] === undefined) return sum;
    const min = Math.min(...known); const max = Math.max(...known); return sum + (max === min ? 0 : (candidate[key] - min) / (max - min)) * weight;
  }, 0) })).sort((a, b) => a.score - b.score || a.candidate.durationSeconds - b.candidate.durationSeconds || a.candidate.id.localeCompare(b.candidate.id));
  return { selected: scored[0] ? { ...scored[0].candidate, score: scored[0].score } : null, ranked: scored.map((item, index) => ({ ...item.candidate, rank: index + 1, score: item.score })) };
}

function compatibility({ activity, weather }) {
  if (!weather) return { activityId: activity.id, compatibility: 'unknown', reasons: ['weather-unavailable'] };
  if (activity.category === 'indoor' || activity.category === 'transport') return { activityId: activity.id, compatibility: 'compatible', reasons: [] };
  const heavy = weather.precipitationMm >= 4 || weather.precipitationProbability >= 75;
  const reasons = heavy ? ['heavy-rain'] : weather.precipitationProbability >= 50 ? ['rain-likely'] : [];
  if (weather.temperatureC >= 40) reasons.push('very-high-heat'); else if (weather.temperatureC >= 35) reasons.push('high-heat');
  if (weather.windSpeedKph >= 40) reasons.push('high-wind');
  return { activityId: activity.id, compatibility: activity.category === 'outdoor' && (heavy || weather.temperatureC >= 40) ? 'unsuitable' : reasons.length ? 'caution' : 'compatible', reasons };
}

function replan({ activities, compatibilityResults }) {
  const proposed = activities.map(item => ({ ...item })); const bad = proposed.findIndex(item => item.category === 'outdoor' && item.flexibility === 'flexible' && compatibilityResults.find(result => result.activityId === item.id)?.compatibility === 'unsuitable');
  const good = proposed.findIndex(item => item.category === 'indoor' && item.flexibility === 'flexible' && compatibilityResults.find(result => result.activityId === item.id)?.compatibility === 'compatible');
  if (bad < 0) return { proposed, changes: [] };
  if (good < 0 || !proposed[bad].timestamp || !proposed[good].timestamp || proposed[bad].timestamp.slice(0, 10) !== proposed[good].timestamp.slice(0, 10)) return { proposed, changes: [{ type: 'warning', activityId: proposed[bad].id, reason: 'Weather conflict detected; no compatible flexible activity was available.' }] };
  [proposed[bad], proposed[good]] = [proposed[good], proposed[bad]];
  return { proposed, changes: [{ type: 'swap', firstActivityId: activities[bad].id, secondActivityId: activities[good].id, reason: 'Heavy rain is expected during the outdoor activity.' }] };
}

export async function executeTool(name, rawArguments, requestId = randomUUID()) {
  const registered = getRegisteredTool(name);
  if (!registered) return { success: false, tool: name, errorCode: 'UNKNOWN_TOOL', message: 'That capability is not available.' };
  const parsed = registered.schema.safeParse(rawArguments);
  if (!parsed.success) return { success: false, tool: name, errorCode: 'INVALID_ARGUMENTS', message: 'The tool arguments were invalid.' };
  const started = Date.now();
  try {
    const args = parsed.data;
    let data;
    if (name === 'geocode_location') data = (await searchLocations(args.query)).slice(0, 5);
    else if (name === 'get_route_options') data = (await getRoutes(args.start, args.end, args.mode, args.maxAlternatives)).map(route => ({ id: route.id, distanceMeters: route.totalDistance, durationSeconds: route.totalDuration, provider: route.provider }));
    else if (name === 'get_weather_forecast') data = await fetchWeatherForecast(args);
    else if (name === 'interpret_route_preferences') data = { preferences: args.weights ?? presets[args.preset], constraints: args.constraints ?? {} };
    else if (name === 'estimate_route_cost') data = estimateCost(args);
    else if (name === 'optimize_routes') data = optimize(args);
    else if (name === 'evaluate_weather_compatibility') data = compatibility(args);
    else data = replan(args);
    console.info(JSON.stringify({ event: 'agent_tool', requestId, tool: name, durationMs: Date.now() - started, success: true }));
    return { success: true, tool: name, data };
  } catch {
    console.info(JSON.stringify({ event: 'agent_tool', requestId, tool: name, durationMs: Date.now() - started, success: false }));
    return { success: false, tool: name, errorCode: 'TOOL_UNAVAILABLE', message: 'The requested travel information is currently unavailable.' };
  }
}
