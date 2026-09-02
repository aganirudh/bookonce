import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JourneyResult } from '../AIJourneyPlanner';
import { skyscannerService, type FlightCandidate } from '@/services/SkyscannerService';
import { disruptionClient } from '@/services/DisruptionClient';

vi.mock('@/services/SkyscannerService', () => ({ skyscannerService: { searchFlights: vi.fn() } }));
vi.mock('@/features/journey/components/JourneyMap', () => ({ default: () => <div /> }));
const flights: FlightCandidate[] = [
  { provider: 'rapidapi-skyscanner', carrierCode: 'AI', carrierName: 'Air India', flightNumber: '101', departureAirportCode: 'DEL', arrivalAirportCode: 'FCO', scheduledDeparture: '2026-09-20T22:45:00Z', scheduledArrival: '2026-09-21T04:40:00Z' },
  { provider: 'rapidapi-skyscanner', carrierCode: 'AZ', carrierName: 'ITA Airways', flightNumber: '769', departureAirportCode: 'DEL', arrivalAirportCode: 'FCO', scheduledDeparture: '2026-09-20T03:00:00Z', scheduledArrival: '2026-09-20T11:00:00Z' },
];
const itinerary = { origin: { name: 'Delhi' }, destination: { name: 'Rome' }, summary: 'Flight journey', segments: [{ activityId: 'flight', mode: 'flight' as const, from: { name: 'Delhi airport' }, to: { name: 'Rome airport' }, departureTime: '22:45', arrivalTime: '04:40', flexibility: 'fixed' as const }] };
function fillAndSearch() { fireEvent.change(screen.getByLabelText('Origin airport'), { target: { value: 'DEL' } }); fireEvent.change(screen.getByLabelText('Destination airport'), { target: { value: 'FCO' } }); fireEvent.change(screen.getByLabelText('Departure date'), { target: { value: '2026-09-20' } }); fireEvent.click(screen.getByRole('button', { name: 'Search flights' })); }

describe('Journey flight selection flow', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(skyscannerService.searchFlights).mockResolvedValue(flights); vi.spyOn(disruptionClient, 'providers').mockResolvedValue([{ provider: 'Aviationstack', capabilities: ['flight_status'] }]); vi.spyOn(disruptionClient, 'check').mockResolvedValue({ results: [{ status: 'verified-clear' }] }); });
  it('binds operational identity and performs status lookup only on the explicit button', async () => {
    render(<JourneyResult itinerary={itinerary} />); fillAndSearch(); fireEvent.click(await screen.findByRole('button', { name: /Select AI101 from DEL to FCO/ }));
    expect(disruptionClient.check).not.toHaveBeenCalled(); const check = await screen.findByRole('button', { name: 'Check flight status' }); expect(disruptionClient.check).not.toHaveBeenCalled(); fireEvent.click(check);
    expect(await screen.findByRole('status')).toHaveTextContent('No verified disruption found for this flight.'); expect(disruptionClient.check).toHaveBeenCalledTimes(1);
    expect(vi.mocked(disruptionClient.check).mock.calls[0][0].query.subjects[0]).toMatchObject({ carrierCode: 'AI', flightNumber: '101', originCode: 'DEL', destinationCode: 'FCO', scheduledDeparture: '2026-09-20T22:45:00Z' });
  });
  it('clears a previous status when another flight is selected', async () => {
    render(<JourneyResult itinerary={itinerary} />); fillAndSearch(); fireEvent.click(await screen.findByRole('button', { name: /Select AI101/ })); fireEvent.click(await screen.findByRole('button', { name: 'Check flight status' })); await screen.findByText('No verified disruption found for this flight.'); fireEvent.click(screen.getByRole('button', { name: /Select AZ769/ }));
    await waitFor(() => expect(screen.queryByText('No verified disruption found for this flight.')).not.toBeInTheDocument()); expect(screen.getAllByText('ITA Airways AZ769').length).toBeGreaterThan(0); expect(disruptionClient.check).toHaveBeenCalledTimes(1);
  });
});
