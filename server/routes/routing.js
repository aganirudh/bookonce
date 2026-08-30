import { Router } from 'express';
import { z } from 'zod';
import { createRateLimiter } from '../middleware/rateLimit.js';
import { getRoute, getRoutes } from '../services/routing.js';

const router = Router();
const pointSchema = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) });
const requestSchema = z.object({ start: pointSchema, end: pointSchema, mode: z.enum(['walk', 'drive', 'bike']) });
const alternativesRequestSchema = requestSchema.extend({
  maxAlternatives: z.number().int().min(1).max(3).default(3),
});

router.use(createRateLimiter({ limit: 60, windowMs: 60_000 }));

router.post('/route', async (req, res) => {
  const request = requestSchema.safeParse(req.body);
  if (!request.success) return res.status(400).json({ success: false, error: 'Invalid routing request' });
  try {
    return res.json({ success: true, data: await getRoute(request.data.start, request.data.end, request.data.mode) });
  } catch (error) {
    if (error?.code === 'UNSUPPORTED_MODE') {
      return res.status(422).json({ success: false, error: 'Routing mode is unavailable' });
    }
    return res.status(502).json({ success: false, error: 'Unable to calculate route' });
  }
});

router.post('/routes', async (req, res) => {
  const request = alternativesRequestSchema.safeParse(req.body);
  if (!request.success) return res.status(400).json({ success: false, error: 'Invalid routing request' });
  try {
    return res.json({
      success: true,
      data: await getRoutes(
        request.data.start,
        request.data.end,
        request.data.mode,
        request.data.maxAlternatives
      ),
    });
  } catch (error) {
    if (error?.code === 'UNSUPPORTED_MODE') {
      return res.status(422).json({ success: false, error: 'Routing mode is unavailable' });
    }
    return res.status(502).json({ success: false, error: 'Unable to calculate routes' });
  }
});

export default router;
