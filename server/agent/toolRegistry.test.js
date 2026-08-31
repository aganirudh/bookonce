import { describe, expect, it, vi } from 'vitest';
import { executeTool } from './toolExecutor.js';
import { getRegisteredTool } from './toolRegistry.js';

describe('agent tool registry', () => {
  it('resolves known tools and rejects unknown tools', async () => {
    expect(getRegisteredTool('estimate_route_cost')).toBeDefined();
    expect(getRegisteredTool('book_flight')).toBeUndefined();
    await expect(executeTool('book_flight', {})).resolves.toMatchObject({ success: false, errorCode: 'UNKNOWN_TOOL' });
  });
  it('enforces strict schemas', async () => {
    await expect(executeTool('estimate_route_cost', { mode: 'taxi', distanceMeters: -1 })).resolves.toMatchObject({ success: false, errorCode: 'INVALID_ARGUMENTS' });
    await expect(executeTool('estimate_route_cost', { mode: 'taxi', distanceMeters: 10000, arbitrary: true })).resolves.toMatchObject({ success: false, errorCode: 'INVALID_ARGUMENTS' });
  });
  it('normalizes cost provenance and deterministic optimization', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    await expect(executeTool('estimate_route_cost', { mode: 'taxi', distanceMeters: 10000 })).resolves.toMatchObject({ success: true, data: { estimatedCost: 240, currency: 'INR', source: 'bookonce-estimate', model: 'taxi-distance-v1' } });
    const result = await executeTool('optimize_routes', { candidates: [{ id: 'slow', durationSeconds: 1000 }, { id: 'fast', durationSeconds: 500 }], preferences: { timeWeight: 7, costWeight: 1, walkingWeight: 1, transfersWeight: 1 } });
    expect(result.data.selected.id).toBe('fast');
  });
});
