import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/gemini.js', () => ({
  generateGeminiReply: vi.fn(),
  generateGeminiItinerary: vi.fn(),
  generateGeminiPreferences: vi.fn(),
}));

import { app } from '../../server.js';
import { generateGeminiItinerary, generateGeminiPreferences, generateGeminiReply } from '../services/gemini.js';

const validItinerary = {
  origin: { name: 'Pune' },
  destination: { name: 'Mumbai' },
  segments: [],
  summary: 'A proposed journey.',
};

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

  it('returns validated structured itinerary data', async () => {
    vi.mocked(generateGeminiItinerary).mockResolvedValue(JSON.stringify(validItinerary));
    const response = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Plan a trip', responseFormat: 'itinerary' }),
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, data: validItinerary });
  });

  it('rejects malformed Gemini JSON without exposing it', async () => {
    vi.mocked(generateGeminiItinerary).mockResolvedValue('{secret malformed');
    const response = await fetch(`${baseUrl}/api/ai/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Plan', responseFormat: 'itinerary' }) });
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body).toEqual({ success: false, error: 'AI returned an invalid itinerary' });
    expect(JSON.stringify(body)).not.toContain('secret');
  });

  it('rejects an invalid itinerary shape', async () => {
    vi.mocked(generateGeminiItinerary).mockResolvedValue(JSON.stringify({ summary: 'missing fields' }));
    const response = await fetch(`${baseUrl}/api/ai/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Plan', responseFormat: 'itinerary' }) });
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ success: false, error: 'AI returned an invalid itinerary' });
  });

  it('returns a safe 5xx when structured Gemini generation fails', async () => {
    vi.mocked(generateGeminiItinerary).mockRejectedValue(new Error('provider secret exception'));
    const response = await fetch(`${baseUrl}/api/ai/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Plan', responseFormat: 'itinerary' }) });
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ success: false, error: 'Unable to process AI request' });
    expect(JSON.stringify(body)).not.toContain('provider secret');
  });
});

describe('POST /api/ai/preferences', () => {
  let server;
  let baseUrl;
  beforeAll(async () => {
    server = app.listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });
  afterAll(async () => { await new Promise(resolve => server.close(resolve)); });
  beforeEach(() => vi.clearAllMocks());

  it('returns only validated structured preferences', async () => {
    vi.mocked(generateGeminiPreferences).mockResolvedValue(JSON.stringify({ preset: 'CHEAPEST', constraints: { maxCost: 500 } }));
    const response = await fetch(`${baseUrl}/api/ai/preferences`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'under 500 and cheapest' }) });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, data: { preset: 'CHEAPEST', constraints: { maxCost: 500 } } });
  });

  it('rejects malformed or structurally unsupported provider output safely', async () => {
    vi.mocked(generateGeminiPreferences).mockResolvedValue(JSON.stringify({ preset: 'FASTEST', selectedRouteId: 'fake' }));
    const response = await fetch(`${baseUrl}/api/ai/preferences`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'fastest' }) });
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ success: false, error: 'Unable to interpret route preferences' });
  });
});
