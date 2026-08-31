import type { JourneySegment } from '../schemas/aiSchemas';
import type { Route } from '@/services/RoutingService';
import type { TravelCostEstimate } from '../cost/types';

export type OptimizationMetric = 'time' | 'cost' | 'walking' | 'transfers' | 'comfort';

export interface RouteCandidate {
  id: string;
  label: string;
  mode: string;
  durationSeconds: number;
  cost?: number;
  costEstimate?: TravelCostEstimate;
  walkingDistanceMeters?: number;
  transfers?: number;
  distanceMeters?: number;
  comfortScore?: number;
  route?: Route;
  segment?: JourneySegment;
  metadata?: Readonly<Record<string, unknown>>;
}

export interface OptimizationPreferences {
  timeWeight: number;
  costWeight: number;
  walkingWeight: number;
  transfersWeight: number;
  comfortWeight?: number;
}

export interface RouteConstraints {
  maxCost?: number;
  maxDurationSeconds?: number;
  maxWalkingDistanceMeters?: number;
  maxTransfers?: number;
}

export type RejectionReason =
  | 'exceeds-max-cost'
  | 'exceeds-max-duration'
  | 'exceeds-max-walking-distance'
  | 'exceeds-max-transfers';

export interface RouteExplanation {
  dominantPreference: OptimizationMetric;
  advantages: string[];
  tradeOffs: string[];
}

export interface RankedRoute {
  candidate: RouteCandidate;
  rank: number;
  score: number;
  qualityScore: number;
  normalizedMetrics: Partial<Record<OptimizationMetric, number>>;
  effectiveWeights: Partial<Record<OptimizationMetric, number>>;
  explanation: RouteExplanation;
}

export interface RejectedRoute {
  candidate: RouteCandidate;
  reasons: RejectionReason[];
}

export interface RouteRankingResult {
  ranked: RankedRoute[];
  rejected: RejectedRoute[];
}
