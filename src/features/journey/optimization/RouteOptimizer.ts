import type {
  OptimizationMetric,
  OptimizationPreferences,
  RankedRoute,
  RejectedRoute,
  RejectionReason,
  RouteCandidate,
  RouteConstraints,
  RouteExplanation,
  RouteRankingResult,
} from './types';

const EPSILON = 1e-12;
const metrics: OptimizationMetric[] = ['time', 'cost', 'walking', 'transfers', 'comfort'];

const preferenceValues = (preferences: OptimizationPreferences): Record<OptimizationMetric, number> => ({
  time: preferences.timeWeight,
  cost: preferences.costWeight,
  walking: preferences.walkingWeight,
  transfers: preferences.transfersWeight,
  comfort: preferences.comfortWeight ?? 0,
});

export function normalizeWeights(
  preferences: OptimizationPreferences
): Record<OptimizationMetric, number> {
  const values = preferenceValues(preferences);
  if (metrics.some(metric => !Number.isFinite(values[metric]) || values[metric] < 0)) {
    throw new Error('Optimization weights must be finite and non-negative');
  }
  const total = metrics.reduce((sum, metric) => sum + values[metric], 0);
  if (total === 0) throw new Error('At least one optimization weight must be positive');
  return Object.fromEntries(metrics.map(metric => [metric, values[metric] / total])) as Record<OptimizationMetric, number>;
}

export function normalizeMetric(values: number[]): number[] {
  if (values.length === 0) return [];
  if (values.some(value => !Number.isFinite(value))) {
    throw new Error('Metric values must be finite');
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0);
  return values.map(value => (value - min) / (max - min));
}

function metricValue(candidate: RouteCandidate, metric: OptimizationMetric): number | undefined {
  const value = {
    time: candidate.durationSeconds,
    cost: candidate.cost,
    walking: candidate.walkingDistanceMeters,
    transfers: candidate.transfers,
    comfort: candidate.comfortScore,
  }[metric];
  if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
    throw new Error(`Candidate ${candidate.id} has an invalid ${metric} metric`);
  }
  return value;
}

function rejectionReasons(candidate: RouteCandidate, constraints: RouteConstraints): RejectionReason[] {
  const reasons: RejectionReason[] = [];
  if (constraints.maxCost !== undefined && candidate.cost !== undefined && candidate.cost > constraints.maxCost) reasons.push('exceeds-max-cost');
  if (constraints.maxDurationSeconds !== undefined && candidate.durationSeconds > constraints.maxDurationSeconds) reasons.push('exceeds-max-duration');
  if (constraints.maxWalkingDistanceMeters !== undefined && candidate.walkingDistanceMeters !== undefined && candidate.walkingDistanceMeters > constraints.maxWalkingDistanceMeters) reasons.push('exceeds-max-walking-distance');
  if (constraints.maxTransfers !== undefined && candidate.transfers !== undefined && candidate.transfers > constraints.maxTransfers) reasons.push('exceeds-max-transfers');
  return reasons;
}

function validateConstraints(constraints: RouteConstraints): void {
  for (const value of Object.values(constraints)) {
    if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
      throw new Error('Route constraints must be finite and non-negative');
    }
  }
}

function effectiveWeights(
  candidates: RouteCandidate[],
  normalized: Record<OptimizationMetric, number>
): Partial<Record<OptimizationMetric, number>> {
  const available = metrics.filter(metric => candidates.some(candidate => metricValue(candidate, metric) !== undefined));
  const weightedTotal = available.reduce((sum, metric) => sum + normalized[metric], 0);
  if (weightedTotal > 0) {
    return Object.fromEntries(available.map(metric => [metric, normalized[metric] / weightedTotal]));
  }
  const equal = 1 / available.length;
  return Object.fromEntries(available.map(metric => [metric, equal]));
}

function normalizedMetrics(candidates: RouteCandidate[]): Array<Partial<Record<OptimizationMetric, number>>> {
  const result = candidates.map(() => ({} as Partial<Record<OptimizationMetric, number>>));
  for (const metric of metrics) {
    const present = candidates
      .map((candidate, index) => ({ index, value: metricValue(candidate, metric) }))
      .filter((entry): entry is { index: number; value: number } => entry.value !== undefined);
    if (present.length === 0) continue;
    const normalized = normalizeMetric(present.map(entry => entry.value));
    const allEqual = present.every(entry => entry.value === present[0].value);
    present.forEach((entry, position) => {
      result[entry.index][metric] = metric === 'comfort' && !allEqual ? 1 - normalized[position] : normalized[position];
    });
    // Missing data receives the worst penalty and can never beat known data by omission.
    result.forEach(candidateMetrics => {
      if (candidateMetrics[metric] === undefined) candidateMetrics[metric] = 1;
    });
  }
  return result;
}

