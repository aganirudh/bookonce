const normalized = value => typeof value === 'string' ? value.trim().toUpperCase() : undefined;

function matchesFlight(subject, flight) {
  if (!subject.carrierCode || !subject.flightNumber || !flight) return false;
  const comparisons = [
    ['carrierCode', subject.carrierCode, flight.carrierCode], ['flightNumber', subject.flightNumber, flight.flightNumber],
    ['originCode', subject.originCode, flight.originCode], ['destinationCode', subject.destinationCode, flight.destinationCode],
    ['scheduledDeparture', subject.scheduledDeparture, flight.scheduledDeparture],
  ];
  return comparisons.every(([, expected, actual]) => expected === undefined || normalized(expected) === normalized(actual));
}

export function matchDisruptionObservation(observation, nodes) {
  const explicit = observation.subject.externalId
    ? nodes.filter(node => node.externalBindings?.some(binding => binding.provider === observation.provider && binding.externalId === observation.subject.externalId))
    : [];
  let candidates = explicit; let method = 'explicit_external_binding'; let evidence = observation.subject.externalId ? ['provider', 'externalId'] : [];
  if (!candidates.length && observation.subject.type === 'flight') {
    method = 'structured_flight_identity';
    if (observation.subject.carrierCode && observation.subject.flightNumber) {
      candidates = nodes.filter(node => node.kind === 'transport' && matchesFlight(observation.subject, node.flight));
      evidence = ['carrierCode', 'flightNumber', ...['originCode', 'destinationCode', 'scheduledDeparture'].filter(key => observation.subject[key] !== undefined)];
    }
  } else if (!candidates.length && observation.subject.type === 'route' && observation.subject.providerRouteId) {
    candidates = nodes.filter(node => node.kind === 'transport' && node.route?.provider === observation.provider && node.route?.providerRouteId === observation.subject.providerRouteId);
    method = 'provider_route_identifier'; evidence = ['provider', 'providerRouteId'];
  } else if (!candidates.length && observation.subject.type === 'activity' && observation.subject.externalActivityId) {
    candidates = nodes.filter(node => node.kind === 'activity' && node.activity?.provider === observation.provider && node.activity?.externalActivityId === observation.subject.externalActivityId);
    method = 'external_activity_identifier'; evidence = ['provider', 'externalActivityId'];
  }
  const ids = candidates.map(node => node.nodeId).sort();
  if (ids.length === 1) return { status: 'matched', targetNodeId: ids[0], matchMethod: method, evidence };
  if (ids.length > 1) return { status: 'ambiguous', candidateNodeIds: ids, matchMethod: method, evidence };
  return { status: 'unmatched', reason: evidence.length ? 'no-structured-identity-match' : 'insufficient-structured-evidence' };
}
