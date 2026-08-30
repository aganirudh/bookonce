import { Router } from 'express';
import { generateGeminiReply } from '../services/gemini.js';

const router = Router();
const MAX_MESSAGE_LENGTH = 20_000;

router.post('/chat', async (req, res) => {
  const { message } = req.body ?? {};

  if (typeof message !== 'string' || !message.trim() || message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ success: false, error: 'A valid message is required' });
  }

  try {
    const reply = await generateGeminiReply(message.trim());
    return res.json({ success: true, reply });
  } catch (error) {
    console.error('AI request failed');
    return res.status(500).json({ success: false, error: 'Unable to process AI request' });
  }
});

export default router;
