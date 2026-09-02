import { deduplicateObservations, normalizeMatchedObservation } from './normalizer.js';
import { matchDisruptionObservation } from './matcher.js';

async function bounded(adapter, query) {
  let timeout;
  try {
    return await Promise.race([
      adapter.getDisruptions(query),
      new Promise((_, reject) => { timeout = setTimeout(() => reject(Object.assign(new Error('Provider timeout'), { code: 'PROVIDER_TIMEOUT' })), adapter.timeoutMs ?? 5_000); }),
    ]);
  } finally { if (timeout) clearTimeout(timeout); }
}

export async function ingestDisruptions({ adapter, capability, query, nodes, freshnessPolicy, now = new Date() }) {
  if (!adapter || adapter.fixtureOnly) return { status: 'provider-unavailable', results: [] };
  if (!adapter.capabilities.includes(capability)) return { status: 'provider-unavailable', results: [], reason: 'unsupported-capability' };
  try {
    const supplied = await bounded(adapter, query);
    if (!Array.isArray(supplied)) return { status: 'provider-unavailable', results: [], reason: 'provider-error' };
    const invalidResults = [];
    const observations = deduplicateObservations(supplied.filter(observation => {
      const valid = observation && typeof observation === 'object' && observation.source === 'external-provider' &&
        observation.provider === adapter.provider && observation.kind === capability &&
        observation.subject && typeof observation.subject === 'object' && typeof observation.subject.type === 'string' && typeof observation.status === 'string';
      if (!valid) invalidResults.push({ status: 'unsupported', reason: 'invalid-provider-observation', provider: adapter.provider });
      return valid;
    }));
    const graph = { getNodes: () => nodes.map(node => ({ id: node.nodeId })) };
    return { status: 'ok', results: [...invalidResults, ...observations.map(observation => normalizeMatchedObservation(observation, matchDisruptionObservation(observation, nodes), graph, freshnessPolicy, now))] };
  } catch (error) {
    const reasons = { PROVIDER_TIMEOUT: 'timeout', PROVIDER_AUTH: 'authentication', PROVIDER_QUOTA: 'quota', NOT_CONFIGURED: 'not-configured' };
    return { status: 'provider-unavailable', results: [], reason: reasons[error?.code] ?? 'provider-error' };
  }
}
