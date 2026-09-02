import { describe, expect, it, vi } from 'vitest';
import { FixtureDisruptionProvider } from './contracts.js';
import { ingestDisruptions } from './ingestion.js';
import { matchDisruptionObservation } from './matcher.js';
import { deduplicateObservations, normalizeMatchedObservation, observationFreshness } from './normalizer.js';

const nodes = [
  { nodeId: 'flight-1', kind: 'transport', flight: { carrierCode: 'AI', flightNumber: '202', originCode: 'BLR', destinationCode: 'DEL', scheduledDeparture: '2026-09-15T09:00:00Z' } },
  { nodeId: 'transfer', kind: 'transport', route: { provider: 'Road Authority', providerRouteId: 'route-44' } },
  { nodeId: 'museum', kind: 'activity', activity: { provider: 'Venue Feed', externalActivityId: 'venue-9' } },
];
const delayed = {
  source: 'external-provider', provider: 'Flight Status Co', providerEventId: 'evt-1', observedAt: '2026-09-15T08:45:00Z',
  kind: 'flight_status', subject: { type: 'flight', carrierCode: 'AI', flightNumber: '202', originCode: 'BLR', destinationCode: 'DEL', scheduledDeparture: '2026-09-15T09:00:00Z' },
  status: 'delayed', timing: { delayMinutes: 45 }, confidence: 0.99,
};
const graph = { getNodes: () => nodes.map(node => ({ id: node.nodeId })) };

