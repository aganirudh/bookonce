import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import AIJourneyPlanner, { JourneyResult } from '../AIJourneyPlanner';
import { JourneyRequestSchema } from '@/features/journey/schemas/aiSchemas';
import { bookOnceAIService } from '@/features/journey/services/BookOnceAIService';
import { buildJourneyRequest } from '@/features/journey/utils/journeyRequestMapper';
import { journeyEnrichmentService } from '@/features/journey/services/JourneyEnrichmentService';

vi.mock('@/features/journey/services/BookOnceAIService', () => ({
  bookOnceAIService: { generateItinerary: vi.fn() },
}));
vi.mock('@/features/journey/services/JourneyEnrichmentService', () => ({
  journeyEnrichmentService: { enrich: vi.fn() },
}));
vi.mock('@/features/journey/components/JourneyMap', () => ({
  default: (props: unknown) => <div data-testid="journey-map" data-props={JSON.stringify(props)} />,
}));

const itinerary = {
  origin: { name: 'Pune' },
  destination: { name: 'Mumbai' },
  segments: [
    {
      mode: 'train' as const,
      from: { name: 'Pune Station' },
      to: { name: 'Mumbai Station' },
      duration: 180,
      estimatedCost: 800,
      instructions: 'Confirm the platform before departure.',
    },
  ],
  totalDuration: 180,
  summary: 'A suggested train itinerary.',
};

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText('From'), { target: { value: 'Pune' } });
  fireEvent.change(screen.getByLabelText('To'), { target: { value: 'Mumbai' } });
  fireEvent.change(screen.getByLabelText('Departure Date'), { target: { value: '2026-09-15' } });
}

describe('AIJourneyPlanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(journeyEnrichmentService.enrich).mockImplementation(async value => value);
  });

  it('maps its form data into the existing JourneyRequest contract', () => {
    const request = buildJourneyRequest({
      origin: ' Pune ', destination: ' Mumbai ', departureDate: '2026-09-15',
      departureTime: '09:00', returnDate: '2026-09-18', travelers: '3',
      intent: 'urgent', userName: 'Traveler',
    });
    expect(JourneyRequestSchema.safeParse(request).success).toBe(true);
    expect(request).toEqual({
      origin: { name: 'Pune' }, destination: { name: 'Mumbai' },
      departureDate: '2026-09-15', returnDate: '2026-09-18', travelers: 3,
      travelStyle: 'urgent',
    });
  });

  it('calls generateItinerary, shows loading, and prevents duplicate submission', async () => {
    let resolveRequest!: (value: typeof itinerary) => void;
    vi.mocked(bookOnceAIService.generateItinerary).mockReturnValue(
      new Promise(resolve => { resolveRequest = resolve; })
    );
    render(<AIJourneyPlanner />);
    fillRequiredFields();
    const button = screen.getByRole('button', { name: 'Generate AI Journey Plan' });
    fireEvent.click(button);
    expect(screen.getByText('Generating Your Journey...')).toBeInTheDocument();
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(bookOnceAIService.generateItinerary).toHaveBeenCalledTimes(1);
    resolveRequest(itinerary);
    expect(await screen.findByText(/Pune → Mumbai/)).toBeInTheDocument();
    expect(journeyEnrichmentService.enrich).toHaveBeenCalledWith(itinerary);
  });

  it('renders structured segments and available estimates', () => {
    render(<JourneyResult itinerary={itinerary} />);
    expect(screen.getByText(/train: Pune Station → Mumbai Station/i)).toBeInTheDocument();
    expect(screen.getByText(/Estimated duration:/)).toBeInTheDocument();
    expect(screen.getByText(/Estimated cost:/)).toBeInTheDocument();
    expect(screen.getByText(/Confirm the platform/)).toBeInTheDocument();
  });

  it('does not render undefined labels for missing optional fields', () => {
    render(<JourneyResult itinerary={{ ...itinerary, segments: [], totalDuration: undefined }} />);
    expect(screen.queryByText(/undefined/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Estimated total duration:/)).not.toBeInTheDocument();
  });

  it('prioritizes verified route values over AI estimates', () => {
    render(<JourneyResult itinerary={{ ...itinerary, segments: [{ ...itinerary.segments[0], distance: 999, duration: 999, routeDistance: 145000, routeDuration: 10800, routingStatus: 'routed' }] }} />);
    expect(screen.getByText(/Verified road distance:/).closest('p')).toHaveTextContent('145 km');
    expect(screen.getByText(/Verified road duration:/).closest('p')).toHaveTextContent('180 minutes');
    expect(screen.queryByText(/999 km/)).not.toBeInTheDocument();
  });

  it('renders estimates when authoritative route values are absent', () => {
    render(<JourneyResult itinerary={{ ...itinerary, segments: [{ ...itinerary.segments[0], distance: 12, duration: 30 }] }} />);
    expect(screen.getByText(/Estimated distance:/).closest('p')).toHaveTextContent('12 km');
    expect(screen.getByText(/Estimated duration:/).closest('p')).toHaveTextContent('30 minutes');
  });

  it('renders partial enrichment with non-fatal route feedback', async () => {
    vi.mocked(bookOnceAIService.generateItinerary).mockResolvedValue(itinerary);
    vi.mocked(journeyEnrichmentService.enrich).mockResolvedValue({ ...itinerary, segments: [{ ...itinerary.segments[0], routingStatus: 'unavailable' }] });
    render(<AIJourneyPlanner />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: 'Generate AI Journey Plan' }));
    expect(await screen.findByText(/Pune → Mumbai/)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Route details could not be verified for some segments.');
  });

  it('only feeds the map deterministic coordinates and provider geometry', () => {
    render(<JourneyResult itinerary={{ ...itinerary, origin: { name: 'Pune' }, destination: { name: 'Mumbai' } }} />);
    expect(screen.queryByTestId('journey-map')).not.toBeInTheDocument();
  });

  it('renders a friendly error and no fabricated itinerary when the API fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(bookOnceAIService.generateItinerary).mockRejectedValue(new Error('provider secret'));
    render(<AIJourneyPlanner />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: 'Generate AI Journey Plan' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent("We couldn't generate this itinerary. Please try again."));
    expect(screen.queryByTestId('journey-result')).not.toBeInTheDocument();
    expect(screen.queryByText(/provider secret/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Prepare & Depart/i)).not.toBeInTheDocument();
  });
});
