import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { JourneyResiliencePanel } from '../JourneyResiliencePanel';
import type { RecoveryApplicationState } from '../recoveryApplication';

function fixture(): RecoveryApplicationState {
  const routeExplanation = { dominantPreference: 'time' as const, advantages: [], tradeOffs: [] };
  return { selectedRouteIds: { 1: 'current' }, itinerary: {
    origin: { name: 'Airport' }, destination: { name: 'City' }, summary: 'Connected trip',
    segments: [
      { activityId: 'flight', mode: 'flight' as const, from: { name: 'Origin' }, to: { name: 'Airport' }, flexibility: 'fixed' as const, departureTime: '09:00', arrivalTime: '10:00' },
      { activityId: 'transfer', mode: 'car' as const, from: { name: 'Airport' }, to: { name: 'Hotel' }, flexibility: 'flexible' as const, departureTime: '11:00', arrivalTime: '12:00', selectedRouteCandidateId: 'current', routeDuration: 3600, routeDistance: 10000, routingStatus: 'routed' as const, routeGeometry: [[1, 1]] as [number, number][], routingAlternatives: [
        { id: 'current', label: 'Current', mode: 'drive' as const, duration: 3600, distance: 10000, estimatedCost: 300, geometry: [[1, 1]] as [number, number][], rank: 1, score: 0, qualityScore: 100, explanation: routeExplanation },
        { id: 'fast', label: 'Fast', mode: 'drive' as const, duration: 1800, distance: 9000, estimatedCost: 400, geometry: [[2, 2]] as [number, number][], rank: 2, score: 0.2, qualityScore: 80, explanation: routeExplanation },
      ] },
      { activityId: 'museum', activityCategory: 'indoor' as const, mode: 'walk' as const, from: { name: 'Hotel' }, to: { name: 'Museum' }, flexibility: 'fixed' as const, departureTime: '15:00', arrivalTime: '16:00' },
      { activityId: 'dinner', activityCategory: 'indoor' as const, mode: 'walk' as const, from: { name: 'Hotel' }, to: { name: 'Dinner' }, flexibility: 'fixed' as const, departureTime: '18:00', arrivalTime: '19:00' },
    ],
  } };
}
const dependencies = [{ from: 'flight', to: 'transfer' }, { from: 'transfer', to: 'museum' }] as const;

