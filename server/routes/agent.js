import { Router } from 'express';
import { z } from 'zod';
import { createRateLimiter } from '../middleware/rateLimit.js';
import { runTravelAgent } from '../agent/travelAgent.js';
import { getGeminiModel } from '../services/gemini.js';

const router = Router();
router.use(createRateLimiter({ limit: 10, windowMs: 60_000 }));
const requestSchema = z.object({ message: z.string().trim().min(1).max(10_000), context: z.object({ itineraryId: z.string().max(100).optional(), locale: z.string().max(20).optional() }).strict().optional() }).strict();

router.post('/', async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: 'A valid agent request is required' });
  try {
    const result = await runTravelAgent(parsed.data.message, { model: getGeminiModel() });
    return res.status(result.success ? 200 : 502).json(result);
  } catch {
    return res.status(500).json({ success: false, error: 'Unable to run the travel agent' });
  }
});
export default router;