describe('verified disruption ingestion', () => {
  it('returns a matched on-time observation as verified-clear without a disruption', async () => {
    const adapter = { provider: delayed.provider, capabilities: ['flight_status'], timeoutMs: 100, getDisruptions: vi.fn().mockResolvedValue([{ ...delayed, status: 'on-time', timing: {} }]) };
    const result = await ingestDisruptions({ adapter, capability: 'flight_status', query: {}, nodes, now: new Date('2026-09-15T09:00:00Z') });
    expect(result.results[0]).toMatchObject({ status: 'verified-clear', provider: delayed.provider, match: { status: 'matched', targetNodeId: 'flight-1' } });
    expect(result.results[0].disruption).toBeUndefined();
  });

  it('preserves provider-record ambiguity without selecting a graph target', async () => {
    const adapter = { provider: delayed.provider, capabilities: ['flight_status'], timeoutMs: 100, getDisruptions: vi.fn().mockResolvedValue([{ ...delayed, status: 'ambiguous', timing: {} }]) };
    const result = await ingestDisruptions({ adapter, capability: 'flight_status', query: {}, nodes });
    expect(result.results[0]).toMatchObject({ status: 'ambiguous', reason: 'provider-record-ambiguous' });
    expect(result.results[0].disruption).toBeUndefined();
  });

  it('uniquely matches structured flight identity and produces a validator-approved provider disruption', () => {
    const match = matchDisruptionObservation(delayed, nodes);
    expect(match).toEqual({ status: 'matched', targetNodeId: 'flight-1', matchMethod: 'structured_flight_identity', evidence: ['carrierCode', 'flightNumber', 'originCode', 'destinationCode', 'scheduledDeparture'] });
    const result = normalizeMatchedObservation(delayed, match, graph, { maxObservationAgeMinutes: 60 }, new Date('2026-09-15T09:00:00Z'));
    expect(result).toMatchObject({ status: 'verified', disruption: { type: 'transport_delay', targetNodeId: 'flight-1', delayMinutes: 45, provenance: { source: 'provider', providerName: 'Flight Status Co', referenceId: 'evt-1', observedAt: delayed.observedAt } } });
  });

  it('prefers unmatched to unsafe identity guessing', () => {
    const unrelated = { ...delayed, subject: { ...delayed.subject, flightNumber: '999' } };
    expect(matchDisruptionObservation(unrelated, nodes)).toEqual({ status: 'unmatched', reason: 'no-structured-identity-match' });
    expect(matchDisruptionObservation({ ...delayed, subject: { type: 'flight', carrierCode: 'AI' } }, nodes)).toEqual({ status: 'unmatched', reason: 'insufficient-structured-evidence' });
  });

  it('returns ambiguous candidates without choosing one and ignores confidence as authority', () => {
    const duplicateNodes = [...nodes, { ...nodes[0], nodeId: 'flight-2' }];
    expect(matchDisruptionObservation({ ...delayed, confidence: 1 }, duplicateNodes)).toMatchObject({ status: 'ambiguous', candidateNodeIds: ['flight-1', 'flight-2'] });
  });

  it('normalizes cancellation and activity closure but never unknown status or missing delay timing', () => {
    const match = matchDisruptionObservation(delayed, nodes);
    expect(normalizeMatchedObservation({ ...delayed, status: 'cancelled', timing: undefined }, match, graph)).toMatchObject({ status: 'verified', disruption: { type: 'transport_cancellation' } });
    const activity = { ...delayed, provider: 'Venue Feed', providerEventId: 'close-1', subject: { type: 'activity', externalActivityId: 'venue-9' }, status: 'closed', timing: undefined };
    expect(normalizeMatchedObservation(activity, matchDisruptionObservation(activity, nodes), graph)).toMatchObject({ status: 'verified', disruption: { type: 'activity_closure', targetNodeId: 'museum' } });
    expect(normalizeMatchedObservation({ ...delayed, status: 'diverted' }, match, graph)).toMatchObject({ status: 'unsupported', reason: 'unsupported-status' });
    expect(normalizeMatchedObservation({ ...delayed, timing: undefined }, match, graph)).toMatchObject({ status: 'unsupported', reason: 'missing-delay-timing' });
  });

  it('deduplicates identical states while preserving event evolution', () => {
    const cancelled = { ...delayed, status: 'cancelled', timing: undefined };
    const unique = deduplicateObservations([delayed, structuredClone(delayed), cancelled]);
    expect(unique).toHaveLength(2); expect(unique.map(item => item.status)).toEqual(['delayed', 'cancelled']);
  });

  it('marks stale observations and explicitly represents unknown freshness', () => {
    expect(observationFreshness(delayed, { maxObservationAgeMinutes: 10 }, new Date('2026-09-15T09:00:00Z'))).toMatchObject({ status: 'stale', ageMinutes: 15 });
    expect(normalizeMatchedObservation(delayed, matchDisruptionObservation(delayed, nodes), graph, { maxObservationAgeMinutes: 10 }, new Date('2026-09-15T09:00:00Z'))).toMatchObject({ status: 'stale' });
    expect(observationFreshness({ ...delayed, observedAt: undefined }, { maxObservationAgeMinutes: 10 })).toEqual({ status: 'unknown' });
  });

  it('keeps fixture adapters out of verified ingestion and bounds real adapter calls', async () => {
    const fixture = new FixtureDisruptionProvider({ observations: [delayed] });
    await expect(ingestDisruptions({ adapter: fixture, capability: 'flight_status', nodes, query: {} })).resolves.toEqual({ status: 'provider-unavailable', results: [] });
    const timedOut = { provider: 'Slow', capabilities: ['flight_status'], timeoutMs: 1, getDisruptions: vi.fn(() => new Promise(() => undefined)) };
    await expect(ingestDisruptions({ adapter: timedOut, capability: 'flight_status', nodes, query: {} })).resolves.toEqual({ status: 'provider-unavailable', results: [], reason: 'timeout' });
  });

  it('discovers observations without recovery, itinerary, ledger, or version side effects', async () => {
    const adapter = { provider: delayed.provider, capabilities: ['flight_status'], timeoutMs: 100, getDisruptions: vi.fn().mockResolvedValue([delayed]) };
    const original = structuredClone(nodes);
    const result = await ingestDisruptions({ adapter, capability: 'flight_status', nodes, query: {}, freshnessPolicy: { maxObservationAgeMinutes: 60 }, now: new Date('2026-09-15T09:00:00Z') });
    expect(result).toMatchObject({ status: 'ok', results: [{ status: 'verified' }] });
    expect(nodes).toEqual(original); expect(result).not.toHaveProperty('recovery'); expect(result).not.toHaveProperty('ledger'); expect(result).not.toHaveProperty('version');
  });

  it('rejects provider or capability spoofing before matching', async () => {
    const adapter = { provider: delayed.provider, capabilities: ['flight_status'], timeoutMs: 100, getDisruptions: vi.fn().mockResolvedValue([{ ...delayed, provider: 'Impersonated Provider' }, { ...delayed, kind: 'rail_status' }]) };
    const result = await ingestDisruptions({ adapter, capability: 'flight_status', nodes, query: {} });
    expect(result).toEqual({ status: 'ok', results: [
      { status: 'unsupported', reason: 'invalid-provider-observation', provider: delayed.provider },
      { status: 'unsupported', reason: 'invalid-provider-observation', provider: delayed.provider },
    ] });
  });
});
