import { createHash } from 'node:crypto';
import { DisruptionStatusCache } from '../cache.js';

const PROVIDER = 'Aviationstack';
const BASE_URL = 'https://api.aviationstack.com/v1/flights';
const hasOffset = value => typeof value === 'string' && /(Z|[+-]\d\d:\d\d)$/.test(value);
const upper = value => typeof value === 'string' ? value.trim().toUpperCase() : undefined;
const text = value => typeof value === 'string' && value.trim() ? value.trim() : undefined;

export class AviationstackProviderError extends Error {
  constructor(code) { super('Flight status provider unavailable'); this.code = code; }
}

function sameScheduledTime(expected, actual) {
  if (!expected) return true;
  if (!actual) return false;
  if (hasOffset(expected) && hasOffset(actual)) return Date.parse(expected) === Date.parse(actual);
  // A timezone is never invented. When one side is local provider time, compare
  // the complete local calendar timestamp rather than only a clock or date.
  return expected.slice(0, 19) === actual.slice(0, 19);
}

function recordMatches(record, subject) {
  const carrier = upper(record?.airline?.iata) ?? upper(record?.flight?.iata)?.match(/^[A-Z0-9]{2,3}/)?.[0];
  return carrier === upper(subject.carrierCode)
    && upper(record?.flight?.number) === upper(subject.flightNumber)
    && (!subject.originCode || upper(record?.departure?.iata) === upper(subject.originCode))
    && (!subject.destinationCode || upper(record?.arrival?.iata) === upper(subject.destinationCode))
    && sameScheduledTime(subject.scheduledDeparture, record?.departure?.scheduled);
}

function deterministicId(subject, record, status) {
  const facts = [PROVIDER, subject.carrierCode, subject.flightNumber, record?.departure?.scheduled,
    record?.departure?.iata, record?.arrival?.iata, status].join('|');
  return `aviationstack-${createHash('sha256').update(facts).digest('hex').slice(0, 24)}`;
}

function safeDelayMinutes(record) {
  const direct = record?.departure?.delay;
  if (Number.isFinite(direct) && direct > 0) return direct;
  const scheduled = record?.departure?.scheduled;
  const comparison = record?.departure?.estimated ?? record?.departure?.actual;
  if (!hasOffset(scheduled) || !hasOffset(comparison)) return undefined;
  const difference = Math.round((Date.parse(comparison) - Date.parse(scheduled)) / 60_000);
  return Number.isFinite(difference) && difference > 0 ? difference : undefined;
}

function normalizeRecord(record, requestedSubject) {
  const providerStatus = text(record?.flight_status)?.toLowerCase();
  const carrierCode = upper(record?.airline?.iata);
  const flightNumber = upper(record?.flight?.number);
  const scheduledDeparture = text(record?.departure?.scheduled);
  if (!providerStatus || !carrierCode || !flightNumber || !scheduledDeparture) return undefined;
  const delayMinutes = safeDelayMinutes(record);
  let status;
  if (providerStatus === 'cancelled') status = 'cancelled';
  else if (['scheduled', 'active'].includes(providerStatus) && delayMinutes) status = 'delayed';
  else if (['scheduled', 'active', 'landed'].includes(providerStatus)) status = 'on-time';
  else status = 'unsupported';
  const subject = {
    type: 'flight', carrierCode, flightNumber,
    ...(text(record?.departure?.iata) ? { originCode: upper(record.departure.iata) } : {}),
    ...(text(record?.arrival?.iata) ? { destinationCode: upper(record.arrival.iata) } : {}),
    scheduledDeparture,
  };
  const timing = {
    scheduledDeparture,
    ...(text(record?.departure?.estimated) ? { estimatedDeparture: record.departure.estimated } : {}),
    ...(text(record?.departure?.actual) ? { actualDeparture: record.departure.actual } : {}),
    ...(text(record?.arrival?.scheduled) ? { scheduledArrival: record.arrival.scheduled } : {}),
    ...(text(record?.arrival?.estimated) ? { estimatedArrival: record.arrival.estimated } : {}),
    ...(text(record?.arrival?.actual) ? { actualArrival: record.arrival.actual } : {}),
    ...(delayMinutes ? { delayMinutes } : {}),
  };
  return {
    source: 'external-provider', provider: PROVIDER, kind: 'flight_status', subject, status, timing,
    providerEventId: deterministicId(requestedSubject, record, status),
    ...(text(record?.live?.updated) ? { observedAt: record.live.updated } : {}),
    metadata: { providerStatus },
  };
}

export class AviationstackDisruptionAdapter {
  constructor({ apiKey = process.env.AVIATIONSTACK_API_KEY, fetchImpl = fetch, timeoutMs = 7_000, cache = new DisruptionStatusCache() } = {}) {
    this.provider = PROVIDER; this.capabilities = Object.freeze(['flight_status']);
    this.apiKey = apiKey?.trim(); this.fetchImpl = fetchImpl; this.timeoutMs = timeoutMs; this.cache = cache;
  }

  async lookup(subject) {
    const cached = this.cache.get(subject); if (cached) return cached;
    const url = new URL(BASE_URL);
    url.searchParams.set('access_key', this.apiKey);
    url.searchParams.set('flight_iata', `${upper(subject.carrierCode)}${upper(subject.flightNumber)}`);
    // The normal status path is the all-plans real-time endpoint. Adding
    // flight_date changes Aviationstack entitlement to historical lookup.
    // Scheduled identity is therefore applied only to the returned records.
    let response;
    try {
      response = await this.fetchImpl(url, { signal: AbortSignal.timeout(this.timeoutMs) });
    } catch (error) {
      throw new AviationstackProviderError(['AbortError', 'TimeoutError'].includes(error?.name) ? 'PROVIDER_TIMEOUT' : 'PROVIDER_ERROR');
    }
    if (response.status === 401 || response.status === 403) throw new AviationstackProviderError('PROVIDER_AUTH');
    if (response.status === 429) throw new AviationstackProviderError('PROVIDER_QUOTA');
    if (!response.ok) throw new AviationstackProviderError('PROVIDER_ERROR');
    let payload; try { payload = await response.json(); } catch { throw new AviationstackProviderError('PROVIDER_ERROR'); }
    if (payload?.error || !Array.isArray(payload?.data)) throw new AviationstackProviderError('PROVIDER_ERROR');
    const matches = payload.data.filter(record => recordMatches(record, subject));
    let observations;
    if (matches.length > 1) observations = [{ source: 'external-provider', provider: PROVIDER, kind: 'flight_status', subject: { type: 'flight', ...subject }, status: 'ambiguous', providerEventId: deterministicId(subject, {}, 'ambiguous') }];
    else observations = matches.map(record => normalizeRecord(record, subject)).filter(Boolean);
    this.cache.set(subject, observations);
    return observations;
  }

  async getDisruptions(query) {
    if (!this.apiKey) throw new AviationstackProviderError('NOT_CONFIGURED');
    const subjects = query?.subjects?.filter(subject => subject?.type === 'flight' && subject.carrierCode && subject.flightNumber) ?? [];
    const results = [];
    for (const subject of subjects) results.push(...await this.lookup(subject));
    return results;
  }
}

export function createAviationstackAdapter(options) {
  const adapter = new AviationstackDisruptionAdapter(options);
  return adapter.apiKey ? adapter : undefined;
}
