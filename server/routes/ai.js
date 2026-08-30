import { Router } from 'express';
import { ItinerarySchema } from '../../src/features/journey/schemas/aiSchemas.runtime.js';
import { generateGeminiItinerary, generateGeminiReply } from '../services/gemini.js';

const router = Router();
const MAX_MESSAGE_LENGTH = 20_000;

router.post('/chat', async (req, res) => {
  const { message, responseFormat = 'text' } = req.body ?? {};

  if (typeof message !== 'string' || !message.trim() || message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ success: false, error: 'A valid message is required' });
  }

  if (responseFormat !== 'text' && responseFormat !== 'itinerary') {
    return res.status(400).json({ success: false, error: 'Invalid response format' });
  }

  try {
    if (responseFormat === 'itinerary') {
      const rawReply = await generateGeminiItinerary(message.trim());
      let candidate;
      try {
        candidate = JSON.parse(rawReply);
      } catch {
        return res.status(502).json({
          success: false,
          error: 'AI returned an invalid itinerary',
        });
      }

      const parsed = ItinerarySchema.safeParse(candidate);
      if (!parsed.success) {
        return res.status(502).json({
          success: false,
          error: 'AI returned an invalid itinerary',
        });
      }

      return res.json({ success: true, data: parsed.data });
    }

    const reply = await generateGeminiReply(message.trim());
    return res.json({ success: true, reply });
  } catch (error) {
    console.error('AI request failed');
    return res.status(500).json({ success: false, error: 'Unable to process AI request' });
  }
});

export default router;
