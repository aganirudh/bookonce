import { ItinerarySchema, type Itinerary } from '@/features/journey/schemas/aiSchemas';

interface AIChatResponse {
  success: boolean;
  reply?: string;
  error?: string;
}

interface AIItineraryResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

class AIClient {
  async chat(message: string): Promise<string> {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    let payload: AIChatResponse;
    try {
      payload = (await response.json()) as AIChatResponse;
    } catch {
      throw new Error('Malformed AI response');
    }

    if (!response.ok || !payload.success || typeof payload.reply !== 'string') {
      throw new Error(payload.error || 'Unable to process AI request');
    }

    return payload.reply;
  }

  async planItinerary(message: string): Promise<Itinerary> {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, responseFormat: 'itinerary' }),
    });

    let payload: AIItineraryResponse;
    try {
      payload = (await response.json()) as AIItineraryResponse;
    } catch {
      throw new Error('Malformed AI response');
    }
    if (!response.ok || !payload.success) {
      throw new Error(payload.error || 'Unable to process AI request');
    }

    const parsed = ItinerarySchema.safeParse(payload.data);
    if (!parsed.success) {
      throw new Error('AI returned an invalid itinerary');
    }

    return parsed.data;
  }
}

export const aiClient = new AIClient();
export default aiClient;
