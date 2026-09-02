import { Router } from 'express';
import { z } from 'zod';
import { FlightSearchCache } from '../flights/cache.js';
import { createFlightProvider } from '../flights/registry.js';
import { createRateLimiter } from '../middleware/rateLimit.js';

const identifier = z.string().trim().min(2).max(80).regex(/^[A-Za-z0-9_-]+$/);
export const flightSearchSchema = z.object({
  origin: identifier,
  destination: identifier,
  departureDate: z.string().date(),
  adults: z.number().int().min(1).max(9),
  children: z.number().int().min(0).max(8).default(0),
  infants: z.number().int().min(0).max(8).default(0),
  cabinClass: z.enum(['economy', 'premium_economy', 'business', 'first']).default('economy'),
  currency: z.string().trim().regex(/^[A-Z]{3}$/).default('INR'),
  market: z.string().trim().regex(/^[A-Z]{2}$/).default('IN'),
  locale: z.string().trim().regex(/^[a-z]{2}-[A-Z]{2}$/).default('en-IN'),
}).strict().superRefine((value, context) => {
  if (value.infants > value.adults) context.addIssue({ code: 'custom', path: ['infants'], message: 'Infants cannot exceed adults' });
});

function safeProviderError(error) {
  if (error?.code === 'NOT_CONFIGURED') return { status: 503, code: 'PROVIDER_NOT_CONFIGURED' };
  if (error?.code === 'AUTHENTICATION_FAILED') return { status: 503, code: 'PROVIDER_AUTHENTICATION_FAILED' };
  if (error?.code === 'QUOTA_EXCEEDED') return { status: 503, code: 'PROVIDER_QUOTA_EXCEEDED' };
  if (error?.code === 'TIMEOUT') return { status: 504, code: 'PROVIDER_TIMEOUT' };
  if (error?.code === 'UNSUPPORTED_PASSENGER_COMPOSITION') return { status: 422, code: 'UNSUPPORTED_PASSENGER_COMPOSITION' };
  return { status: 502, code: 'PROVIDER_UNAVAILABLE' };
}

export function createFlightsRouter({ provider = createFlightProvider(), cache = new FlightSearchCache() } = {}) {
  const router = Router();
  router.use(createRateLimiter({ limit: 15, windowMs: 60_000 }));
  router.post('/search', async (req, res) => {
    const parsed = flightSearchSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: 'Invalid flight search request' });
    const cached = cache.get(parsed.data);
    if (cached) return res.json({ success: true, candidates: cached, cached: true });
    try {
      const candidates = await provider.search(parsed.data);
      cache.set(parsed.data, candidates);
      return res.json({ success: true, candidates, cached: false });
    } catch (error) {
      const safe = safeProviderError(error);
      return res.status(safe.status).json({ success: false, error: safe.code });
    }
  });
  return router;
}

export default createFlightsRouter();
