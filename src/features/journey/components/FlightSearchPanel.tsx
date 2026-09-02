import { useState } from 'react';
import { Loader2, Plane } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataProvenanceBadge } from '@/components/ui/data-provenance';
import { skyscannerService, type FlightCandidate, type SkyscannerFlightQuery } from '@/services/SkyscannerService';

type CabinClass = SkyscannerFlightQuery['cabinClass'];
const cabins: Array<{ value: CabinClass; label: string }> = [
  { value: 'economy', label: 'Economy' }, { value: 'premium_economy', label: 'Premium economy' },
  { value: 'business', label: 'Business' }, { value: 'first', label: 'First' },
];
function displayTime(value: string) { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(parsed); }

export function FlightSearchPanel({ selected, canBind, onSelect }: { selected?: FlightCandidate; canBind: boolean; onSelect: (candidate: FlightCandidate) => void }) {
  const [origin, setOrigin] = useState(''); const [destination, setDestination] = useState(''); const [date, setDate] = useState('');
  const [adults, setAdults] = useState(1); const [cabinClass, setCabinClass] = useState<CabinClass>('economy');
  const [state, setState] = useState<'idle' | 'loading' | 'results' | 'empty' | 'error'>('idle');
  const [results, setResults] = useState<FlightCandidate[]>([]); const [error, setError] = useState('');
  const search = async () => {
    const from = origin.trim().toUpperCase(); const to = destination.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to)) { setError('Enter valid three-letter origin and destination airport codes.'); return; }
    if (from === to) { setError('Origin and destination airports must be different.'); return; }
    if (!date || date < new Date().toISOString().slice(0, 10)) { setError('Choose today or a future departure date.'); return; }
    if (!Number.isInteger(adults) || adults < 1 || adults > 9) { setError('Adults must be between 1 and 9.'); return; }
    setState('loading'); setError(''); setResults([]);
    try { const candidates = await skyscannerService.searchFlights({ originSkyId: from, destinationSkyId: to, originEntityId: from, destinationEntityId: to, date, adults, cabinClass }); setResults(candidates); setState(candidates.length ? 'results' : 'empty'); }
    catch { setState('error'); setError('Flight search is temporarily unavailable. Please try again.'); }
  };
  return <Card data-testid="flight-search-panel"><CardHeader><CardTitle className="flex items-center gap-2"><Plane className="h-5 w-5" />Find a flight</CardTitle></CardHeader><CardContent className="space-y-4">
    <p className="text-sm text-muted-foreground">Search provider-backed flight options. Searching does not change your journey.</p>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <div><Label htmlFor="flight-origin">Origin airport</Label><Input id="flight-origin" maxLength={3} placeholder="DEL" value={origin} onChange={event => setOrigin(event.target.value)} /></div>
      <div><Label htmlFor="flight-destination">Destination airport</Label><Input id="flight-destination" maxLength={3} placeholder="FCO" value={destination} onChange={event => setDestination(event.target.value)} /></div>
      <div><Label htmlFor="flight-date">Departure date</Label><Input id="flight-date" type="date" value={date} onChange={event => setDate(event.target.value)} /></div>
      <div><Label htmlFor="flight-adults">Adults</Label><Input id="flight-adults" type="number" min={1} max={9} value={adults} onChange={event => setAdults(Number(event.target.value))} /></div>
      <div><Label htmlFor="flight-cabin">Cabin class</Label><select id="flight-cabin" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={cabinClass} onChange={event => setCabinClass(event.target.value as CabinClass)}>{cabins.map(cabin => <option key={cabin.value} value={cabin.value}>{cabin.label}</option>)}</select></div>
    </div>
    <Button type="button" onClick={search} disabled={state === 'loading'}>{state === 'loading' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Searching flights…</> : 'Search flights'}</Button>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}{state === 'empty' && <p role="status">No flights were found for this search.</p>}
    {state === 'results' && <section aria-labelledby="flight-results-heading" className="space-y-3"><h3 id="flight-results-heading" className="font-semibold">Flight results</h3><div className="grid gap-3 md:grid-cols-2">{results.map((candidate, index) => <article className="space-y-2 rounded-lg border p-3" key={`${candidate.providerItineraryId ?? `${candidate.carrierCode}-${candidate.flightNumber}`}-${index}`}>
      <div className="flex flex-wrap items-center gap-2"><strong>{candidate.carrierName ?? candidate.carrierCode} {candidate.carrierCode}{candidate.flightNumber}</strong><DataProvenanceBadge provenance="provider-search" /></div><p>{candidate.departureAirportCode} → {candidate.arrivalAirportCode}</p><p className="text-sm">Departs: {displayTime(candidate.scheduledDeparture)}</p><p className="text-sm">Arrives: {displayTime(candidate.scheduledArrival)}</p><p className="font-medium">{candidate.formattedPrice ?? (candidate.price !== undefined ? `${candidate.currency ?? ''} ${candidate.price.toLocaleString()}`.trim() : 'Price unavailable')}</p>
      <Button type="button" variant="outline" disabled={!canBind} aria-label={`Select ${candidate.carrierCode}${candidate.flightNumber} from ${candidate.departureAirportCode} to ${candidate.arrivalAirportCode} for disruption monitoring`} onClick={() => onSelect(candidate)}>Select for disruption monitoring</Button>{!canBind && <p className="text-xs text-muted-foreground">Add a flight segment to this journey before selecting a monitored flight.</p>}
    </article>)}</div></section>}
    {selected && <section aria-labelledby="selected-flight-heading" className="space-y-1 rounded-lg bg-muted p-3"><div className="flex items-center gap-2"><h3 id="selected-flight-heading" className="font-semibold">Selected flight</h3><DataProvenanceBadge provenance="provider-search" /></div><p>{selected.carrierName ?? selected.carrierCode} {selected.carrierCode}{selected.flightNumber}</p><p>{selected.departureAirportCode} → {selected.arrivalAirportCode}</p><p>Scheduled: {displayTime(selected.scheduledDeparture)}</p><p className="text-xs text-muted-foreground">Provider search identity</p></section>}
  </CardContent></Card>;
}
