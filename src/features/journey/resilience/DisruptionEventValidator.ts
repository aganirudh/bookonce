import type { TravelDependencyGraph } from './TravelDependencyGraph';
import { parseTemporalValue } from './TemporalConstraintValidator';
import type { DisruptionValidationError, TravelDisruption } from './disruptionTypes';

const eventTypes = new Set(['transport_delay', 'route_delay', 'transport_cancellation', 'activity_closure', 'weather_conflict']);

export type DisruptionValidationResult =
  | { valid: true; disruption: TravelDisruption; errors: [] }
  | { valid: false; disruption?: never; errors: DisruptionValidationError[] };

export function validateDisruptionEvent(graph: TravelDependencyGraph, input: unknown): DisruptionValidationResult {
  const errors: DisruptionValidationError[] = [];
  if (!input || typeof input !== 'object') return { valid: false, errors: [{ type: 'invalid-event-type' }] };
  const event = input as Record<string, unknown>;
  if (typeof event.type !== 'string' || !eventTypes.has(event.type)) errors.push({ type: 'invalid-event-type' });
  if (typeof event.targetNodeId !== 'string' || !event.targetNodeId.trim()) errors.push({ type: 'missing-target-node' });
  else if (!graph.getNodes().some(node => node.id === event.targetNodeId)) errors.push({ type: 'target-node-not-found', nodeId: event.targetNodeId });

  const provenance = event.provenance as Record<string, unknown> | undefined;
  if (!provenance || !['provider', 'simulation', 'bookonce-derived'].includes(String(provenance.source))) {
    errors.push({ type: 'invalid-provenance', reason: 'invalid-source' });
  } else if (provenance.source === 'provider' && (typeof provenance.providerName !== 'string' || !provenance.providerName.trim())) {
    errors.push({ type: 'invalid-provenance', reason: 'missing-provider-name' });
  } else if (provenance.source !== 'provider' && provenance.providerName !== undefined) {
    errors.push({ type: 'invalid-provenance', reason: 'unexpected-provider-name' });
  }

  if (event.type === 'transport_delay' || event.type === 'route_delay') {
    const hasDelay = event.delayMinutes !== undefined;
    const hasNewEnd = event.newEndTime !== undefined;
    if (hasDelay === hasNewEnd) errors.push({ type: 'contradictory-delay-fields' });
    if (hasDelay && (typeof event.delayMinutes !== 'number' || !Number.isFinite(event.delayMinutes) || event.delayMinutes < 0)) {
      errors.push({ type: 'invalid-delay' });
    }
    if (hasNewEnd && (typeof event.newEndTime !== 'string' || parseTemporalValue(event.newEndTime) === undefined)) {
      errors.push({ type: 'invalid-new-end-time', value: String(event.newEndTime) });
    }
  } else if (event.delayMinutes !== undefined || event.newEndTime !== undefined) {
    errors.push({ type: 'contradictory-delay-fields' });
  }
  if (event.type === 'weather_conflict' && event.compatibility !== 'caution' && event.compatibility !== 'unsuitable') {
    errors.push({ type: 'invalid-event-type' });
  }
  return errors.length ? { valid: false, errors } : { valid: true, disruption: event as unknown as TravelDisruption, errors: [] };
}
