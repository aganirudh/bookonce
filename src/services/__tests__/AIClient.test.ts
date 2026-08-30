import { afterEach, describe, expect, it, vi } from 'vitest';
import { aiClient } from '../AIClient';

describe('AIClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts the message and returns a successful reply', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true, reply: 'Travel reply' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(aiClient.chat('Plan a trip')).resolves.toBe('Travel reply');
    expect(fetchMock).toHaveBeenCalledWith('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Plan a trip' }),
    });
  });

  it('throws the safe API error on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ success: false, error: 'Unable to process AI request' }),
      })
    );

    await expect(aiClient.chat('Plan a trip')).rejects.toThrow('Unable to process AI request');
  });
});
