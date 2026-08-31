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

  it('requests and validates a structured itinerary', async () => {
    const data = { origin: { name: 'Pune' }, destination: { name: 'Mumbai' }, segments: [], summary: 'A proposed journey.' };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ success: true, data }) });
    vi.stubGlobal('fetch', fetchMock);
    await expect(aiClient.planItinerary('Plan it')).resolves.toEqual(data);
    expect(fetchMock).toHaveBeenCalledWith('/api/ai/chat', expect.objectContaining({ body: JSON.stringify({ message: 'Plan it', responseFormat: 'itinerary' }) }));
  });

  it('rejects a malformed structured response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ success: true, data: { summary: 'missing fields' } }) }));
    await expect(aiClient.planItinerary('Plan it')).rejects.toThrow('AI returned an invalid itinerary');
  });

  it('rejects non-JSON API responses safely', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockRejectedValue(new SyntaxError('private response')) }));
    await expect(aiClient.chat('Plan it')).rejects.toThrow('Malformed AI response');
  });

  it('requests and independently validates route preferences', async () => {
    const data = { preset: 'FASTEST' };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ success: true, data }) });
    vi.stubGlobal('fetch', fetchMock);
    await expect(aiClient.interpretOptimizationPreferences('fastest')).resolves.toEqual(data);
    expect(fetchMock).toHaveBeenCalledWith('/api/ai/preferences', expect.objectContaining({ body: JSON.stringify({ text: 'fastest' }) }));
  });

  it('rejects preference responses containing route decisions', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ success: true, data: { preset: 'FASTEST', routeId: 'fake' } }) }));
    await expect(aiClient.interpretOptimizationPreferences('fastest')).rejects.toThrow('invalid route preferences');
  });

  it('runs the travel agent without exposing function-call protocol details', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({ success: true, reply: 'Verified route.', toolTrace: [{ tool: 'get_route_options', label: 'Checked route options', status: 'success' }], data: { optimize_routes: { selected: { id: 'fast' } } } }) });
    vi.stubGlobal('fetch', fetchMock);
    await expect(aiClient.runAgent('Fastest route')).resolves.toMatchObject({ reply: 'Verified route.', toolTrace: [{ label: 'Checked route options' }] });
    expect(fetchMock).toHaveBeenCalledWith('/api/ai/agent', expect.objectContaining({ body: JSON.stringify({ message: 'Fastest route' }) }));
  });
});
