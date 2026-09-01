import { describe, expect, it, vi } from 'vitest';
import { runTravelAgent } from './travelAgent.js';

const response = ({ calls = [], text = '' }) => ({
  response: { functionCalls: () => calls, text: () => text },
});

describe('showcase mocked travel-agent flow', () => {
  it('keeps route and weather authority in deterministic tool results', async () => {
    const calls = [
      ['geocode_location', { query: 'Bengaluru' }],
      ['geocode_location', { query: 'Mysuru' }],
      [
        'get_route_options',
        {
          start: { lat: 12.97, lng: 77.59 },
          end: { lat: 12.3, lng: 76.65 },
          mode: 'drive',
          maxAlternatives: 3,
        },
      ],
      [
        'optimize_routes',
        {
          candidates: [
            { id: 'fast', durationSeconds: 7200, cost: 900 },
            { id: 'slow', durationSeconds: 9000, cost: 700 },
          ],
          preferences: { timeWeight: 7, costWeight: 1, walkingWeight: 1, transfersWeight: 1 },
        },
      ],
      [
        'get_weather_forecast',
        { lat: 12.3, lng: 76.65, startDate: '2026-09-01', endDate: '2026-09-01' },
      ],
      [
        'evaluate_weather_compatibility',
        {
          activity: {
            id: 'trip',
            title: 'Mysuru trip',
            category: 'outdoor',
            flexibility: 'flexible',
          },
        },
      ],
    ];
    const replies = [
      response({ calls: calls.slice(0, 2).map(([name, args]) => ({ name, args })) }),
      ...calls.slice(2).map(([name, args]) => response({ calls: [{ name, args }] })),
    ];
    replies.push(response({ text: 'Take slow; the temperature is 40C.' }));
    const fixtures = {
      geocode_location: [{ lat: 12.97, lng: 77.59 }],
      get_route_options: [
        { id: 'fast', durationSeconds: 7200 },
        { id: 'slow', durationSeconds: 9000 },
      ],
      optimize_routes: { selected: { id: 'fast', durationSeconds: 7200 }, ranked: [] },
      get_weather_forecast: [{ temperatureC: 27, precipitationProbability: 80 }],
      evaluate_weather_compatibility: {
        activityId: 'trip',
        compatibility: 'caution',
        reasons: ['rain-likely'],
      },
    };
    const executor = vi.fn(name =>
      Promise.resolve({ success: true, tool: name, data: fixtures[name] })
    );
    const model = {
      startChat: () => ({ sendMessage: vi.fn(() => Promise.resolve(replies.shift())) }),
    };
    const result = await runTravelAgent(
      'I need to go from Bengaluru to Mysuru tomorrow. I want the fastest option and check if the weather will affect my trip.',
      { model, executor }
    );

    expect(result.toolTrace.map(item => item.tool)).toEqual(calls.map(([name]) => name));
    expect(result.data.optimize_routes.selected.id).toBe('fast');
    expect(result.data.get_weather_forecast[0].temperatureC).toBe(27);
    expect(result.data.evaluate_weather_compatibility.compatibility).toBe('caution');
    expect(result.reply).toContain('slow');
    expect(result.data.optimize_routes.selected.id).not.toBe('slow');
  });
});
