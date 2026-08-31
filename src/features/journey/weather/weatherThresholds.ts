// BookOnce planning heuristics only; these are not safety guidance.
export const WEATHER_THRESHOLDS = {
  moderatePrecipitationProbability: 50,
  highPrecipitationProbability: 75,
  heavyPrecipitationMm: 4,
  highTemperatureC: 35,
  veryHighTemperatureC: 40,
  highWindKph: 40,
} as const;
