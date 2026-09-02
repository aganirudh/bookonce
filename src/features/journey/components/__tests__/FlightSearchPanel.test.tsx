import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlightSearchPanel } from '../FlightSearchPanel';
import { skyscannerService, type FlightCandidate } from '@/services/SkyscannerService';

vi.mock('@/services/SkyscannerService', () => ({ skyscannerService: { searchFlights: vi.fn() } }));
const candidate: FlightCandidate = { provider: 'rapidapi-skyscanner', providerItineraryId: 'p-1', carrierCode: 'AI', carrierName: 'Air India', flightNumber: '202', departureAirportCode: 'DEL', arrivalAirportCode: 'BOM', scheduledDeparture: '2026-09-20T09:00:00+05:30', scheduledArrival: '2026-09-20T11:00:00+05:30', formattedPrice: '₹8,500' };
function fill() { fireEvent.change(screen.getByLabelText('Origin airport'), { target: { value: 'del' } }); fireEvent.change(screen.getByLabelText('Destination airport'), { target: { value: 'bom' } }); fireEvent.change(screen.getByLabelText('Departure date'), { target: { value: '2026-09-20' } }); }

describe('FlightSearchPanel', () => {
  beforeEach(() => vi.clearAllMocks());
  it('searches through the service, renders normalized facts, and changes nothing until selection', async () => {
    vi.mocked(skyscannerService.searchFlights).mockResolvedValue([candidate]); const select = vi.fn(); render(<FlightSearchPanel canBind onSelect={select} />); fill(); fireEvent.click(screen.getByRole('button', { name: 'Search flights' }));
    expect(screen.getByText('Searching flights…')).toBeInTheDocument(); expect(select).not.toHaveBeenCalled();
    expect(await screen.findByText('₹8,500')).toBeInTheDocument(); expect(screen.getByText('DEL → BOM')).toBeInTheDocument(); expect(select).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Select AI202 from DEL to BOM/ })); expect(select).toHaveBeenCalledWith(candidate);
    expect(skyscannerService.searchFlights).toHaveBeenCalledWith(expect.objectContaining({ originSkyId: 'DEL', destinationSkyId: 'BOM', adults: 1, cabinClass: 'economy' }));
  });
  it('shows no results, safe failures, and missing price truthfully', async () => {
    vi.mocked(skyscannerService.searchFlights).mockResolvedValueOnce([]); const { unmount } = render(<FlightSearchPanel canBind onSelect={vi.fn()} />); fill(); fireEvent.click(screen.getByRole('button', { name: 'Search flights' })); expect(await screen.findByText('No flights were found for this search.')).toBeInTheDocument(); unmount();
    vi.mocked(skyscannerService.searchFlights).mockResolvedValueOnce([{ ...candidate, formattedPrice: undefined, price: undefined }]); render(<FlightSearchPanel canBind onSelect={vi.fn()} />); fill(); fireEvent.click(screen.getByRole('button', { name: 'Search flights' })); expect(await screen.findByText('Price unavailable')).toBeInTheDocument(); expect(screen.queryByText(/₹0/)).not.toBeInTheDocument();
  });
  it('validates IATA, route, date, and prevents binding without a flight segment', async () => {
    render(<FlightSearchPanel canBind={false} onSelect={vi.fn()} />); fireEvent.change(screen.getByLabelText('Origin airport'), { target: { value: 'D' } }); fireEvent.click(screen.getByRole('button', { name: 'Search flights' })); expect(screen.getByRole('alert')).toHaveTextContent('three-letter'); expect(skyscannerService.searchFlights).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Origin airport'), { target: { value: 'DEL' } }); fireEvent.change(screen.getByLabelText('Destination airport'), { target: { value: 'DEL' } }); fireEvent.change(screen.getByLabelText('Departure date'), { target: { value: '2026-09-20' } }); fireEvent.click(screen.getByRole('button', { name: 'Search flights' })); expect(screen.getByRole('alert')).toHaveTextContent('must be different');
    vi.mocked(skyscannerService.searchFlights).mockResolvedValue([candidate]); fireEvent.change(screen.getByLabelText('Destination airport'), { target: { value: 'BOM' } }); fireEvent.click(screen.getByRole('button', { name: 'Search flights' })); await waitFor(() => expect(screen.getByRole('button', { name: /Select AI202/ })).toBeDisabled());
  });
});
