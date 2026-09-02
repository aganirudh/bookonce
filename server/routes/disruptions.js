import { Router } from 'express';
import { z } from 'zod';
import { createRateLimiter } from '../middleware/rateLimit.js';
import { DISRUPTION_CAPABILITIES, DisruptionProviderRegistry } from '../disruptions/contracts.js';
import { ingestDisruptions } from '../disruptions/ingestion.js';

const bindingSchema = z.object({ provider: z.string().trim().min(1).max(80), externalId: z.string().trim().min(1).max(160) }).strict();
const flightSchema = z.object({ carrierCode: z.string().trim().min(1).max(8), flightNumber: z.string().trim().min(1).max(12), originCode: z.string().trim().min(2).max(8).optional(), destinationCode: z.string().trim().min(2).max(8).optional(), scheduledDeparture: z.string().datetime({ offset: true, local: true }).optional() }).strict();
const nodeSchema = z.object({
  nodeId: z.string().trim().min(1).max(160), kind: z.enum(['transport', 'activity']),
  externalBindings: z.array(bindingSchema).max(8).optional(), flight: flightSchema.optional(),
  route: z.object({ provider: z.string().trim().min(1).max(80), providerRouteId: z.string().trim().min(1).max(160) }).strict().optional(),
  activity: z.object({ provider: z.string().trim().min(1).max(80), externalActivityId: z.string().trim().min(1).max(160) }).strict().optional(),
}).strict();
const requestSchema = z.object({
  provider: z.string().trim().min(1).max(80), capability: z.enum(DISRUPTION_CAPABILITIES),
  itineraryNodes: z.array(nodeSchema).min(1).max(100),
  query: z.object({ subjects: z.array(z.object({ type: z.enum(['flight', 'rail', 'route', 'activity']), carrierCode: z.string().optional(), flightNumber: z.string().optional(), originCode: z.string().optional(), destinationCode: z.string().optional(), scheduledDeparture: z.string().optional(), providerRouteId: z.string().optional(), externalActivityId: z.string().optional(), externalId: z.string().optional() }).strict()).max(100) }).strict(),
  maxObservationAgeMinutes: z.number().positive().max(10_080).optional(),
}).strict();

export function createDisruptionsRouter({ registry = new DisruptionProviderRegistry(), now } = {}) {
  const router = Router();
  router.use(createRateLimiter({ limit: 10, windowMs: 60_000 }));
  router.get('/providers', (_req, res) => res.json({ success: true, providers: registry.configuredProviders() }));
  router.post('/check', async (req, res) => {
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: 'Invalid disruption check request' });
    const adapter = registry.get(parsed.data.provider);
    const result = await ingestDisruptions({ adapter, capability: parsed.data.capability, query: parsed.data.query, nodes: parsed.data.itineraryNodes, freshnessPolicy: { maxObservationAgeMinutes: parsed.data.maxObservationAgeMinutes }, ...(now ? { now: now() } : {}) });
    if (result.status === 'provider-unavailable') return res.status(503).json({ success: false, status: 'provider-unavailable', reason: result.reason ?? 'not-configured', results: [] });
    return res.json({ success: true, status: 'ok', results: result.results });
  });
  return router;
}

export default createDisruptionsRouter();
