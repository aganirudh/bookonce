import { z } from 'zod';
const point = z.object({ lat: z.number().finite().min(-90).max(90), lng: z.number().finite().min(-180).max(180) }).strict();
const weights = z.object({ timeWeight: z.number().finite().min(0), costWeight: z.number().finite().min(0), walkingWeight: z.number().finite().min(0), transfersWeight: z.number().finite().min(0), comfortWeight: z.number().finite().min(0).optional() }).strict().refine(value => Object.values(value).some(item => item > 0));
const constraints = z.object({ maxCost: z.number().finite().min(0).optional(), maxDurationSeconds: z.number().finite().min(0).optional(), maxWalkingDistanceMeters: z.number().finite().min(0).optional(), maxTransfers: z.number().int().min(0).optional() }).strict();
const candidate = z.object({ id: z.string().min(1), durationSeconds: z.number().finite().nonnegative(), distanceMeters: z.number().finite().nonnegative().optional(), cost: z.number().finite().nonnegative().optional(), walkingDistanceMeters: z.number().finite().nonnegative().optional(), transfers: z.number().int().nonnegative().optional() }).strict();
const weather = z.object({ timestamp: z.string(), temperatureC: z.number().finite(), apparentTemperatureC: z.number().finite(), precipitationProbability: z.number().finite().min(0).max(100), precipitationMm: z.number().finite().nonnegative(), weatherCode: z.number().int(), windSpeedKph: z.number().finite().nonnegative() }).strict();
const activity = z.object({ id: z.string(), title: z.string(), category: z.enum(['indoor', 'outdoor', 'mixed', 'transport']), flexibility: z.enum(['fixed', 'flexible']), timestamp: z.string().optional(), durationMinutes: z.number().nonnegative().optional() }).strict();
const compatibility = z.object({ activityId: z.string(), compatibility: z.enum(['compatible', 'caution', 'unsuitable', 'unknown']), reasons: z.array(z.string()) }).strict();

export const toolSchemas = {
  geocode_location: z.object({ query: z.string().trim().min(1).max(300) }).strict(),
  get_route_options: z.object({ start: point, end: point, mode: z.enum(['walk', 'drive', 'bike']), maxAlternatives: z.number().int().min(1).max(3).default(3) }).strict(),
  get_weather_forecast: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180), startDate: z.string().date(), endDate: z.string().date() }).strict(),
  interpret_route_preferences: z.object({ preset: z.enum(['FASTEST', 'CHEAPEST', 'BALANCED', 'COMFORT']).nullable(), weights: weights.optional(), constraints: constraints.optional() }).strict().refine(value => value.preset || value.weights),
  optimize_routes: z.object({ candidates: z.array(candidate).min(1).max(3), preferences: weights, constraints: constraints.optional() }).strict(),
  estimate_route_cost: z.object({ mode: z.enum(['walk', 'car', 'taxi', 'auto', 'rapido']), distanceMeters: z.number().finite().nonnegative(), durationSeconds: z.number().finite().nonnegative().optional() }).strict(),
  evaluate_weather_compatibility: z.object({ activity, weather: weather.optional() }).strict(),
  propose_weather_replan: z.object({ activities: z.array(activity).max(20), compatibilityResults: z.array(compatibility).max(20) }).strict(),
};
