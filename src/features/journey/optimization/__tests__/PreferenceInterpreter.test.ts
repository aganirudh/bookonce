import { beforeEach, describe, expect, it, vi } from 'vitest';
import aiClient from '@/services/AIClient';
import { PreferenceInterpreter } from '../PreferenceInterpreter';
import { OPTIMIZATION_PRESETS } from '../presets';

vi.mock('@/services/AIClient', () => ({ default: { interpretOptimizationPreferences: vi.fn() } }));

describe('PreferenceInterpreter', () => {
  const interpreter = new PreferenceInterpreter();
  beforeEach(() => vi.clearAllMocks());

  it.each(['FASTEST', 'CHEAPEST', 'BALANCED', 'COMFORT'] as const)('resolves %s through centralized presets', async preset => {
    vi.mocked(aiClient.interpretOptimizationPreferences).mockResolvedValue({ preset });
    const result = await interpreter.interpret(preset.toLowerCase(), 'leisure');
    expect(result.summary.toUpperCase()).toBe(preset);
    expect(result.preferences.timeWeight / result.preferences.costWeight)
      .toBeCloseTo(OPTIMIZATION_PRESETS[preset].timeWeight / OPTIMIZATION_PRESETS[preset].costWeight);
  });

  it('normalizes custom weights and preserves constraints', async () => {
    vi.mocked(aiClient.interpretOptimizationPreferences).mockResolvedValue({
      preset: null, weights: { timeWeight: 2, costWeight: 8, walkingWeight: 3, transfersWeight: 1 }, constraints: { maxCost: 1000 },
    });
    const result = await interpreter.interpret('cheap and little walking', 'leisure');
    expect(Object.values(result.preferences).reduce((sum, value) => sum + value, 0)).toBeCloseTo(1);
    expect(result.constraints).toEqual({ maxCost: 1000 });
    expect(result.summary).toBe('Cost • Walking');
  });

  it('falls back safely when interpretation fails', async () => {
    vi.mocked(aiClient.interpretOptimizationPreferences).mockRejectedValue(new Error('invalid'));
    const result = await interpreter.interpret('anything', 'urgent');
    expect(result.summary).toBe('Fastest');
    expect(result.source).toBe('fallback');
  });
});
