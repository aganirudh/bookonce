import { z } from 'zod';
import {
  OptimizationWeightsSchema,
  PreferenceExtractionSchema,
  RouteConstraintsSchema,
} from './preferenceSchema.runtime.js';

export { OptimizationWeightsSchema, PreferenceExtractionSchema, RouteConstraintsSchema };
export type PreferenceExtraction = z.infer<typeof PreferenceExtractionSchema>;
