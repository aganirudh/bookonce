import type { JourneySegment } from '../schemas/aiSchemas';

export type RoutingAlternative = NonNullable<JourneySegment['routingAlternatives']>[number];

type ComparableMetric = 'duration' | 'estimatedCost' | 'walkingDistance';

function allHave(routes: readonly RoutingAlternative[], metric: ComparableMetric): boolean {
  return routes.length > 1 && routes.every(route => route[metric] !== undefined);
}

function isMinimum(routes: readonly RoutingAlternative[], route: RoutingAlternative, metric: ComparableMetric): boolean {
  if (!allHave(routes, metric)) return false;
  const value = route[metric];
  return value !== undefined && value === Math.min(...routes.map(candidate => candidate[metric] as number));
}

export function routeDescriptor(routes: readonly RoutingAlternative[], route: RoutingAlternative): string {
  if (isMinimum(routes, route, 'duration')) return 'Fastest';
  if (isMinimum(routes, route, 'estimatedCost')) return 'Lowest estimated cost';
  if (isMinimum(routes, route, 'walkingDistance')) return 'Least walking';
  return `Alternative ${route.rank - 1}`;
}

export function routeComparisons(
  selected: RoutingAlternative,
  recommended: RoutingAlternative | undefined
): string[] {
  if (!recommended || selected.id === recommended.id) return [];
  const comparisons: string[] = [];
  const durationDifference = selected.duration - recommended.duration;
  if (durationDifference !== 0) {
    comparisons.push(`${Math.abs(Math.round(durationDifference / 60))} min ${durationDifference > 0 ? 'slower' : 'faster'} than recommended`);
  }
  if (selected.estimatedCost !== undefined && recommended.estimatedCost !== undefined) {
    const difference = Math.round(selected.estimatedCost - recommended.estimatedCost);
    if (difference !== 0) comparisons.push(`Approx. ₹${Math.abs(difference).toLocaleString()} ${difference > 0 ? 'higher' : 'lower'} estimated cost than recommended`);
  }
  if (selected.walkingDistance !== undefined && recommended.walkingDistance !== undefined) {
    const difference = Math.round(selected.walkingDistance - recommended.walkingDistance);
    if (difference !== 0) comparisons.push(`${Math.abs(difference).toLocaleString()} m ${difference > 0 ? 'more' : 'less'} walking than recommended`);
  }
  if (selected.transfers !== undefined && recommended.transfers !== undefined) {
    const difference = selected.transfers - recommended.transfers;
    if (difference !== 0) comparisons.push(`${Math.abs(difference)} ${difference > 0 ? 'additional' : 'fewer'} transfer${Math.abs(difference) === 1 ? '' : 's'} than recommended`);
  }
  return comparisons;
}