function dominantPreference(weights: Partial<Record<OptimizationMetric, number>>): OptimizationMetric {
  return metrics.reduce((best, metric) => (weights[metric] ?? 0) > (weights[best] ?? 0) ? metric : best, 'time');
}

function explanationFor(
  candidate: RouteCandidate,
  candidates: RouteCandidate[],
  weights: Partial<Record<OptimizationMetric, number>>
): RouteExplanation {
  const advantages: string[] = [];
  const tradeOffs: string[] = [];
  const fastest = Math.min(...candidates.map(item => item.durationSeconds));
  if (candidate.durationSeconds === fastest) advantages.push('Fastest eligible option');
  else tradeOffs.push(`${Math.round((candidate.durationSeconds - fastest) / 60)} minutes slower than the fastest option`);

  const costs = candidates.map(item => item.cost).filter((value): value is number => value !== undefined);
  if (candidate.cost !== undefined && costs.length > 0) {
    const cheapest = Math.min(...costs);
    if (candidate.cost === cheapest) advantages.push('Lowest known estimated cost');
    else tradeOffs.push(`₹${Math.round(candidate.cost - cheapest).toLocaleString()} above the lowest known estimate`);
  }

  const walking = candidates.map(item => item.walkingDistanceMeters).filter((value): value is number => value !== undefined);
  if (candidate.walkingDistanceMeters !== undefined && walking.length > 0 && candidate.walkingDistanceMeters === Math.min(...walking)) advantages.push('Least known walking distance');

  const transfers = candidates.map(item => item.transfers).filter((value): value is number => value !== undefined);
  if (candidate.transfers !== undefined && transfers.length > 0 && candidate.transfers === Math.min(...transfers)) advantages.push(candidate.transfers === 0 ? 'No transfers' : 'Fewest known transfers');

  if (candidates.length === 1) advantages.unshift('Only verified route currently available');
  return { dominantPreference: dominantPreference(weights), advantages, tradeOffs };
}

function missingLast(value: number | undefined): number {
  return value ?? Number.POSITIVE_INFINITY;
}

export function rankRoutes(
  candidates: readonly RouteCandidate[],
  preferences: OptimizationPreferences,
  constraints: RouteConstraints = {}
): RouteRankingResult {
  normalizeWeights(preferences);
  validateConstraints(constraints);
  const rejected: RejectedRoute[] = [];
  const eligible = candidates.filter(candidate => {
    metricValue(candidate, 'time');
    const reasons = rejectionReasons(candidate, constraints);
    if (reasons.length > 0) rejected.push({ candidate, reasons });
    return reasons.length === 0;
  });
  if (eligible.length === 0) return { ranked: [], rejected };

  const weights = effectiveWeights(eligible, normalizeWeights(preferences));
  const normalized = normalizedMetrics(eligible);
  const scored = eligible.map((candidate, originalIndex) => {
    const score = metrics.reduce((sum, metric) => sum + (normalized[originalIndex][metric] ?? 0) * (weights[metric] ?? 0), 0);
    return { candidate, originalIndex, score };
  });

  scored.sort((left, right) => {
    if (Math.abs(left.score - right.score) > EPSILON) return left.score - right.score;
    return left.candidate.durationSeconds - right.candidate.durationSeconds ||
      missingLast(left.candidate.cost) - missingLast(right.candidate.cost) ||
      missingLast(left.candidate.transfers) - missingLast(right.candidate.transfers) ||
      missingLast(left.candidate.walkingDistanceMeters) - missingLast(right.candidate.walkingDistanceMeters) ||
      left.candidate.id.localeCompare(right.candidate.id) ||
      left.originalIndex - right.originalIndex;
  });

  const ranked: RankedRoute[] = scored.map((item, index) => ({
    candidate: item.candidate,
    rank: index + 1,
    score: item.score,
    qualityScore: Math.max(0, Math.min(100, Math.round((1 - item.score) * 100))),
    normalizedMetrics: normalized[item.originalIndex],
    effectiveWeights: weights,
    explanation: explanationFor(item.candidate, eligible, weights),
  }));
  return { ranked, rejected };
}

export function getBestRoute(
  candidates: readonly RouteCandidate[],
  preferences: OptimizationPreferences,
  constraints: RouteConstraints = {}
): RankedRoute | undefined {
  return rankRoutes(candidates, preferences, constraints).ranked[0];
}
