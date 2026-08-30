interface AIChatResponse {
  success: boolean;
  reply?: string;
  error?: string;
}

class AIClient {
  async chat(message: string): Promise<string> {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    const payload = (await response.json()) as AIChatResponse;

    if (!response.ok || !payload.success || typeof payload.reply !== 'string') {
      throw new Error(payload.error || 'Unable to process AI request');
    }

    return payload.reply;
  }
}

export const aiClient = new AIClient();
export default aiClient;
