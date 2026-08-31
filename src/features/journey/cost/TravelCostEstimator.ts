import { COST_ASSUMPTIONS, COST_CURRENCY, COST_ROUNDING_RUPEES } from './costAssumptions';
import type { CostEstimateMode, TravelCostEstimate } from './types';

function roundCost(value: number): number {
  return Math.round(value / COST_ROUNDING_RUPEES) * COST_ROUNDING_RUPEES;
}

/** Pure heuristic monetary transport estimate. It never represents a live/provider fare. */
export function estimateTravelCost(
  mode: CostEstimateMode | string,
  distanceMeters: number,
  durationSeconds?: number
): TravelCostEstimate | undefined {
  if (!Number.isFinite(distanceMeters) || distanceMeters < 0) return undefined;
  if (durationSeconds !== undefined && (!Number.isFinite(durationSeconds) || durationSeconds < 0)) return undefined;
  const distanceKm = distanceMeters / 1000;
  const common = { currency: COST_CURRENCY, source: 'bookonce-estimate' as const };

  if (mode === 'walk') return { ...common, estimatedCost: 0, model: 'walking-monetary-v1', breakdown: { monetaryTransportCost: 0 } };
  if (mode === 'car') {
    const assumption = COST_ASSUMPTIONS.car;
    const fuelCost = distanceKm / assumption.fuelEfficiencyKmPerLitre * assumption.fuelPricePerLitre;
    const wearCost = distanceKm * assumption.wearCostPerKm;
    return { ...common, estimatedCost: roundCost(fuelCost + wearCost), model: 'private-car-v1', breakdown: { distanceKm, fuelCost, wearCost } };
  }
  if (mode === 'taxi' || mode === 'auto' || mode === 'rapido') {
    const assumption = COST_ASSUMPTIONS[mode];
    const distanceCost = distanceKm * assumption.perKmRate;
    return { ...common, estimatedCost: roundCost(assumption.baseFare + distanceCost), model: `${mode}-distance-v1`, breakdown: { distanceKm, baseFare: assumption.baseFare, distanceCost } };
  }
  return undefined;
}
