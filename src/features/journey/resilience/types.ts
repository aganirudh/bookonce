export type TravelNodeKind = 'transport' | 'activity';
export type TravelNodeFlexibility = 'fixed' | 'flexible';
export type DependencySource = 'explicit' | 'inferred';

export interface TravelNode {
  id: string;
  kind: TravelNodeKind;
  startTime?: string;
  endTime?: string;
  flexibility: TravelNodeFlexibility;
  location?: Readonly<{ name: string }>;
  metadata?: Readonly<Record<string, unknown>>;
}

export interface TravelDependencyEdge {
  from: string;
  to: string;
  dependencySource: DependencySource;
}

export type GraphValidationError =
  | { type: 'duplicate-node'; nodeId: string }
  | { type: 'self-dependency'; nodeId: string }
  | { type: 'missing-node'; nodeId: string; edge: TravelDependencyEdge }
  | { type: 'cycle'; nodeIds: string[] };

export type TemporalViolation =
  | { type: 'invalid-time-range'; nodeId: string; startTime: string; endTime: string }
  | { type: 'dependency-overlap'; from: string; to: string; predecessorEndTime: string; dependentStartTime: string; fixedConflict: boolean };

export type AdapterLimitation =
  | { type: 'missing-stable-id'; segmentIndex: number }
  | { type: 'invalid-start-time'; segmentIndex: number; value: string }
  | { type: 'invalid-end-time'; segmentIndex: number; value: string };
