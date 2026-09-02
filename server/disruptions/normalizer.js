import { validateDisruptionEventRuntime } from '../../src/features/journey/resilience/DisruptionEventValidator.runtime.js';

function stableSubject(subject) {
  return Object.fromEntries(Object.entries(subject).filter(([, value]) => value !== undefined).sort(([left], [right]) => left.localeCompare(right)));
}

export function observationStateKey(observation) {
  return JSON.stringify({ provider: observation.provider, providerEventId: observation.providerEventId ?? null, subject: stableSubject(observation.subject), status: observation.status, timing: stableSubject(observation.timing ?? {}) });
}

export function deduplicateObservations(observations) {
  const unique = new Map();
  for (const observation of observations) if (!unique.has(observationStateKey(observation))) unique.set(observationStateKey(observation), observation);
  return [...unique.values()];
}

export function observationFreshness(observation, policy = {}, now = new Date()) {
  if (!observation.observedAt) return { status: 'unknown' };
  const observed = Date.parse(observation.observedAt);
  if (!Number.isFinite(observed)) return { status: 'invalid' };
  if (policy.maxObservationAgeMinutes === undefined) return { status: 'not-evaluated' };
  const ageMinutes = (now.getTime() - observed) / 60_000;
  return ageMinutes > policy.maxObservationAgeMinutes ? { status: 'stale', ageMinutes } : { status: 'fresh', ageMinutes: Math.max(0, ageMinutes) };
}

export function normalizeMatchedObservation(observation, match, graph, freshnessPolicy, now) {
  const freshness = observationFreshness(observation, freshnessPolicy, now);
  if (observation.status === 'ambiguous') return { status: 'ambiguous', reason: 'provider-record-ambiguous', provider: observation.provider, providerEventId: observation.providerEventId, freshness };
  if (freshness.status === 'stale' || freshness.status === 'invalid') return { status: 'stale', provider: observation.provider, providerEventId: observation.providerEventId, freshness };
  if (match.status !== 'matched') return { ...match, provider: observation.provider, providerEventId: observation.providerEventId, freshness };
  let disruption;
  const provenance = { source: 'provider', providerName: observation.provider, ...(observation.providerEventId ? { referenceId: observation.providerEventId } : {}), ...(observation.observedAt ? { observedAt: observation.observedAt } : {}) };
  if (observation.status === 'cancelled' && ['flight', 'route', 'rail'].includes(observation.subject.type)) disruption = { type: 'transport_cancellation', targetNodeId: match.targetNodeId, provenance };
  else if (observation.status === 'closed' && observation.subject.type === 'activity') disruption = { type: 'activity_closure', targetNodeId: match.targetNodeId, provenance };
  else if (observation.status === 'delayed' && ['flight', 'route', 'rail'].includes(observation.subject.type)) {
    if (Number.isFinite(observation.timing?.delayMinutes) && observation.timing.delayMinutes >= 0) disruption = { type: 'transport_delay', targetNodeId: match.targetNodeId, delayMinutes: observation.timing.delayMinutes, provenance };
    else if (typeof observation.timing?.newEndTime === 'string') disruption = { type: 'transport_delay', targetNodeId: match.targetNodeId, newEndTime: observation.timing.newEndTime, provenance };
    else return { status: 'unsupported', reason: 'missing-delay-timing', provider: observation.provider, providerEventId: observation.providerEventId, match, freshness };
  } else if (observation.status === 'on-time' && observation.subject.type === 'flight') {
    return { status: 'verified-clear', provider: observation.provider, providerEventId: observation.providerEventId, match, freshness };
  } else return { status: 'unsupported', reason: 'unsupported-status', provider: observation.provider, providerEventId: observation.providerEventId, match, freshness };
  const validation = validateDisruptionEventRuntime(graph, disruption);
  if (!validation.valid) return { status: 'unsupported', reason: 'normalized-event-invalid', provider: observation.provider, providerEventId: observation.providerEventId, match, freshness };
  return { status: 'verified', disruption: validation.disruption, match, freshness };
}
