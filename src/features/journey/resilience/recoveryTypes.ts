import type { ImpactAnalysis, ImpactLimitation } from './disruptionTypes';
import type { TravelDependencyGraph } from './TravelDependencyGraph';

export interface VerifiedRecoveryRoute {
  id: string;
  provider?: string;
  mode: string;
  durationSeconds: number;
  distanceMeters: number;
  estimatedCost?: number;
}

export interface TransportRecoverySource {
  nodeId: string;
  currentRouteId?: string;
  currentDurationSeconds?: number;
  currentEstimatedCost?: number;
  alternatives: readonly VerifiedRecoveryRoute[];
}

export interface RecoveryConstraints {
  maxAdditionalEstimatedCost?: number;
  maxAdditionalDelayMinutes?: number;
  latestArrivalTime?: string;
  preserveFixedItems?: boolean;
  sameDayOnly?: boolean;
  maxChangedNodes?: number;
}

export type RecoveryAction =
  | { type: 'replace_transport_route'; nodeId: string; replacementRouteId: string; newStartTime?: string; newEndTime?: string }
  | { type: 'shift_flexible_activity'; nodeId: string; newStartTime: string; newEndTime: string };

export type RecoveryRejectionReason =
  | 'not-in-affected-subgraph'
  | 'not-a-verified-alternative'
  | 'same-route'
  | 'invalid-route-metric'
  | 'exceeds-additional-cost'
  | 'missing-required-cost'
  | 'exceeds-additional-delay'
  | 'missing-required-delay'
  | 'exceeds-latest-arrival'
  | 'violates-same-day'
  | 'exceeds-changed-nodes'
  | 'fixed-node-move'
  | 'dependency-conflict'
  | 'ambiguous-clock-time'
  | 'missing-temporal-context';

export interface UnresolvedRecoveryViolation {
  type: 'fixed-event-conflict' | 'unresolved-impact';
  nodeId: string;
  reason: string;
}

export interface RecoveryExplanation {
  reasonCodes: Array<'preserves-unaffected' | 'schedule-deviation' | 'additional-estimated-cost' | 'minimal-node-change' | 'unresolved-violations'>;
  preservedNodeCount: number;
  scheduleDeviationMinutes?: number;
  additionalEstimatedCost?: number;
  changedNodeIds: string[];
  unresolvedViolationCount: number;
}

export interface RecoveryCandidate {
  id: string;
  action: RecoveryAction;
  scheduleDeviationMinutes?: number;
  additionalEstimatedCost?: number;
  changedNodeIds: string[];
  unresolvedViolations: UnresolvedRecoveryViolation[];
  score: number;
  explanation: RecoveryExplanation;
}

export interface RejectedRecoveryCandidate {
  id: string;
  action: RecoveryAction;
  reasons: RecoveryRejectionReason[];
}

export interface RecoveryPlannerInput {
  graph: TravelDependencyGraph;
  impact: ImpactAnalysis;
  transportSources?: readonly TransportRecoverySource[];
  constraints?: RecoveryConstraints;
}

export interface RecoveryResult {
  status: 'recovery-proposed' | 'no-valid-recovery' | 'not-required' | 'invalid-input';
  recommendedCandidate?: RecoveryCandidate;
  rankedCandidates: RecoveryCandidate[];
  rejectedCandidates: RejectedRecoveryCandidate[];
  preservedNodeIds: string[];
  changedNodeIds: string[];
  unresolvedViolations: UnresolvedRecoveryViolation[];
  limitations: ImpactLimitation[];
  inputErrors?: Array<'invalid-constraint' | 'impact-target-not-found'>;
}
