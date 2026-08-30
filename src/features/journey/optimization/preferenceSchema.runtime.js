import { z } from 'zod';

export const OptimizationWeightsSchema = z.object({
  timeWeight: z.number().finite().min(0).max(100),
  costWeight: z.number().finite().min(0).max(100),
  walkingWeight: z.number().finite().min(0).max(100),
  transfersWeight: z.number().finite().min(0).max(100),
  comfortWeight: z.number().finite().min(0).max(100).optional(),
}).strict().refine(weights => Object.values(weights).some(weight => weight > 0), {
  message: 'At least one optimization weight must be positive',
});

export const RouteConstraintsSchema = z.object({
  maxCost: z.number().finite().min(0).max(10_000_000).optional(),
  maxDurationSeconds: z.number().finite().min(0).max(31_536_000).optional(),
  maxWalkingDistanceMeters: z.number().finite().min(0).max(1_000_000).optional(),
  maxTransfers: z.number().int().min(0).max(100).optional(),
}).strict();

export const PreferenceExtractionSchema = z.object({
  preset: z.enum(['FASTEST', 'CHEAPEST', 'BALANCED', 'COMFORT']).nullable(),
  weights: OptimizationWeightsSchema.optional(),
  constraints: RouteConstraintsSchema.optional(),
}).strict().refine(value => value.preset !== null || value.weights !== undefined, {
  message: 'A preset or custom weights are required',
});
