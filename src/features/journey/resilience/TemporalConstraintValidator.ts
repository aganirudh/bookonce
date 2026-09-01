import type { TravelDependencyGraph } from './TravelDependencyGraph';
import type { TemporalViolation } from './types';

export function parseTemporalValue(value: string): number | undefined {
  const clock = /^(\d{2}):(\d{2})$/.exec(value);
  if (clock) {
    const hours = Number(clock[1]);
    const minutes = Number(clock[2]);
    return hours <= 23 && minutes <= 59 ? hours * 60 + minutes : undefined;
  }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return undefined;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

export function validateTemporalConstraints(graph: TravelDependencyGraph): TemporalViolation[] {
  const nodes = graph.getNodes();
  const byId = new Map(nodes.map(node => [node.id, node]));
  const violations: TemporalViolation[] = [];
  for (const node of nodes) {
    if (!node.startTime || !node.endTime) continue;
    const start = parseTemporalValue(node.startTime);
    const end = parseTemporalValue(node.endTime);
    if (start !== undefined && end !== undefined && start >= end) {
      violations.push({ type: 'invalid-time-range', nodeId: node.id, startTime: node.startTime, endTime: node.endTime });
    }
  }
  for (const edge of graph.getEdges()) {
    const predecessor = byId.get(edge.from)!;
    const dependent = byId.get(edge.to)!;
    if (!predecessor.endTime || !dependent.startTime) continue;
    const predecessorEnd = parseTemporalValue(predecessor.endTime);
    const dependentStart = parseTemporalValue(dependent.startTime);
    if (predecessorEnd !== undefined && dependentStart !== undefined && predecessorEnd > dependentStart) {
      violations.push({
        type: 'dependency-overlap', from: edge.from, to: edge.to,
        predecessorEndTime: predecessor.endTime, dependentStartTime: dependent.startTime,
        fixedConflict: dependent.flexibility === 'fixed',
      });
    }
  }
  return violations;
}
