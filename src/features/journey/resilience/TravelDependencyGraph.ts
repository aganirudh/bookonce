import type { GraphValidationError, TravelDependencyEdge, TravelNode } from './types';

export type GraphConstructionResult =
  | { valid: true; graph: TravelDependencyGraph; errors: [] }
  | { valid: false; graph?: never; errors: GraphValidationError[] };

function cycleNodes(nodeIds: readonly string[], outgoing: ReadonlyMap<string, readonly string[]>): string[] {
  const state = new Map<string, 0 | 1 | 2>();
  const stack: string[] = [];
  const visit = (id: string): string[] | undefined => {
    state.set(id, 1);
    stack.push(id);
    for (const dependent of outgoing.get(id) ?? []) {
      if (state.get(dependent) === 1) return stack.slice(stack.indexOf(dependent)).concat(dependent);
      if (!state.get(dependent)) {
        const found = visit(dependent);
        if (found) return found;
      }
    }
    stack.pop();
    state.set(id, 2);
    return undefined;
  };
  for (const id of nodeIds) {
    if (!state.get(id)) {
      const found = visit(id);
      if (found) return found;
    }
  }
  return [];
}

export class TravelDependencyGraph {
  private constructor(
    private readonly orderedNodes: readonly TravelNode[],
    private readonly graphEdges: readonly TravelDependencyEdge[],
    private readonly outgoing: ReadonlyMap<string, readonly string[]>
  ) {}

  static create(nodes: readonly TravelNode[], edges: readonly TravelDependencyEdge[]): GraphConstructionResult {
    const copiedNodes = nodes.map(node => ({
      ...node,
      location: node.location ? { ...node.location } : undefined,
      metadata: node.metadata ? { ...node.metadata } : undefined,
    }));
    const copiedEdges = edges.map(edge => ({ ...edge }));
    const errors: GraphValidationError[] = [];
    const ids = new Set<string>();
    for (const node of copiedNodes) {
      if (ids.has(node.id)) errors.push({ type: 'duplicate-node', nodeId: node.id });
      ids.add(node.id);
    }
    for (const edge of copiedEdges) {
      if (edge.from === edge.to) errors.push({ type: 'self-dependency', nodeId: edge.from });
      if (!ids.has(edge.from)) errors.push({ type: 'missing-node', nodeId: edge.from, edge });
      if (!ids.has(edge.to)) errors.push({ type: 'missing-node', nodeId: edge.to, edge });
    }
    if (errors.length) return { valid: false, errors };

    const outgoing = new Map(copiedNodes.map(node => [node.id, [] as string[]]));
    for (const edge of copiedEdges) outgoing.get(edge.from)!.push(edge.to);
    const cycle = cycleNodes(copiedNodes.map(node => node.id), outgoing);
    if (cycle.length) return { valid: false, errors: [{ type: 'cycle', nodeIds: cycle }] };
    return { valid: true, graph: new TravelDependencyGraph(copiedNodes, copiedEdges, outgoing), errors: [] };
  }

  getNodes(): TravelNode[] {
    return this.orderedNodes.map(node => ({ ...node, location: node.location ? { ...node.location } : undefined, metadata: node.metadata ? { ...node.metadata } : undefined }));
  }

  getEdges(): TravelDependencyEdge[] {
    return this.graphEdges.map(edge => ({ ...edge }));
  }

  getDirectDependents(nodeId: string): string[] {
    return [...(this.outgoing.get(nodeId) ?? [])];
  }

  getAffectedNodes(nodeId: string): string[] {
    if (!this.outgoing.has(nodeId)) return [];
    const affected = new Set<string>();
    const queue = [...(this.outgoing.get(nodeId) ?? [])];
    while (queue.length) {
      const current = queue.shift()!;
      if (affected.has(current)) continue;
      affected.add(current);
      queue.push(...(this.outgoing.get(current) ?? []));
    }
    return this.getTopologicalOrder().filter(id => affected.has(id));
  }

  getTopologicalOrder(): string[] {
    const visited = new Set<string>();
    const postorder: string[] = [];
    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      const dependents = this.outgoing.get(id) ?? [];
      for (let index = dependents.length - 1; index >= 0; index -= 1) visit(dependents[index]);
      postorder.push(id);
    };
    for (let index = this.orderedNodes.length - 1; index >= 0; index -= 1) visit(this.orderedNodes[index].id);
    return postorder.reverse();
  }
}
