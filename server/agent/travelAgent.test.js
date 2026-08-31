import { describe, expect, it, vi } from 'vitest';
import { MAX_TOOL_ROUNDS, runTravelAgent } from './travelAgent.js';

const response = ({ calls = [], text = '' }) => ({ response: { functionCalls: () => calls, text: () => text } });
const modelFor = replies => ({ startChat: vi.fn(() => ({ sendMessage: vi.fn().mockImplementation(() => Promise.resolve(replies.shift())) })) });

describe('travel agent loop', () => {
  it('returns a normal final response without tools', async () => {
    await expect(runTravelAgent('hello', { model: modelFor([response({ text: 'Hello' })]), executor: vi.fn() })).resolves.toMatchObject({ success: true, reply: 'Hello', toolTrace: [] });
  });
  it('executes one and multiple sequential calls before the final response', async () => {
    const executor = vi.fn().mockResolvedValue({ success: true, tool: 'geocode_location', data: [{ lat: 1, lng: 2 }] });
    const model = modelFor([response({ calls: [{ name: 'geocode_location', args: { query: 'Pune' } }] }), response({ calls: [{ name: 'geocode_location', args: { query: 'Mumbai' } }] }), response({ text: 'Verified locations.' })]);
    const result = await runTravelAgent('route', { model, executor });
    expect(executor).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ success: true, reply: 'Verified locations.' });
    expect(result.toolTrace).toHaveLength(2);
  });
  it('records unknown, invalid, and failed tools without exposing internal errors', async () => {
    const executor = vi.fn().mockResolvedValue({ success: false, tool: 'secret', errorCode: 'TOOL_UNAVAILABLE', message: 'Unavailable' });
    const result = await runTravelAgent('test', { model: modelFor([response({ calls: [{ name: 'secret', args: {} }] }), response({ text: 'Unavailable.' })]), executor });
    expect(result.toolTrace[0]).toMatchObject({ status: 'failed', label: 'Unsupported action' });
    expect(JSON.stringify(result)).not.toContain('stack');
  });
  it('stops repeated calls at the maximum round limit', async () => {
    const replies = Array.from({ length: MAX_TOOL_ROUNDS }, () => response({ calls: [{ name: 'geocode_location', args: { query: 'Loop' } }] }));
    const result = await runTravelAgent('loop', { model: modelFor(replies), executor: vi.fn().mockResolvedValue({ success: true, tool: 'geocode_location', data: [] }) });
    expect(result).toMatchObject({ success: false, error: 'The travel agent reached its tool limit.' });
  });
});
