import { Router } from 'express';
import { z } from 'zod';
import { createRateLimiter } from '../middleware/rateLimit.js';
import { reverseLocation, searchLocations } from '../services/geocoding.js';

const router = Router();
const querySchema = z.string().trim().min(1).max(200);
const coordinateSchema = z.coerce.number().finite();

router.use(createRateLimiter({ limit: 60, windowMs: 60_000 }));

router.get('/search', async (req, res) => {
  const query = querySchema.safeParse(req.query.q);
  if (!query.success) return res.status(400).json({ success: false, error: 'A valid query is required' });
  try {
    return res.json({ success: true, data: await searchLocations(query.data) });
  } catch {
    return res.status(502).json({ success: false, error: 'Unable to geocode location' });
  }
});

router.get('/reverse', async (req, res) => {
  const lat = coordinateSchema.min(-90).max(90).safeParse(req.query.lat);
  const lng = coordinateSchema.min(-180).max(180).safeParse(req.query.lng);
  if (!lat.success || !lng.success) return res.status(400).json({ success: false, error: 'Valid coordinates are required' });
  try {
    return res.json({ success: true, data: await reverseLocation(lat.data, lng.data) });
  } catch {
    return res.status(502).json({ success: false, error: 'Unable to geocode location' });
  }
});

export default router;
