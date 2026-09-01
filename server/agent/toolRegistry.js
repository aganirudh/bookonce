import { toolSchemas } from './toolSchemas.js';

const labels = {
  geocode_location: 'Found locations',
  get_route_options: 'Checked route options',
  get_weather_forecast: 'Checked weather',
  interpret_route_preferences: 'Understood route preferences',
  optimize_routes: 'Compared routes',
  estimate_route_cost: 'Estimated route cost',
  evaluate_weather_compatibility: 'Checked activity weather fit',
  propose_weather_replan: 'Prepared a weather replan',
};
export const TOOL_NAMES = Object.freeze(Object.keys(toolSchemas));
export function getRegisteredTool(name) {
  return Object.prototype.hasOwnProperty.call(toolSchemas, name)
    ? { name, schema: toolSchemas[name], label: labels[name] }
    : undefined;
}

const number = { type: 'number' };
const point = {
  type: 'object',
  properties: { lat: number, lng: number },
  required: ['lat', 'lng'],
};
const weightProperties = {
  timeWeight: number,
  costWeight: number,
  walkingWeight: number,
  transfersWeight: number,
  comfortWeight: number,
};
const parameters = {
  geocode_location: {
    type: 'object',
    properties: { query: { type: 'string' } },
    required: ['query'],
  },
  get_route_options: {
    type: 'object',
    properties: {
      start: point,
      end: point,
      mode: { type: 'string', enum: ['walk', 'drive', 'bike'] },
      maxAlternatives: { type: 'integer' },
    },
    required: ['start', 'end', 'mode', 'maxAlternatives'],
  },
  get_weather_forecast: {
    type: 'object',
    properties: {
      lat: number,
      lng: number,
      startDate: { type: 'string' },
      endDate: { type: 'string' },
    },
    required: ['lat', 'lng', 'startDate', 'endDate'],
  },
  interpret_route_preferences: {
    type: 'object',
    properties: {
      preset: { type: 'string', enum: ['FASTEST', 'CHEAPEST', 'BALANCED', 'COMFORT'] },
      weights: { type: 'object', properties: weightProperties },
      constraints: {
        type: 'object',
        properties: {
          maxCost: number,
          maxDurationSeconds: number,
          maxWalkingDistanceMeters: number,
          maxTransfers: { type: 'integer' },
        },
      },
    },
  },
  optimize_routes: {
    type: 'object',
    properties: {
      candidates: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            durationSeconds: number,
            distanceMeters: number,
            cost: number,
            walkingDistanceMeters: number,
            transfers: { type: 'integer' },
          },
          required: ['id', 'durationSeconds'],
        },
      },
      preferences: {
        type: 'object',
        properties: weightProperties,
        required: ['timeWeight', 'costWeight', 'walkingWeight', 'transfersWeight'],
      },
      constraints: {
        type: 'object',
        properties: {
          maxCost: number,
          maxDurationSeconds: number,
          maxWalkingDistanceMeters: number,
          maxTransfers: { type: 'integer' },
        },
      },
    },
    required: ['candidates', 'preferences'],
  },
  estimate_route_cost: {
    type: 'object',
    properties: {
      mode: { type: 'string', enum: ['walk', 'car', 'taxi', 'auto', 'rapido'] },
      distanceMeters: number,
      durationSeconds: number,
    },
    required: ['mode', 'distanceMeters'],
  },
  evaluate_weather_compatibility: {
    type: 'object',
    properties: { activity: { type: 'object' }, weather: { type: 'object' } },
    required: ['activity'],
  },
  propose_weather_replan: {
    type: 'object',
    properties: {
      activities: { type: 'array', items: { type: 'object' } },
      compatibilityResults: { type: 'array', items: { type: 'object' } },
    },
    required: ['activities', 'compatibilityResults'],
  },
};
export const geminiTools = [
  {
    functionDeclarations: TOOL_NAMES.map(name => ({
      name,
      description: labels[name],
      parameters: parameters[name],
    })),
  },
];
