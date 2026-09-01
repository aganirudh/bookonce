import type { TravelDependencyGraph } from './TravelDependencyGraph';
import { parseTemporalValue } from './TemporalConstraintValidator';
import { validateDisruptionEvent } from './DisruptionEventValidator';
import type {
  ConfirmedTemporalImpact, ImpactAnalysisResult, ImpactClassification, ImpactLimitation,
  ImpactReason, TravelDisruption,
} from './disruptionTypes';

function isClock(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value);
}

function delayedEndTime(originalEnd: string | undefined, disruption: TravelDisruption): { value?: string; limitation?: ImpactLimitation } {
  if (disruption.type !== 'transport_delay' && disruption.type !== 'route_delay') return {};
  if (disruption.newEndTime) {
    if (originalEnd && isClock(originalEnd) && isClock(disruption.newEndTime) &&
      parseTemporalValue(disruption.newEndTime)! < parseTemporalValue(originalEnd)!) {
      return { limitation: 'ambiguous-clock-time' };
    }
    return { value: disruption.newEndTime };
  }
  if (!originalEnd || disruption.delayMinutes === undefined) return { limitation: 'missing-temporal-context' };
  const parsed = parseTemporalValue(originalEnd);
  if (parsed === undefined) return { limitation: 'missing-temporal-context' };
  if (isClock(originalEnd)) {
    const updated = parsed + disruption.delayMinutes;
    if (updated >= 24 * 60) return { limitation: 'ambiguous-clock-time' };
    return { value: `${String(Math.floor(updated / 60)).padStart(2, '0')}:${String(updated % 60).padStart(2, '0')}` };
  }
  return { value: new Date(parsed + disruption.delayMinutes * 60_000).toISOString() };
}

function directReason(disruption: TravelDisruption): ImpactReason {
  if (disruption.type === 'transport_delay' || disruption.type === 'route_delay') return 'target-delayed';
  if (disruption.type === 'transport_cancellation') return 'target-cancelled';
  if (disruption.type === 'activity_closure') return 'activity-closed';
  return disruption.type === 'weather_conflict' && disruption.compatibility === 'unsuitable' ? 'weather-unsuitable' : 'weather-caution';
}

export function analyzeDisruption(graph: TravelDependencyGraph, input: unknown): ImpactAnalysisResult {
  const validated = validateDisruptionEvent(graph, input);
  if (!validated.valid) return { valid: false, errors: validated.errors };
  const disruption = validated.disruption;
  const nodes = graph.getNodes();
  const byId = new Map(nodes.map(node => [node.id, node]));
  const descendants = graph.getAffectedNodes(disruption.targetNodeId);
  const descendantSet = new Set(descendants);
  const limitations: ImpactLimitation[] = [];
  const temporalViolations: ConfirmedTemporalImpact[] = [];

  if (disruption.type === 'transport_delay' || disruption.type === 'route_delay') {
    const updatedEnd = delayedEndTime(byId.get(disruption.targetNodeId)?.endTime, disruption);
    if (updatedEnd.limitation) limitations.push(updatedEnd.limitation);
    if (updatedEnd.value) {
      const endValue = parseTemporalValue(updatedEnd.value)!;
      for (const dependentId of graph.getDirectDependents(disruption.targetNodeId)) {
        const startTime = byId.get(dependentId)?.startTime;
        if (!startTime) {
          if (!limitations.includes('missing-temporal-context')) limitations.push('missing-temporal-context');
          continue;
        }
        if (isClock(updatedEnd.value) !== isClock(startTime)) {
          if (!limitations.includes('missing-temporal-context')) limitations.push('missing-temporal-context');
          continue;
        }
        const startValue = parseTemporalValue(startTime);
        if (startValue !== undefined && endValue > startValue) {
          temporalViolations.push({
            from: disruption.targetNodeId, to: dependentId, reason: 'dependency-overlap',
            predecessorEndTime: updatedEnd.value, dependentStartTime: startTime,
          });
        }
      }
    }
  }

  const cancellation = disruption.type === 'transport_cancellation';
  const downstreamReason: ImpactReason = cancellation ? 'blocked-by-cancelled-dependency' : 'dependency-on-affected-node';
  const downstreamAffectedNodes = descendants.map(nodeId => ({
    nodeId,
    reasons: [
      downstreamReason,
      ...(temporalViolations.some(violation => violation.to === nodeId) ? ['dependency-overlap' as const] : []),
    ],
  }));
  const unaffectedNodes = graph.getTopologicalOrder().filter(id => id !== disruption.targetNodeId && !descendantSet.has(id));
  let classification: ImpactClassification = 'advisory';
  let recoveryRequired = false;
  if (cancellation || disruption.type === 'activity_closure') {
    classification = 'blocked';
    recoveryRequired = true;
  } else if (temporalViolations.length) {
    classification = 'conflict';
    recoveryRequired = true;
  } else if (disruption.type === 'weather_conflict' && disruption.compatibility === 'unsuitable') {
    classification = 'conflict';
    recoveryRequired = descendants.length > 0;
  }

  return {
    valid: true,
    analysis: {
      disruption: { ...disruption, provenance: { ...disruption.provenance } } as TravelDisruption,
      directlyAffectedNode: { nodeId: disruption.targetNodeId, reasons: [directReason(disruption)] },
      downstreamAffectedNodes, temporalViolations, unaffectedNodes, classification, recoveryRequired, limitations,
    },
    errors: [],
  };
}
