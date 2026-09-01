export type DisruptionProvenance =
  | { source: 'provider'; providerName: string; observedAt?: string; referenceId?: string }
  | { source: 'simulation'; observedAt?: string; referenceId?: string }
  | { source: 'bookonce-derived'; observedAt?: string; referenceId?: string };

interface BaseDisruption {
  targetNodeId: string;
  provenance: DisruptionProvenance;
}

export type TravelDisruption =
  | (BaseDisruption & { type: 'transport_delay'; delayMinutes?: number; newEndTime?: string })
  | (BaseDisruption & { type: 'route_delay'; delayMinutes?: number; newEndTime?: string })
  | (BaseDisruption & { type: 'transport_cancellation' })
  | (BaseDisruption & { type: 'activity_closure' })
  | (BaseDisruption & { type: 'weather_conflict'; compatibility: 'caution' | 'unsuitable' });

export type DisruptionValidationError =
  | { type: 'invalid-event-type' }
  | { type: 'missing-target-node' }
  | { type: 'target-node-not-found'; nodeId: string }
  | { type: 'invalid-delay' }
  | { type: 'contradictory-delay-fields' }
  | { type: 'invalid-new-end-time'; value: string }
  | { type: 'invalid-provenance'; reason: 'missing-provider-name' | 'unexpected-provider-name' | 'invalid-source' };

export type ImpactReason =
  | 'target-delayed'
  | 'target-cancelled'
  | 'activity-closed'
  | 'weather-unsuitable'
  | 'weather-caution'
  | 'dependency-on-affected-node'
  | 'dependency-overlap'
  | 'blocked-by-cancelled-dependency';

export type ImpactLimitation = 'missing-temporal-context' | 'ambiguous-clock-time';
export type ImpactClassification = 'advisory' | 'conflict' | 'blocked';

export interface NodeImpact {
  nodeId: string;
  reasons: ImpactReason[];
}

export interface ConfirmedTemporalImpact {
  from: string;
  to: string;
  reason: 'dependency-overlap';
  predecessorEndTime: string;
  dependentStartTime: string;
}

export interface ImpactAnalysis {
  disruption: TravelDisruption;
  directlyAffectedNode: NodeImpact;
  downstreamAffectedNodes: NodeImpact[];
  temporalViolations: ConfirmedTemporalImpact[];
  unaffectedNodes: string[];
  classification: ImpactClassification;
  recoveryRequired: boolean;
  limitations: ImpactLimitation[];
}

export type ImpactAnalysisResult =
  | { valid: true; analysis: ImpactAnalysis; errors: [] }
  | { valid: false; analysis?: never; errors: DisruptionValidationError[] };
