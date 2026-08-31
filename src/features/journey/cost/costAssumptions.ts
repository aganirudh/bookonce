export const COST_CURRENCY = 'INR' as const;
export const COST_ROUNDING_RUPEES = 5;

// Heuristic BookOnce demo assumptions, not provider rates or live pricing.
export const COST_ASSUMPTIONS = {
  car: { fuelEfficiencyKmPerLitre: 14, fuelPricePerLitre: 105, wearCostPerKm: 2 },
  taxi: { baseFare: 80, perKmRate: 16 },
  auto: { baseFare: 35, perKmRate: 12 },
  rapido: { baseFare: 25, perKmRate: 9 },
} as const;
