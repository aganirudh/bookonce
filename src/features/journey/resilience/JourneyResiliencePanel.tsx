import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataProvenanceBadge } from '@/components/ui/data-provenance';
import type { Itinerary } from '../schemas/aiSchemas';
import { adaptItineraryToGraph } from './adapters';
import { analyzeDisruption } from './ImpactAnalyzer';
import { planRecovery } from './RecoveryPlanner';
import { SimulationDisruptionProvider, type SimulationScenario } from './SimulationDisruptionProvider';
import { TravelDependencyGraph } from './TravelDependencyGraph';
import type { TravelDependencyEdge } from './types';
import type { ImpactAnalysis, TravelDisruption } from './disruptionTypes';
import type { RecoveryCandidate, RecoveryResult, TransportRecoverySource } from './recoveryTypes';
import type { RecoveryApplicationState } from './recoveryApplication';
import { applyRecoveryTransaction, createJourneyVersion, itineraryFingerprint, JourneyChangeLedger, undoLatestJourneyChange } from './journeyLedger';
import { disruptionClient } from '@/services/DisruptionClient';
import { journeySegmentToDisruptionMatchingNode } from './disruptionMatchingAdapter';

const scenarios: Array<{ value: SimulationScenario; label: string; kind: 'transport' | 'activity' }> = [
  { value: 'delay-30', label: '30-minute transport delay', kind: 'transport' },
  { value: 'delay-180', label: '180-minute transport delay', kind: 'transport' },
  { value: 'transport-cancellation', label: 'Transport cancellation', kind: 'transport' },
  { value: 'activity-closure', label: 'Activity closure', kind: 'activity' },
];

const reasonLabels: Record<string, string> = {
  'target-delayed': 'Transport delayed', 'target-cancelled': 'Transport cancelled', 'activity-closed': 'Activity closed',
  'dependency-on-affected-node': 'Depends on an affected item', 'dependency-overlap': 'Timing overlaps after disruption',
  'blocked-by-cancelled-dependency': 'Blocked by a cancelled dependency', 'fixed-event-conflict': 'Fixed event cannot be moved',
  'missing-temporal-context': 'Some times are unavailable', 'ambiguous-clock-time': 'Cross-midnight timing is ambiguous',
};

interface DisruptionCheckResult {
  status: string;
  disruption?: TravelDisruption;
}

function nodeLabel(itinerary: Itinerary, nodeId: string): string {
  const segment = itinerary.segments.find(item => item.activityId === nodeId);
  return segment ? `${segment.from.name} → ${segment.to.name}` : nodeId;
}

function transportSources(itinerary: Itinerary, selectedRouteIds: Readonly<Record<number, string | undefined>>): TransportRecoverySource[] {
  return itinerary.segments.flatMap((segment, index) => {
    if (!segment.activityId || !segment.routingAlternatives?.length) return [];
    const selectedId = selectedRouteIds[index] ?? segment.selectedRouteCandidateId;
    const current = segment.routingAlternatives.find(route => route.id === selectedId);
    return [{
      nodeId: segment.activityId,
      currentRouteId: selectedId,
      currentDurationSeconds: current?.duration ?? segment.routeDuration,
      currentEstimatedCost: current?.estimatedCost ?? segment.estimatedCost,
      alternatives: segment.routingAlternatives.map(route => ({
        id: route.id, mode: route.mode, durationSeconds: route.duration,
        distanceMeters: route.distance, estimatedCost: route.estimatedCost,
      })),
    }];
  });
}

function RecoveryCard({ candidate, selected, onSelect, itinerary }: {
  candidate: RecoveryCandidate; selected: boolean; onSelect: () => void; itinerary: Itinerary;
}) {
  return <button type="button" className="w-full rounded-lg border p-3 text-left" aria-pressed={selected} onClick={onSelect}>
    <span className="block font-semibold">{candidate.action.type === 'replace_transport_route' ? 'Use verified alternative route' : 'Shift flexible activity'}</span>
    <span className="block text-sm">Changes: {candidate.changedNodeIds.map(id => nodeLabel(itinerary, id)).join(', ')}</span>
    <span className="block text-sm">Preserves {candidate.explanation.preservedNodeCount} unaffected itinerary items</span>
    {candidate.scheduleDeviationMinutes !== undefined && <span className="block text-sm">Adds approximately {candidate.scheduleDeviationMinutes} minutes</span>}
    {candidate.additionalEstimatedCost !== undefined && <span className="block text-sm">Estimated additional cost: ₹{candidate.additionalEstimatedCost.toLocaleString()}</span>}
    <span className="block text-sm">Recovery score: {candidate.score.toFixed(3)}</span>
    {selected && <span className="block text-sm font-semibold">Selected</span>}
  </button>;
}

