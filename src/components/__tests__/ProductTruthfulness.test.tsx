import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import JourneyVisualization, { type JourneyStep } from '../JourneyVisualization';
import { ContextLayerPanel } from '../ContextLayer';
import { DataProvenanceBadge } from '../ui/data-provenance';
import { JourneyPaymentButton } from '@/components/JourneyPaymentButton';
import { getPayableAmount } from '@/utils/paymentAvailability';

const step = (type: 'bus' | 'walk', cost?: string, duration = '10 min'): JourneyStep => ({
  id: 'step-1',
  title: 'Station transfer',
  location: 'Pune',
  options: [{
    id: `${type}-1`, type, from: 'A', to: 'B', duration, cost,
    provider: 'BookOnce', description: `${type} option`,
  }],
});

describe('product truthfulness states', () => {
  it('does not turn missing journey duration or cost into zero', async () => {
    const onSummaryUpdate = vi.fn();
    render(<JourneyVisualization steps={[step('bus', undefined, '')]} journeyType="outbound" onSummaryUpdate={onSummaryUpdate} />);

    await waitFor(() => expect(onSummaryUpdate).toHaveBeenLastCalledWith({ duration: null, cost: null, modes: 0 }));
    fireEvent.click(screen.getByText('bus option'));

    expect(screen.getAllByText('Not calculated')).toHaveLength(2);
    expect(screen.queryByText('0m')).not.toBeInTheDocument();
    expect(screen.queryByText('₹0')).not.toBeInTheDocument();
  });

  it('preserves a legitimate zero walking estimate', async () => {
    const onSummaryUpdate = vi.fn();
    render(<JourneyVisualization steps={[step('walk')]} journeyType="outbound" onSummaryUpdate={onSummaryUpdate} />);
    fireEvent.click(screen.getByText('walk option'));

    expect(screen.getByText('₹0')).toBeInTheDocument();
    await waitFor(() => expect(onSummaryUpdate).toHaveBeenLastCalledWith({ duration: '10m', cost: 0, modes: 1 }));
  });

  it('rejects missing, invalid, and zero payable amounts', () => {
    expect(getPayableAmount(null)).toBeNull();
    expect(getPayableAmount(Number.NaN)).toBeNull();
    expect(getPayableAmount(0)).toBeNull();
    expect(getPayableAmount(1250)).toBe(1250);
  });

  it('disables payment and cannot invoke confirmation when price is unavailable', () => {
    const onConfirm = vi.fn();
    render(<JourneyPaymentButton amount={null} onConfirm={onConfirm} />);
    const button = screen.getByRole('button', { name: 'Price unavailable' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByText(/Confirm and Pay ₹0/)).not.toBeInTheDocument();
  });

  it('labels bundled context as demo data without live-monitoring claims', () => {
    render(<ContextLayerPanel isOpen onClose={vi.fn()} />);
    expect(screen.getByText('Demo travel context')).toBeInTheDocument();
    expect(screen.getByText(/Demo alerts for interface preview/)).toBeInTheDocument();
    expect(screen.queryByText(/Scanning 847/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Live Monitoring Active/i)).not.toBeInTheDocument();
  });

  it('provides reusable provenance labels', () => {
    const { rerender } = render(<DataProvenanceBadge provenance="verified" />);
    expect(screen.getByText('Verified')).toBeInTheDocument();
    rerender(<DataProvenanceBadge provenance="bookonce-estimate" />);
    expect(screen.getByText('BookOnce estimate')).toBeInTheDocument();
    rerender(<DataProvenanceBadge provenance="ai-suggestion" />);
    expect(screen.getByText('AI suggestion')).toBeInTheDocument();
    rerender(<DataProvenanceBadge provenance="unavailable" />);
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
    rerender(<DataProvenanceBadge provenance="simulation" />);
    expect(screen.getByText('SIMULATION')).toBeInTheDocument();
    rerender(<DataProvenanceBadge provenance="bookonce-derived" />);
    expect(screen.getByText('BookOnce derived')).toBeInTheDocument();
  });
});
