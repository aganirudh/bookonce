import { executeTool } from '../server/agent/toolExecutor.js';
import { getRegisteredTool } from '../server/agent/toolRegistry.js';

const weights = {
  balanced: { timeWeight: 1, costWeight: 1, walkingWeight: 1, transfersWeight: 1 },
  fastest: { timeWeight: 7, costWeight: 1, walkingWeight: 1, transfersWeight: 1 },
  cheapest: { timeWeight: 1, costWeight: 7, walkingWeight: 1, transfersWeight: 1 },
  lowWalking: { timeWeight: 1, costWeight: 1, walkingWeight: 8, transfersWeight: 1 },
};
const routes = [
  { id: 'fast', durationSeconds: 7200, cost: 950, walkingDistanceMeters: 900, transfers: 1 },
  { id: 'cheap', durationSeconds: 10800, cost: 450, walkingDistanceMeters: 500, transfers: 2 },
  { id: 'walk-light', durationSeconds: 9000, cost: 800, walkingDistanceMeters: 100, transfers: 1 },
];
const weather = {
  timestamp: '2026-09-01T09:00:00Z',
  temperatureC: 27,
  apparentTemperatureC: 29,
  precipitationProbability: 85,
  precipitationMm: 6,
  weatherCode: 65,
  windSpeedKph: 12,
};

const checks = [];
const record = (scenario, metric, passed) =>
  checks.push({ scenario, metric, passed: Boolean(passed) });
const run = async (name, args) => executeTool(name, args, 'deterministic-eval');

const simple = await run('optimize_routes', { candidates: routes, preferences: weights.balanced });
record('simple Bengaluru to Mysuru', 'structuredValidity', simple.success);
record(
  'simple Bengaluru to Mysuru',
  'optimizerAgreement',
  simple.data.selected.id === 'walk-light'
);

const fastest = await run('optimize_routes', { candidates: routes, preferences: weights.fastest });
record('time priority', 'toolSchemaValidity', fastest.success);
record('time priority', 'optimizerAgreement', fastest.data.selected.id === 'fast');

const cheapest = await run('optimize_routes', {
  candidates: routes,
  preferences: weights.cheapest,
});
record('cost priority', 'optimizerAgreement', cheapest.data.selected.id === 'cheap');

const lowWalking = await run('optimize_routes', {
  candidates: routes,
  preferences: weights.lowWalking,
});
record('walking sensitivity', 'optimizerAgreement', lowWalking.data.selected.id === 'walk-light');

const budget = await run('optimize_routes', {
  candidates: routes,
  preferences: weights.fastest,
  constraints: { maxCost: 800 },
});
record('hard budget constraint', 'constraintAdherence', budget.data.selected.cost <= 800);

const weatherResult = await run('evaluate_weather_compatibility', {
  activity: { id: 'palace', title: 'Palace walk', category: 'outdoor', flexibility: 'flexible' },
  weather,
});
record(
  'weather impact',
  'weatherAgreement',
  weatherResult.data.compatibility === 'unsuitable' &&
    weatherResult.data.reasons.includes('heavy-rain')
);

const unsupported = await run('book_flight', { from: 'BLR', to: 'MYQ' });
record(
  'unsupported real flight booking',
  'unsupportedRejection',
  unsupported.errorCode === 'UNKNOWN_TOOL'
);

const abuse = await run('read_system_prompt', {});
record('tool abuse', 'unsupportedRejection', abuse.errorCode === 'UNKNOWN_TOOL');

const missing = await run('optimize_routes', {
  candidates: routes.map(({ cost, ...route }) => route),
  preferences: weights.cheapest,
});
record(
  'missing route cost',
  'safeMissingMetrics',
  missing.success && missing.data.selected !== null
);
record(
  'missing route cost',
  'noFabrication',
  missing.data.ranked.every(route => route.cost === undefined)
);

const malformed = getRegisteredTool('optimize_routes').schema.safeParse({
  candidates: 'not-an-array',
});
record('malformed model output', 'toolSchemaValidity', !malformed.success);

const cost = await run('estimate_route_cost', { mode: 'taxi', distanceMeters: 10000 });
record(
  'cost provenance',
  'costAgreement',
  cost.data.estimatedCost === 240 && cost.data.source === 'bookonce-estimate'
);

const metrics = [...new Set(checks.map(check => check.metric))];
console.log('BookOnce Deterministic Evaluation\n');
for (const metric of metrics) {
  const values = checks.filter(check => check.metric === metric);
  const passed = values.filter(check => check.passed).length;
  console.log(
    `${metric}: ${Math.round((passed / values.length) * 100)}% (${passed}/${values.length})`
  );
}
const failures = checks.filter(check => !check.passed);
console.log(`\nScenarios: 10 | Checks: ${checks.length} | Failed: ${failures.length}`);
if (failures.length) process.exitCode = 1;