export function JourneyResiliencePanel({ state, explicitDependencies = [], onApply, statusProvider }: {
  state: RecoveryApplicationState;
  explicitDependencies?: readonly Omit<TravelDependencyEdge, 'dependencySource'>[];
  onApply: (state: RecoveryApplicationState) => void;
  statusProvider?: string | null;
}) {
  const adapted = useMemo(() => adaptItineraryToGraph(state.itinerary, explicitDependencies), [state.itinerary, explicitDependencies]);
  const graphResult = useMemo(() => TravelDependencyGraph.create(adapted.nodes, adapted.edges), [adapted]);
  const [scenario, setScenario] = useState<SimulationScenario>('delay-30');
  const [targetId, setTargetId] = useState('');
  const [impact, setImpact] = useState<ImpactAnalysis>();
  const [recovery, setRecovery] = useState<RecoveryResult>();
  const [selected, setSelected] = useState<RecoveryCandidate>();
  const [proposalFingerprint, setProposalFingerprint] = useState('');
  const [proposalVersion, setProposalVersion] = useState(0);
  const [version, setVersion] = useState(() => createJourneyVersion(state));
  const [ledger, setLedger] = useState(() => JourneyChangeLedger.empty());
  const [status, setStatus] = useState('');
  const [checking, setChecking] = useState(false);
  const [impactSource, setImpactSource] = useState<'simulation' | 'provider'>('simulation');
  const graph = graphResult.valid ? graphResult.graph : undefined;
  const simulationEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_RESILIENCE_SIMULATION === 'true';
  const scenarioKind = scenarios.find(item => item.value === scenario)!.kind;
  const eligibleNodes = graph?.getNodes().filter(node => node.kind === scenarioKind) ?? [];
  const selectedTarget = eligibleNodes.some(node => node.id === targetId) ? targetId : eligibleNodes[0]?.id ?? '';
  const flightEvidence = useMemo(() => state.itinerary.segments.map(journeySegmentToDisruptionMatchingNode).filter((node): node is NonNullable<typeof node> => Boolean(node?.flight)), [state.itinerary]);
  const flightIdentityKey = JSON.stringify(flightEvidence.map(node => node.flight));

  useEffect(() => {
    setImpact(undefined); setRecovery(undefined); setSelected(undefined); setStatus('');
  }, [flightIdentityKey]);

  const verifiedProvider = statusProvider ?? null;

  const simulate = async () => {
    if (!graph || !selectedTarget) return;
    const [event] = await new SimulationDisruptionProvider().getDisruptions(selectedTarget, scenario);
    const result = analyzeDisruption(graph, event);
    if (!result.valid) { setStatus('Simulation could not be validated.'); return; }
    const nextRecovery = planRecovery({ graph, impact: result.analysis, transportSources: transportSources(state.itinerary, state.selectedRouteIds) });
    setImpactSource('simulation'); setImpact(result.analysis); setRecovery(nextRecovery); setSelected(nextRecovery.recommendedCandidate);
    setProposalFingerprint(itineraryFingerprint(state)); setProposalVersion(version.version); setStatus('');
  };
  const checkFlightStatus = async () => {
    if (!graph || !verifiedProvider || !flightEvidence.length) return;
    setChecking(true); setStatus('');
    try {
      const response = await disruptionClient.check({
        provider: verifiedProvider, capability: 'flight_status', itineraryNodes: flightEvidence,
        query: { subjects: flightEvidence.map(node => ({ type: 'flight', ...node.flight })) },
        maxObservationAgeMinutes: 30,
      }) as { results?: DisruptionCheckResult[] };
      const verified = response.results?.find(item => item.status === 'verified');
      const clear = response.results?.find(item => item.status === 'verified-clear');
      if (!verified?.disruption) {
        setImpact(undefined); setRecovery(undefined); setSelected(undefined);
        const ambiguous = response.results?.some(item => item.status === 'ambiguous');
        setStatus(clear ? 'No verified disruption found for this flight.' : ambiguous ? 'Multiple provider records matched this flight. Status could not be verified safely.' : 'Unable to verify status for this selected flight.');
        return;
      }
      const analyzed = analyzeDisruption(graph, verified.disruption);
      if (!analyzed.valid) { setStatus('Verified provider update could not be validated.'); return; }
      const nextRecovery = planRecovery({ graph, impact: analyzed.analysis, transportSources: transportSources(state.itinerary, state.selectedRouteIds) });
      setImpactSource('provider'); setImpact(analyzed.analysis); setRecovery(nextRecovery); setSelected(nextRecovery.recommendedCandidate);
      setProposalFingerprint(itineraryFingerprint(state)); setProposalVersion(version.version);
      setStatus(verified.disruption.type === 'transport_cancellation'
        ? 'Provider reports this flight as cancelled.'
        : verified.disruption.type === 'transport_delay'
          ? `Verified provider delay: ${verified.disruption.delayMinutes} minutes.`
          : 'Verified provider update received.');
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      setStatus(code === 'PROVIDER_AUTH' ? 'Flight status provider authentication is unavailable.' : code === 'PROVIDER_QUOTA' ? 'Flight status provider quota is currently unavailable.' : code === 'PROVIDER_TIMEOUT' ? 'Flight status check timed out. Please try again later.' : 'Flight status provider is temporarily unavailable.');
    }
    finally { setChecking(false); }
  };
  const dismiss = () => { setImpact(undefined); setRecovery(undefined); setSelected(undefined); setStatus(''); };
  const apply = () => {
    if (!impact || !selected) return;
    const result = applyRecoveryTransaction({ state, version, ledger, proposal: selected, expectedFingerprint: proposalFingerprint, expectedVersion: proposalVersion, disruptionProvenance: impact.disruption.provenance });
    if (result.success === false) { setStatus(['stale-plan', 'stale-version', 'invalid-version'].includes(result.error) ? 'Recovery plan is outdated. Please recalculate.' : 'Recovery plan could not be applied.'); return; }
    setVersion(result.version); setLedger(result.ledger); onApply(result.state);
    setStatus(`BookOnce itinerary updated • Version ${result.version.version}. No external booking was changed.`);
    setRecovery(undefined); setSelected(undefined);
  };
  const undo = () => {
    const result = undoLatestJourneyChange({ state, version, ledger });
    if (!result.success) { setStatus('Undo is unavailable because the itinerary has changed.'); return; }
    setVersion(result.version); setLedger(result.ledger); onApply(result.state);
    setStatus(`BookOnce itinerary updated • Version ${result.version.version}. Recovery undone locally.`);
  };

  if (!graph || !adapted.nodes.length) return <Card><CardContent className="p-4">Recovery simulation unavailable because this itinerary does not contain enough dependency information.</CardContent></Card>;
  return <Card data-testid="resilience-panel">
    <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Travel resilience</CardTitle></CardHeader>
    <CardContent className="space-y-4">
      {!verifiedProvider && !impact && <p>Disruption monitoring not connected.</p>}
      {verifiedProvider && !flightEvidence.length && !impact && <p>Flight status check unavailable for this itinerary.</p>}
      {verifiedProvider && flightEvidence.length > 0 && !impact && <section className="space-y-2 rounded-lg border p-3">
        <div className="flex items-center gap-2"><h3 className="font-semibold">Verified flight status</h3><DataProvenanceBadge provenance="verified" /></div>
        <Button type="button" onClick={checkFlightStatus} disabled={checking}>{checking ? 'Checking flight status…' : 'Check flight status'}</Button>
      </section>}
      <p>{ledger.getEntries().length} local itinerary {ledger.getEntries().length === 1 ? 'change' : 'changes'} • Version {version.version}</p>
      {ledger.latest()?.operation === 'apply' && <Button type="button" variant="outline" onClick={undo}>Undo recovery</Button>}
      {simulationEnabled && <section aria-labelledby="simulation-heading" className="space-y-3 rounded-lg border p-3">
        <div className="flex items-center gap-2"><h3 id="simulation-heading" className="font-semibold">Simulate disruption</h3><DataProvenanceBadge provenance="simulation" /></div>
        <label className="grid gap-1">Scenario<select aria-label="Simulation scenario" className="rounded border p-2" value={scenario} onChange={event => { setScenario(event.target.value as SimulationScenario); setTargetId(''); }}>
          {scenarios.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select></label>
        <label className="grid gap-1">Itinerary item<select aria-label="Disruption target" className="rounded border p-2" value={selectedTarget} onChange={event => setTargetId(event.target.value)}>
          {eligibleNodes.map(node => <option key={node.id} value={node.id}>{nodeLabel(state.itinerary, node.id)}</option>)}
        </select></label>
        <Button type="button" onClick={simulate} disabled={!selectedTarget}>Run simulation</Button>
        {!selectedTarget && <p>No compatible itinerary item is available for this scenario.</p>}
      </section>}
      {impact && <section aria-labelledby="impact-heading" className="space-y-2">
        <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /><h3 id="impact-heading" className="font-semibold">{impactSource === 'provider' ? 'Verified provider impact' : 'Simulation impact'}</h3><DataProvenanceBadge provenance={impactSource === 'provider' ? 'verified' : 'simulation'} /></div>
        <p><b>Classification:</b> {impact.classification}</p><p><b>Recovery required:</b> {impact.recoveryRequired ? 'Yes' : 'No'}</p>
        <div><h4 className="font-semibold">Directly affected</h4><p>{nodeLabel(state.itinerary, impact.directlyAffectedNode.nodeId)} — {impact.directlyAffectedNode.reasons.map(reason => reasonLabels[reason] ?? reason).join(', ')}</p></div>
        <div><h4 className="font-semibold">Potentially affected</h4>{impact.downstreamAffectedNodes.length ? impact.downstreamAffectedNodes.map(item => <p key={item.nodeId}>{nodeLabel(state.itinerary, item.nodeId)}</p>) : <p>None identified.</p>}</div>
        <div><h4 className="flex items-center gap-2 font-semibold">Confirmed conflicts <DataProvenanceBadge provenance="bookonce-derived" /></h4>{impact.temporalViolations.length ? impact.temporalViolations.map(item => <p key={`${item.from}-${item.to}`}>{nodeLabel(state.itinerary, item.to)} starts before the affected dependency can complete.</p>) : <p>None confirmed.</p>}</div>
        <div><h4 className="font-semibold">Unaffected and preserved</h4><p>{impact.unaffectedNodes.length ? impact.unaffectedNodes.map(id => nodeLabel(state.itinerary, id)).join(', ') : 'None identified.'}</p></div>
        {impact.limitations.length > 0 && <div><h4 className="font-semibold">Limitations</h4>{impact.limitations.map(item => <p key={item}>{reasonLabels[item] ?? item}</p>)}</div>}
      </section>}
      {impact?.recoveryRequired && recovery?.status === 'recovery-proposed' && <section aria-labelledby="recovery-heading" className="space-y-2">
        <h3 id="recovery-heading" className="font-semibold">Recovery options</h3>
        {recovery.rankedCandidates.map((candidate, index) => <div key={candidate.id}>
          {index === 0 && <p className="font-semibold">Recommended recovery</p>}
          <RecoveryCard candidate={candidate} selected={selected?.id === candidate.id} onSelect={() => setSelected(candidate)} itinerary={state.itinerary} />
        </div>)}
        {selected && <div className="rounded-lg bg-muted p-3"><h4 className="font-semibold">Proposed changes</h4><p>{selected.action.type === 'replace_transport_route' ? `Switch ${nodeLabel(state.itinerary, selected.action.nodeId)} to route ${selected.action.replacementRouteId}.` : `Move ${nodeLabel(state.itinerary, selected.action.nodeId)} to ${selected.action.newStartTime}–${selected.action.newEndTime}.`}</p></div>}
        <Button type="button" onClick={apply}>Apply recovery plan</Button>
      </section>}
      {impact?.recoveryRequired && recovery?.status === 'no-valid-recovery' && <section><h3 className="font-semibold">No valid automatic recovery available</h3><p>Preserved items: {recovery.preservedNodeIds.length}</p>{recovery.unresolvedViolations.map(item => <p key={`${item.nodeId}-${item.reason}`}>{nodeLabel(state.itinerary, item.nodeId)}: {reasonLabels[item.type] ?? item.reason}</p>)}</section>}
      {impact && <Button type="button" variant="outline" onClick={dismiss}>Dismiss {impactSource === 'provider' ? 'provider update' : 'simulation'}</Button>}
      {status && <p role="status">{status}</p>}
    </CardContent>
  </Card>;
}
