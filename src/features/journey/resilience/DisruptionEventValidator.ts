import type { TravelDependencyGraph } from './TravelDependencyGraph';
import type { DisruptionValidationError, TravelDisruption } from './disruptionTypes';
import { validateDisruptionEventRuntime } from './DisruptionEventValidator.runtime.js';

export type DisruptionValidationResult =
  | { valid: true; disruption: TravelDisruption; errors: [] }
  | { valid: false; disruption?: never; errors: DisruptionValidationError[] };

export function validateDisruptionEvent(graph: TravelDependencyGraph, input: unknown): DisruptionValidationResult {
  return validateDisruptionEventRuntime(graph, input) as DisruptionValidationResult;
}
