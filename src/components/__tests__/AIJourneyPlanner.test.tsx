import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import AIJourneyPlanner, { JourneyResult } from '../AIJourneyPlanner';
import { JourneyRequestSchema } from '@/features/journey/schemas/aiSchemas';
import { bookOnceAIService } from '@/features/journey/services/BookOnceAIService';
import { buildJourneyRequest } from '@/features/journey/utils/journeyRequestMapper';
import { journeyEnrichmentService } from '@/features/journey/services/JourneyEnrichmentService';
import { weatherService } from '@/services/WeatherService';
import { routingService } from '@/services/RoutingService';

vi.mock('@/features/journey/services/BookOnceAIService', () => ({
  bookOnceAIService: { generateItinerary: vi.fn() },
}));
vi.mock('@/features/journey/services/JourneyEnrichmentService', () => ({
  journeyEnrichmentService: { enrich: vi.fn() },
}));
vi.mock('@/services/WeatherService', () => ({ weatherService: { getForecast: vi.fn() } }));
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

  it('renders the optional route-preference field', () => {
    render(<AIJourneyPlanner />);
    expect(screen.getByLabelText('Route preferences (Optional)')).toHaveAttribute(
      'placeholder', 'e.g. Cheapest possible, but avoid long walks'
    );
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
    expect(journeyEnrichmentService.enrich).toHaveBeenCalledWith(itinerary, expect.objectContaining({
      constraints: {}, preferenceLabel: 'Balanced',
    }));
  });

  it('renders structured segments and available estimates', () => {
    render(<JourneyResult itinerary={itinerary} />);
    expect(screen.getByText(/train: Pune Station → Mumbai Station/i)).toBeInTheDocument();
    expect(screen.getByText(/Estimated duration:/)).toBeInTheDocument();
    expect(screen.getByText(/Suggested estimated cost:/)).toBeInTheDocument();
    expect(screen.queryByText(/live price/i)).not.toBeInTheDocument();
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

  it('shows a deterministic explanation only for a verified route', () => {
    const routed = { ...itinerary.segments[0], routeDistance: 145000, routeDuration: 10800, routingStatus: 'routed' as const };
    render(<JourneyResult itinerary={{ ...itinerary, segments: [routed] }} travelStyle="urgent" />);
    expect(screen.getByTestId('route-explanation')).toHaveTextContent('Why this route?');
    expect(screen.getByTestId('route-explanation')).toHaveTextContent('Only verified route currently available');
    expect(screen.getByTestId('route-explanation')).toHaveTextContent('BookOnce optimized this route for time');
    expect(screen.getByTestId('route-explanation')).toHaveTextContent('Optimization score: 100/100');
  });

  it('shows genuine alternatives and updates all selected facts locally without service requests', () => {
    const firstGeometry: [number, number][] = [[77, 12], [78, 13]];
    const secondGeometry: [number, number][] = [[77, 12], [79, 14]];
    const explanation = (dominantPreference: 'time' | 'walking', advantage: string) => ({ dominantPreference, advantages: [advantage], tradeOffs: [] });
    const routed = {
      ...itinerary.segments[0],
      routeDistance: 10000,
      routeDuration: 600,
      routeGeometry: firstGeometry,
      routingStatus: 'routed' as const,
      selectedRouteCandidateId: 'recommended',
      routingAlternatives: [
        { id: 'recommended', label: 'Primary route', mode: 'drive' as const, distance: 10000, duration: 600, estimatedCost: 240, costEstimateSource: 'bookonce-estimate' as const, costEstimateModel: 'taxi-distance-v1', costCurrency: 'INR' as const, geometry: firstGeometry, rank: 1, score: 0, qualityScore: 100, explanation: explanation('time', 'Fastest eligible option') },
        { id: 'alternate', label: 'Alternative 1', mode: 'drive' as const, distance: 12000, duration: 900, estimatedCost: 275, costEstimateSource: 'bookonce-estimate' as const, costEstimateModel: 'taxi-distance-v1', costCurrency: 'INR' as const, geometry: secondGeometry, rank: 2, score: 0.3, qualityScore: 70, explanation: explanation('walking', 'Least known walking distance') },
      ],
    };
    const result = { ...itinerary, origin: { name: 'Pune', latitude: 12, longitude: 77 }, destination: { name: 'Mumbai', latitude: 13, longitude: 78 }, segments: [routed] };
    const aiCallsBeforeRender = vi.mocked(bookOnceAIService.generateItinerary).mock.calls.length;
    const routingSpy = vi.spyOn(routingService, 'getRoutes');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(<JourneyResult itinerary={result} />);
    const recommendedButton = screen.getByRole('button', { name: /Select Recommended route, 10 minutes, 10 km/ });
    expect(recommendedButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Route options')).toBeInTheDocument();
    expect(recommendedButton).toHaveTextContent('Recommended');
    expect(recommendedButton).toHaveTextContent('Fastest');
    expect(screen.queryByText('Cheapest')).not.toBeInTheDocument();
    expect(screen.getByText(/Verified road duration:/).closest('p')).toHaveTextContent('10 minutes');
    expect(screen.getByTestId('route-explanation')).toHaveTextContent('Fastest eligible option');
    expect(screen.getByText(/BookOnce estimated cost:/).closest('div')).toHaveTextContent('Approx. ₹240');

    const alternativeButton = screen.getByRole('button', { name: /Select Alternative 1, 15 minutes, 12 km/ });
    fireEvent.click(alternativeButton);
    expect(alternativeButton).toHaveAttribute('aria-pressed', 'true');
    expect(recommendedButton).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText(/Verified road duration:/).closest('p')).toHaveTextContent('15 minutes');
    expect(screen.getByText(/Verified road distance:/).closest('p')).toHaveTextContent('12 km');
    expect(screen.getByTestId('route-explanation')).toHaveTextContent('Least known walking distance');
    expect(screen.getByTestId('route-explanation')).toHaveTextContent('70/100');
    expect(screen.getByText(/BookOnce estimated cost:/).closest('div')).toHaveTextContent('Approx. ₹275');
    expect(screen.getByTestId('route-explanation')).toHaveTextContent('5 min slower than recommended');
    expect(screen.getByTestId('route-explanation')).toHaveTextContent('Approx. ₹35 higher estimated cost than recommended');
    expect(screen.getByTestId('journey-map').getAttribute('data-props')).toContain('[{"lat":12,"lng":77},{"lat":14,"lng":79}]');
    expect(bookOnceAIService.generateItinerary).toHaveBeenCalledTimes(aiCallsBeforeRender);
    expect(routingSpy).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does not render alternative controls for one real candidate', () => {
    const routed = { ...itinerary.segments[0], routeDistance: 1000, routeDuration: 100, routingStatus: 'routed' as const };
    render(<JourneyResult itinerary={{ ...itinerary, segments: [routed] }} />);
    expect(screen.queryByText('Route options')).not.toBeInTheDocument();
    expect(screen.getByText('Only one verified route is currently available.')).toBeInTheDocument();
  });

  it('labels lowest estimated cost only when every option has comparable cost data', () => {
    const explanation = { dominantPreference: 'cost' as const, advantages: [], tradeOffs: [] };
    const common = { mode: 'drive' as const, geometry: [] as [number, number][], score: 0.2, qualityScore: 80, explanation };
    const routed = {
      ...itinerary.segments[0], routingStatus: 'routed' as const, selectedRouteCandidateId: 'winner',
      routingAlternatives: [
        { ...common, id: 'winner', label: 'Primary', distance: 1000, duration: 600, estimatedCost: 300, rank: 1 },
        { ...common, id: 'low', label: 'Alternative', distance: 1100, duration: 700, estimatedCost: 200, rank: 2 },
      ],
    };
    const { rerender } = render(<JourneyResult itinerary={{ ...itinerary, segments: [routed] }} />);
    expect(screen.getByRole('button', { name: /Select Lowest estimated cost/ })).toBeInTheDocument();
    rerender(<JourneyResult itinerary={{ ...itinerary, segments: [{ ...routed, routingAlternatives: [routed.routingAlternatives[0], { ...routed.routingAlternatives[1], estimatedCost: undefined }] }] }} />);
    expect(screen.queryByText('Lowest estimated cost')).not.toBeInTheDocument();
    expect(screen.queryByText('Approx. ₹0')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Select Alternative 1/ }));
    expect(screen.queryByText(/BookOnce estimated cost:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Suggested estimated cost:/)).not.toBeInTheDocument();
  });

  it('handles a selected route with missing geometry without fabricating a line', () => {
    const explanation = { dominantPreference: 'time' as const, advantages: [], tradeOffs: [] };
    const routed = {
      ...itinerary.segments[0], routingStatus: 'routed' as const, selectedRouteCandidateId: 'one',
      routingAlternatives: [
        { id: 'one', label: 'Primary', mode: 'drive' as const, distance: 1000, duration: 100, geometry: [[77, 12]] as [number, number][], rank: 1, score: 0, qualityScore: 100, explanation },
        { id: 'two', label: 'Alternative', mode: 'drive' as const, distance: 1200, duration: 120, geometry: [] as [number, number][], rank: 2, score: 0.2, qualityScore: 80, explanation },
      ],
    };
    render(<JourneyResult itinerary={{ ...itinerary, origin: { name: 'Pune', latitude: 12, longitude: 77 }, destination: { name: 'Mumbai', latitude: 13, longitude: 78 }, segments: [routed] }} />);
    fireEvent.click(screen.getByRole('button', { name: /Select Alternative 1/ }));
    expect(screen.getByTestId('journey-map')).toHaveAttribute('data-props', expect.stringContaining('"route":[]'));
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

  it('shows and applies a deterministic weather replan without moving fixed events', async () => {
    const weatherItinerary = {
      ...itinerary,
      destination: { name: 'Mumbai', latitude: 19, longitude: 72 },
      segments: [
        { ...itinerary.segments[0], activityId: 'park', activityCategory: 'outdoor' as const, flexibility: 'flexible' as const, departureTime: '09:00', instructions: 'Park visit' },
        { ...itinerary.segments[0], activityId: 'museum', activityCategory: 'indoor' as const, flexibility: 'flexible' as const, departureTime: '11:00', instructions: 'Museum visit' },
      ],
    };
    vi.mocked(bookOnceAIService.generateItinerary).mockResolvedValue(itinerary);
    vi.mocked(journeyEnrichmentService.enrich).mockResolvedValue(weatherItinerary);
    vi.mocked(weatherService.getForecast).mockResolvedValue({ status: 'available', hourly: [
      { timestamp: '2026-09-15T09:00', temperatureC: 28, apparentTemperatureC: 29, precipitationProbability: 90, precipitationMm: 5, weatherCode: 65, windSpeedKph: 10 },
      { timestamp: '2026-09-15T11:00', temperatureC: 28, apparentTemperatureC: 29, precipitationProbability: 0, precipitationMm: 0, weatherCode: 0, windSpeedKph: 5 },
    ] });
    render(<AIJourneyPlanner />); fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: 'Generate AI Journey Plan' }));
    expect(await screen.findByRole('button', { name: 'Apply suggested replan' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Apply suggested replan' }));
    const instructions = screen.getAllByText(/visit$/i).map(node => node.textContent);
    expect(instructions[0]).toContain('Museum visit');
    expect(screen.getByTestId('weather-notice')).toHaveTextContent('Suggested weather replan applied');
    expect(screen.queryByText(/danger|Gemini.*replan/i)).not.toBeInTheDocument();
  });
});
