import { ItinerarySchema, type Itinerary } from '@/features/journey/schemas/aiSchemas';
import { PreferenceExtractionSchema, type PreferenceExtraction } from '@/features/journey/optimization/preferenceSchema';

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
  async runAgent(message: string, context?: { itineraryId?: string; locale?: string }) {
    const response = await fetch('/api/ai/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, ...(context ? { context } : {}) }) });
    let payload: { success: boolean; reply?: string; toolTrace?: Array<{ tool: string; label: string; status: 'success' | 'failed' }>; data?: Record<string, unknown>; error?: string };
    try { payload = await response.json(); } catch { throw new Error('Malformed agent response'); }
    if (!response.ok || !payload.success || typeof payload.reply !== 'string') throw new Error(payload.error || 'Unable to run travel agent');
    return { reply: payload.reply, toolTrace: payload.toolTrace ?? [], data: payload.data ?? {} };
  }

  async interpretOptimizationPreferences(text: string): Promise<PreferenceExtraction> {
    const response = await fetch('/api/ai/preferences', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }),
    });
    let payload: AIItineraryResponse;
    try { payload = (await response.json()) as AIItineraryResponse; } catch { throw new Error('Malformed AI response'); }
    if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to interpret route preferences');
    const parsed = PreferenceExtractionSchema.safeParse(payload.data);
    if (!parsed.success) throw new Error('AI returned invalid route preferences');
    return parsed.data;
  }

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
