import { z } from 'zod';

export const LocationSchema = z.object({
  name: z.string().trim().min(1),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const TravelStyleSchema = z.enum(['urgent', 'leisure']);

export const JourneyRequestSchema = z.object({
  origin: LocationSchema,
  destination: LocationSchema,
  departureDate: z.string().date(),
  returnDate: z.string().date().optional(),
  travelers: z.number().int().positive(),
  travelStyle: TravelStyleSchema,
  preferences: z
    .object({
      budget: z.enum(['low', 'medium', 'high']).optional(),
      pace: z.enum(['relaxed', 'moderate', 'fast']).optional(),
      interests: z.array(z.string().trim().min(1)).optional(),
    })
    .optional(),
});

export const TransportModeSchema = z.enum([
  'walk',
  'metro',
  'bus',
  'taxi',
  'flight',
  'train',
  'car',
  'auto',
  'rapido',
]);

export const JourneySegmentSchema = z.object({
  mode: TransportModeSchema,
  from: LocationSchema,
  to: LocationSchema,
  departureTime: z.string().trim().min(1).optional(),
  arrivalTime: z.string().trim().min(1).optional(),
  duration: z.number().nonnegative().optional(),
  distance: z.number().nonnegative().optional(),
  estimatedCost: z.number().nonnegative().optional(),
  instructions: z.string().trim().min(1).optional(),
  activityId: z.string().trim().min(1).optional(),
  activityCategory: z.enum(['indoor', 'outdoor', 'mixed', 'transport']).optional(),
  flexibility: z.enum(['fixed', 'flexible']).optional(),
  // Deterministic routing fields. Distance is meters, duration is seconds,
  // and geometry uses the routing-provider [longitude, latitude] convention.
  routeDistance: z.number().nonnegative().optional(),
  routeDuration: z.number().nonnegative().optional(),
  routeGeometry: z.array(z.tuple([z.number(), z.number()])).optional(),
  selectedRouteCandidateId: z.string().optional(),
  optimizationPreferenceLabel: z.string().optional(),
  optimizationWarnings: z.array(z.string()).optional(),
  costEstimateSource: z.enum(['bookonce-estimate', 'ai-suggested']).optional(),
  costEstimateModel: z.string().optional(),
  costCurrency: z.literal('INR').optional(),
  routingAlternatives: z.array(z.object({
    id: z.string(),
    label: z.string(),
    mode: z.enum(['walk', 'drive', 'bike']),
    distance: z.number().nonnegative(),
    duration: z.number().nonnegative(),
    geometry: z.array(z.tuple([z.number(), z.number()])),
    rank: z.number().int().positive(),
    score: z.number().nonnegative(),
    qualityScore: z.number().int().min(0).max(100),
    estimatedCost: z.number().nonnegative().optional(),
    costEstimateSource: z.literal('bookonce-estimate').optional(),
    costEstimateModel: z.string().optional(),
    costCurrency: z.literal('INR').optional(),
    explanation: z.object({
      dominantPreference: z.enum(['time', 'cost', 'walking', 'transfers', 'comfort']),
      advantages: z.array(z.string()),
      tradeOffs: z.array(z.string()),
    }),
  })).optional(),
  routingStatus: z.enum(['routed', 'unsupported', 'unavailable']).optional(),
});

export const ItinerarySchema = z.object({
  origin: LocationSchema,
  destination: LocationSchema,
  segments: z.array(JourneySegmentSchema),
  totalDuration: z.number().nonnegative().optional(),
  totalDistance: z.number().nonnegative().optional(),
  estimatedTotalCost: z.number().nonnegative().optional(),
  summary: z.string().trim().min(1),
});
