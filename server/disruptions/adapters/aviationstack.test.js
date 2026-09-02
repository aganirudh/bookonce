import { describe, expect, it, vi } from 'vitest';
import { DisruptionStatusCache } from '../cache.js';
import { cancelledFlight, delayedFlight, scheduledFlight } from '../fixtures/aviationstackFlights.js';
import { AviationstackDisruptionAdapter } from './aviationstack.js';

const subject = { type: 'flight', carrierCode: 'AI', flightNumber: '202', originCode: 'BLR', destinationCode: 'DEL', scheduledDeparture: '2026-09-15T09:00:00+05:30' };
const response = (data, status = 200) => ({ ok: status >= 200 && status < 300, status, json: vi.fn().mockResolvedValue(data) });

describe('AviationstackDisruptionAdapter', () => {
  it.each([
    [scheduledFlight, 'on-time', undefined], [delayedFlight, 'delayed', 42], [cancelledFlight, 'cancelled', undefined],
  ])('normalizes documented statuses without raw records', async (record, status, delayMinutes) => {
    const fetchImpl = vi.fn().mockResolvedValue(response({ data: [record] }));
    const [observation] = await new AviationstackDisruptionAdapter({ apiKey: 'test-key', fetchImpl }).getDisruptions({ subjects: [subject] });
    expect(observation).toMatchObject({ provider: 'Aviationstack', kind: 'flight_status', status, subject: { carrierCode: 'AI', flightNumber: '202', originCode: 'BLR', destinationCode: 'DEL' } });
    if (delayMinutes) expect(observation.timing.delayMinutes).toBe(delayMinutes);
    expect(JSON.stringify(observation)).not.toContain('access_key');
    const url = fetchImpl.mock.calls[0][0];
    expect(url.searchParams.get('flight_iata')).toBe('AI202');
    expect(url.searchParams.has('flight_date')).toBe(false);
  });

  it('selects a repeated flight by complete scheduled departure and route', async () => {
    const otherDate = { ...delayedFlight, flight_date: '2026-09-16', departure: { ...delayedFlight.departure, scheduled: '2026-09-16T09:00:00+05:30' } };
    const [result] = await new AviationstackDisruptionAdapter({ apiKey: 'x', fetchImpl: vi.fn().mockResolvedValue(response({ data: [otherDate, delayedFlight] })) }).getDisruptions({ subjects: [subject] });
    expect(result.subject.scheduledDeparture).toBe(subject.scheduledDeparture);
  });

  it('returns ambiguity instead of choosing the first indistinguishable record', async () => {
    const withoutSchedule = { ...subject, scheduledDeparture: undefined };
    const results = await new AviationstackDisruptionAdapter({ apiKey: 'x', fetchImpl: vi.fn().mockResolvedValue(response({ data: [scheduledFlight, delayedFlight] })) }).getDisruptions({ subjects: [withoutSchedule] });
    expect(results).toHaveLength(1); expect(results[0].status).toBe('ambiguous');
  });

  it('filters route and carrier mismatches without fuzzy reconciliation', async () => {
    const wrongRoute = { ...scheduledFlight, arrival: { ...scheduledFlight.arrival, iata: 'BOM' } };
    const operatingMismatch = { ...scheduledFlight, airline: { iata: 'UK', icao: 'VTI' } };
    for (const record of [wrongRoute, operatingMismatch]) {
      const results = await new AviationstackDisruptionAdapter({ apiKey: 'x', fetchImpl: vi.fn().mockResolvedValue(response({ data: [record] })) }).getDisruptions({ subjects: [subject] });
      expect(results).toEqual([]);
    }
  });

  it('does not fabricate a delay from timezone-unsafe times', async () => {
    const record = { ...delayedFlight, departure: { ...delayedFlight.departure, delay: null, scheduled: '2026-09-15T09:00:00', estimated: '2026-09-15T10:00:00' } };
    const localSubject = { ...subject, scheduledDeparture: '2026-09-15T09:00:00' };
    const [result] = await new AviationstackDisruptionAdapter({ apiKey: 'x', fetchImpl: vi.fn().mockResolvedValue(response({ data: [record] })) }).getDisruptions({ subjects: [localSubject] });
    expect(result.status).toBe('on-time'); expect(result.timing.delayMinutes).toBeUndefined();
  });

  it('caches successful identical checks for 90 seconds with identity-sensitive keys', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response({ data: [scheduledFlight] }));
    const adapter = new AviationstackDisruptionAdapter({ apiKey: 'x', fetchImpl, cache: new DisruptionStatusCache({ ttlMs: 90_000 }) });
    await adapter.getDisruptions({ subjects: [subject] }); await adapter.getDisruptions({ subjects: [subject] });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    await adapter.getDisruptions({ subjects: [{ ...subject, scheduledDeparture: '2026-09-16T09:00:00+05:30' }] });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it.each([[401], [429], [500]])('maps HTTP %s to a safe provider error', async status => {
    const adapter = new AviationstackDisruptionAdapter({ apiKey: 'x', fetchImpl: vi.fn().mockResolvedValue(response({}, status)) });
    await expect(adapter.getDisruptions({ subjects: [subject] })).rejects.toThrow('Flight status provider unavailable');
  });

  it('handles timeouts, malformed JSON, application errors, and malformed records safely', async () => {
    const timeout = new AviationstackDisruptionAdapter({ apiKey: 'x', fetchImpl: vi.fn().mockRejectedValue(Object.assign(new Error(), { name: 'TimeoutError' })) });
    await expect(timeout.getDisruptions({ subjects: [subject] })).rejects.toMatchObject({ code: 'PROVIDER_TIMEOUT' });
    const malformedJson = new AviationstackDisruptionAdapter({ apiKey: 'x', fetchImpl: vi.fn().mockResolvedValue({ ok: true, status: 200, json: vi.fn().mockRejectedValue(new Error()) }) });
    await expect(malformedJson.getDisruptions({ subjects: [subject] })).rejects.toThrow('Flight status provider unavailable');
    const appError = new AviationstackDisruptionAdapter({ apiKey: 'x', fetchImpl: vi.fn().mockResolvedValue(response({ error: { code: 'invalid_access_key' } })) });
    await expect(appError.getDisruptions({ subjects: [subject] })).rejects.toThrow('Flight status provider unavailable');
    const invalid = new AviationstackDisruptionAdapter({ apiKey: 'x', fetchImpl: vi.fn().mockResolvedValue(response({ data: [{}] })) });
    await expect(invalid.getDisruptions({ subjects: [subject] })).resolves.toEqual([]);
  });
});
