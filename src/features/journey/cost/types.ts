export type CostEstimateMode = 'walk' | 'car' | 'taxi' | 'auto' | 'rapido';

export interface TravelCostEstimate {
  estimatedCost: number;
  currency: 'INR';
  source: 'bookonce-estimate';
  model: 'walking-monetary-v1' | 'private-car-v1' | 'taxi-distance-v1' | 'auto-distance-v1' | 'rapido-distance-v1';
  breakdown: Readonly<Record<string, number>>;
}
