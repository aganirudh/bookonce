import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/gemini.js', () => ({
  generateGeminiReply: vi.fn(),
}));

import { app } from '../../server.js';
import { generateGeminiReply } from '../services/gemini.js';

describe('POST /api/ai/chat', () => {
  let server;
  let baseUrl;

  beforeAll(async () => {
    server = app.listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  afterAll(async () => {
    await new Promise(resolve => server.close(resolve));
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the service reply for a valid request', async () => {
    vi.mocked(generateGeminiReply).mockResolvedValue('Travel reply');

    const response = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Plan a short trip' }),
    });

    expect(generateGeminiReply).toHaveBeenCalledWith('Plan a short trip');
    await expect(response.json()).resolves.toEqual({ success: true, reply: 'Travel reply' });
  });

  it('rejects a missing or invalid message', async () => {
    const response = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '   ' }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'A valid message is required',
    });
    expect(generateGeminiReply).not.toHaveBeenCalled();
  });

  it('returns a safe error when Gemini fails', async () => {
    vi.mocked(generateGeminiReply).mockRejectedValue(new Error('provider details'));

    const response = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Plan a short trip' }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: 'Unable to process AI request',
    });
  });
});
