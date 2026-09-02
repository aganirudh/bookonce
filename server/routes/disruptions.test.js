import express from 'express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DisruptionProviderRegistry, FixtureDisruptionProvider } from '../disruptions/contracts.js';
import { createDisruptionsRouter } from './disruptions.js';

const validBody = {
  provider: 'Status Provider', capability: 'flight_status',
  itineraryNodes: [{ nodeId: 'flight-1', kind: 'transport', flight: { carrierCode: 'AI', flightNumber: '202', originCode: 'BLR', destinationCode: 'DEL', scheduledDeparture: '2026-09-15T09:00:00Z' } }],
  query: { subjects: [{ type: 'flight', carrierCode: 'AI', flightNumber: '202', originCode: 'BLR', destinationCode: 'DEL', scheduledDeparture: '2026-09-15T09:00:00Z' }] }, maxObservationAgeMinutes: 60,
};
const observation = { source: 'external-provider', provider: 'Status Provider', providerEventId: 'evt-1', observedAt: '2026-09-15T08:45:00Z', kind: 'flight_status', subject: validBody.query.subjects[0], status: 'cancelled' };

describe('POST /api/disruptions/check', () => {
  let server; let baseUrl;
  beforeAll(async () => {
    const adapter = { provider: 'Status Provider', capabilities: ['flight_status'], timeoutMs: 100, getDisruptions: async () => [observation] };
    const app = express(); app.use(express.json()); app.use('/api/disruptions', createDisruptionsRouter({ registry: new DisruptionProviderRegistry([adapter]), now: () => new Date('2026-09-15T09:00:00Z') }));
    server = app.listen(0); await new Promise(resolve => server.once('listening', resolve)); baseUrl = `http://127.0.0.1:${server.address().port}`;
  });
  afterAll(async () => { await new Promise(resolve => server.close(resolve)); });

  it('returns only safe normalized matched results', async () => {
    const response = await fetch(`${baseUrl}/api/disruptions/check`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(validBody) });
    expect(response.status).toBe(200); const body = await response.json();
    expect(body).toMatchObject({ success: true, status: 'ok', results: [{ status: 'verified', disruption: { type: 'transport_cancellation', targetNodeId: 'flight-1', provenance: { source: 'provider', providerName: 'Status Provider', referenceId: 'evt-1' } } }] });
    expect(JSON.stringify(body)).not.toContain('rawPayload');
  });

  it('lists only configured real provider capabilities', async () => {
    const response = await fetch(`${baseUrl}/api/disruptions/providers`);
    await expect(response.json()).resolves.toEqual({ success: true, providers: [{ provider: 'Status Provider', capabilities: ['flight_status'] }] });
  });

  it('rejects targetNodeId injection and provider URLs or credentials', async () => {
    for (const addition of [{ targetNodeId: 'flight-1' }, { providerUrl: 'https://evil.test' }, { credential: 'secret' }]) {
      const response = await fetch(`${baseUrl}/api/disruptions/check`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...validBody, ...addition }) });
      expect(response.status).toBe(400);
    }
  });

  it('does not expose fixture adapters as verified providers', async () => {
    const app = express(); app.use(express.json()); app.use('/api/disruptions', createDisruptionsRouter({ registry: new DisruptionProviderRegistry([new FixtureDisruptionProvider({ provider: 'fixture', observations: [observation] })]) }));
    const fixtureServer = app.listen(0); await new Promise(resolve => fixtureServer.once('listening', resolve));
    const response = await fetch(`http://127.0.0.1:${fixtureServer.address().port}/api/disruptions/check`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...validBody, provider: 'fixture' }) });
    expect(response.status).toBe(503); await expect(response.json()).resolves.toMatchObject({ success: false, status: 'provider-unavailable' });
    await new Promise(resolve => fixtureServer.close(resolve));
  });
});
