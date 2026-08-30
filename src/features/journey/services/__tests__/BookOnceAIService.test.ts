import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aiClient } from '@/services/AIClient';
import { bookOnceAIService } from '../BookOnceAIService';

vi.mock('@/services/AIClient', () => ({ aiClient: { chat: vi.fn(), planItinerary: vi.fn() } }));

describe('BookOnceAIService.generateItinerary', () => {
  beforeEach(() => vi.clearAllMocks());

  it('validates the request and returns the typed itinerary from AIClient', async () => {
    const itinerary = { origin: { name: 'Bengaluru' }, destination: { name: 'Mysuru' }, segments: [], summary: 'A proposed journey.' };
    vi.mocked(aiClient.planItinerary).mockResolvedValue(itinerary);
    await expect(bookOnceAIService.generateItinerary({ origin: { name: 'Bengaluru' }, destination: { name: 'Mysuru' }, departureDate: '2026-09-15', travelers: 2, travelStyle: 'leisure' })).resolves.toEqual(itinerary);
    expect(aiClient.planItinerary).toHaveBeenCalledWith(expect.stringContaining('Bengaluru'));
  });

  it('rejects an invalid request before calling the API', async () => {
    await expect(bookOnceAIService.generateItinerary({ origin: { name: '' }, destination: { name: 'Mysuru' }, departureDate: 'not-a-date', travelers: 0, travelStyle: 'leisure' })).rejects.toThrow();
    expect(aiClient.planItinerary).not.toHaveBeenCalled();
  });
});
