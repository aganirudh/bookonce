import type { RecoveryCandidate } from './recoveryTypes';

export const DEFAULT_RECOVERY_WEIGHTS = {
  scheduleDeviation: 0.3,
  additionalEstimatedCost: 0.15,
  changedNodeCount: 0.15,
  unresolvedViolationCount: 0.4,
} as const;

function normalize(values: number[]): number[] {
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  if (minimum === maximum) return values.map(() => 0);
  return values.map(value => (value - minimum) / (maximum - minimum));
}

export function scoreRecoveryCandidates(candidates: readonly Omit<RecoveryCandidate, 'score'>[]): RecoveryCandidate[] {
  if (!candidates.length) return [];
  const allSchedulesKnown = candidates.every(candidate => candidate.scheduleDeviationMinutes !== undefined);
  const schedule = allSchedulesKnown ? normalize(candidates.map(candidate => candidate.scheduleDeviationMinutes!)) : [];
  const changed = normalize(candidates.map(candidate => candidate.changedNodeIds.length));
  const unresolved = normalize(candidates.map(candidate => candidate.unresolvedViolations.length));
  const allCostsKnown = candidates.every(candidate => candidate.additionalEstimatedCost !== undefined);
  const costs = allCostsKnown ? normalize(candidates.map(candidate => candidate.additionalEstimatedCost!)) : [];
  const activeWeight = (allSchedulesKnown ? DEFAULT_RECOVERY_WEIGHTS.scheduleDeviation : 0) + DEFAULT_RECOVERY_WEIGHTS.changedNodeCount +
    DEFAULT_RECOVERY_WEIGHTS.unresolvedViolationCount + (allCostsKnown ? DEFAULT_RECOVERY_WEIGHTS.additionalEstimatedCost : 0);
  return candidates.map((candidate, index) => ({
    ...candidate,
    score: (
      (allSchedulesKnown ? schedule[index] * DEFAULT_RECOVERY_WEIGHTS.scheduleDeviation : 0) +
      changed[index] * DEFAULT_RECOVERY_WEIGHTS.changedNodeCount +
      unresolved[index] * DEFAULT_RECOVERY_WEIGHTS.unresolvedViolationCount +
      (allCostsKnown ? costs[index] * DEFAULT_RECOVERY_WEIGHTS.additionalEstimatedCost : 0)
    ) / activeWeight,
  })).sort((left, right) =>
    left.score - right.score ||
    left.unresolvedViolations.length - right.unresolvedViolations.length ||
    left.changedNodeIds.length - right.changedNodeIds.length ||
    (left.scheduleDeviationMinutes ?? Number.POSITIVE_INFINITY) - (right.scheduleDeviationMinutes ?? Number.POSITIVE_INFINITY) ||
    (left.additionalEstimatedCost ?? Number.POSITIVE_INFINITY) - (right.additionalEstimatedCost ?? Number.POSITIVE_INFINITY) ||
    left.id.localeCompare(right.id)
  );
}