describe('JourneyResiliencePanel', () => {
  it('uses truthful normal and simulation labels without claiming live monitoring', () => {
    render(<JourneyResiliencePanel state={fixture()} explicitDependencies={dependencies} onApply={vi.fn()} />);
    expect(screen.getByText('Disruption monitoring not connected.')).toBeInTheDocument();
    expect(screen.getByText('SIMULATION')).toBeInTheDocument();
    expect(screen.queryByText(/all routes clear|live monitoring active|no delays detected/i)).not.toBeInTheDocument();
  });

  it.each([
    ['delay-30', 'transport'], ['delay-180', 'transport'], ['transport-cancellation', 'transport'], ['activity-closure', 'activity'],
  ])('validates and presents %s explicitly as simulation', async (scenario) => {
    render(<JourneyResiliencePanel state={fixture()} explicitDependencies={dependencies} onApply={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Simulation scenario'), { target: { value: scenario } });
    fireEvent.click(screen.getByRole('button', { name: 'Run simulation' }));
    expect(await screen.findByRole('heading', { name: 'Simulation impact' })).toBeInTheDocument();
    expect(screen.getAllByText('SIMULATION').length).toBeGreaterThanOrEqual(2);
  });

  it('separates potential impact from confirmed conflicts and avoids recovery for a buffered delay', async () => {
    render(<JourneyResiliencePanel state={fixture()} explicitDependencies={dependencies} onApply={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Run simulation' }));
    await screen.findByRole('heading', { name: 'Simulation impact' });
    expect(screen.getByText('Potentially affected')).toBeInTheDocument();
    expect(screen.getByText('Confirmed conflicts')).toBeInTheDocument();
    expect(screen.getByText('advisory')).toBeInTheDocument();
    expect(screen.queryByText('Recovery options')).not.toBeInTheDocument();
  });

  it('uses the planner recommendation, requires apply, and applies only the loaded route', async () => {
    const applied = vi.fn();
    render(<JourneyResiliencePanel state={fixture()} explicitDependencies={dependencies} onApply={applied} />);
    fireEvent.change(screen.getByLabelText('Simulation scenario'), { target: { value: 'delay-180' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run simulation' }));
    expect(await screen.findByText('Recommended recovery')).toBeInTheDocument();
    expect(applied).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Apply recovery plan' }));
    expect(applied).toHaveBeenCalledTimes(1);
    expect(applied.mock.calls[0][0].itinerary.segments[1]).toMatchObject({ selectedRouteCandidateId: 'fast', routeGeometry: [[2, 2]] });
    expect(applied.mock.calls[0][0].itinerary.segments[3]).toEqual(fixture().itinerary.segments[3]);
    expect(screen.getByRole('status')).toHaveTextContent('BookOnce itinerary updated');
  });

  it('rejects a stale proposal and dismisses without applying', async () => {
    const applied = vi.fn(); const initial = fixture();
    const { rerender } = render(<JourneyResiliencePanel state={initial} explicitDependencies={dependencies} onApply={applied} />);
    fireEvent.change(screen.getByLabelText('Simulation scenario'), { target: { value: 'delay-180' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run simulation' }));
    await screen.findByText('Recommended recovery');
    rerender(<JourneyResiliencePanel state={{ ...initial, selectedRouteIds: { 1: 'fast' } }} explicitDependencies={dependencies} onApply={applied} />);
    fireEvent.click(screen.getByRole('button', { name: 'Apply recovery plan' }));
    expect(screen.getByRole('status')).toHaveTextContent('Recovery plan is outdated. Please recalculate.');
    expect(applied).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss simulation' }));
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Simulation impact' })).not.toBeInTheDocument());
    expect(applied).not.toHaveBeenCalled();
  });

  it('shows no valid recovery without a fabricated fallback or apply action', async () => {
    const state = fixture();
    state.itinerary.segments[1] = { ...state.itinerary.segments[1], routingAlternatives: undefined };
    render(<JourneyResiliencePanel state={state} explicitDependencies={dependencies} onApply={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Simulation scenario'), { target: { value: 'delay-180' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run simulation' }));
    expect(await screen.findByRole('heading', { name: 'No valid automatic recovery available' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Apply recovery plan' })).not.toBeInTheDocument();
    expect(screen.queryByText(/fallback route/i)).not.toBeInTheDocument();
  });

  it('shows a versioned session audit summary and appends a safe undo', async () => {
    const applied = vi.fn();
    const initial = fixture();
    const { rerender } = render(<JourneyResiliencePanel state={initial} explicitDependencies={dependencies} onApply={applied} />);
    expect(screen.getByText('0 local itinerary changes • Version 0')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Simulation scenario'), { target: { value: 'delay-180' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run simulation' })); await screen.findByText('Recommended recovery');
    fireEvent.click(screen.getByRole('button', { name: 'Apply recovery plan' }));
    const recovered = applied.mock.calls[0][0];
    expect(screen.getByText('1 local itinerary change • Version 1')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Version 1');
    rerender(<JourneyResiliencePanel state={recovered} explicitDependencies={dependencies} onApply={applied} />);
    fireEvent.click(screen.getByRole('button', { name: 'Undo recovery' }));
    expect(applied).toHaveBeenCalledTimes(2);
    expect(applied.mock.calls[1][0].itinerary.segments[1]).toMatchObject({ selectedRouteCandidateId: 'current', routeGeometry: [[1, 1]] });
    expect(screen.getByText('2 local itinerary changes • Version 2')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Recovery undone locally');
  });
});
