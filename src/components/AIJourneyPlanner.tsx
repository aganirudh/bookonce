import React, { useState } from 'react';
import { Loader2, MapPin, MessageSquare, Route, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Itinerary, JourneySegment } from '@/features/journey/schemas/aiSchemas';
import { bookOnceAIService } from '@/features/journey/services/BookOnceAIService';
import { journeyEnrichmentService } from '@/features/journey/services/JourneyEnrichmentService';
import { buildJourneyRequest, type JourneyFormData } from '@/features/journey/utils/journeyRequestMapper';
import JourneyMap from '@/features/journey/components/JourneyMap';
import { segmentToCandidate } from '@/features/journey/optimization/adapters';
import { preferencesForTravelStyle } from '@/features/journey/optimization/presets';
import { getBestRoute } from '@/features/journey/optimization/RouteOptimizer';
import { fallbackPreferences, preferenceInterpreter } from '@/features/journey/optimization/PreferenceInterpreter';
import { weatherService } from '@/services/WeatherService';
import { evaluateWeatherCompatibility, nearestWeatherHour } from '@/features/journey/weather/WeatherCompatibilityEngine';
import { proposeWeatherReplan } from '@/features/journey/replanning/ItineraryReplanner';
import type { WeatherActivity } from '@/features/journey/weather/types';

type RequestState = 'idle' | 'loading' | 'success' | 'error';

const estimate = (value: number, unit: string) => `${value.toLocaleString()} ${unit}`;

type RoutingAlternative = NonNullable<JourneySegment['routingAlternatives']>[number];

function selectedAlternative(segment: JourneySegment, selectedId?: string): RoutingAlternative | undefined {
  return segment.routingAlternatives?.find(route => route.id === selectedId) ??
    segment.routingAlternatives?.find(route => route.id === segment.selectedRouteCandidateId) ??
    segment.routingAlternatives?.[0];
}

const JourneySegmentCard: React.FC<{
  segment: JourneySegment;
  index: number;
  selectedId?: string;
  travelStyle: 'urgent' | 'leisure';
  onSelect: (id: string) => void;
}> = ({ segment, index, selectedId, travelStyle, onSelect }) => {
  const selected = selectedAlternative(segment, selectedId);
  const fallbackCandidate = segment.routingStatus === 'routed' ? segmentToCandidate(segment, index) : null;
  const fallbackOptimized = fallbackCandidate
    ? getBestRoute([fallbackCandidate], preferencesForTravelStyle(travelStyle))
    : undefined;
  const explanation = selected?.explanation ?? fallbackOptimized?.explanation;
  const qualityScore = selected?.qualityScore ?? fallbackOptimized?.qualityScore;
  const fastestDuration = segment.routingAlternatives?.reduce(
    (minimum, route) => Math.min(minimum, route.duration),
    Number.POSITIVE_INFINITY
  );
  const routeDuration = selected?.duration ?? segment.routeDuration;
  const routeDistance = selected?.distance ?? segment.routeDistance;
  const routeCost = selected?.estimatedCost ?? segment.estimatedCost;
  const routeCostSource = selected?.costEstimateSource ?? segment.costEstimateSource;

  return <Card key={`${segment.mode}-${segment.from.name}-${segment.to.name}-${index}`}>
    <CardHeader>
      <CardTitle className="text-lg capitalize">
        {index + 1}. {segment.mode}: {segment.from.name} → {segment.to.name}
      </CardTitle>
    </CardHeader>
    <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
      {segment.routingAlternatives && segment.routingAlternatives.length > 1 && <div className="sm:col-span-2 flex flex-wrap gap-2" aria-label="Route alternatives">
        {segment.routingAlternatives.map(route => {
          const isSelected = route.id === selected?.id;
          const label = route.rank === 1
            ? 'Recommended'
            : route.duration === fastestDuration ? 'Fastest' : `Alternative ${route.rank - 1}`;
          return <Button key={route.id} type="button" size="sm" variant={isSelected ? 'default' : 'outline'} onClick={() => onSelect(route.id)}>
            {label}
          </Button>;
        })}
      </div>}
      {segment.departureTime && <p><b>Suggested departure:</b> {segment.departureTime}</p>}
      {segment.arrivalTime && <p><b>Suggested arrival:</b> {segment.arrivalTime}</p>}
      {routeDuration !== undefined
        ? <p><b>Verified road duration:</b> {estimate(Math.round(routeDuration / 60), 'minutes')}</p>
        : segment.duration !== undefined && <p><b>Estimated duration:</b> {estimate(segment.duration, 'minutes')}</p>}
      {routeDistance !== undefined
        ? <p><b>Verified road distance:</b> {estimate(Number((routeDistance / 1000).toFixed(1)), 'km')}</p>
        : segment.distance !== undefined && <p><b>Estimated distance:</b> {estimate(segment.distance, 'km')}</p>}
      {routeCost !== undefined && <p><b>{routeCostSource === 'bookonce-estimate' ? 'BookOnce estimated cost' : 'Suggested estimated cost'}:</b> Approx. ₹{routeCost.toLocaleString()}</p>}
      {segment.instructions && <p className="sm:col-span-2"><b>Suggested instructions:</b> {segment.instructions}</p>}
      {explanation && qualityScore !== undefined && <div className="sm:col-span-2 rounded-lg border bg-muted/40 p-3" data-testid="route-explanation">
        <p className="font-semibold">Why this route?</p>
        <p className="text-muted-foreground">BookOnce optimized this route for {segment.optimizationPreferenceLabel ?? explanation.dominantPreference}.</p>
        {segment.optimizationWarnings?.map(warning => <p key={warning}>⚠ {warning}</p>)}
        {explanation.advantages.map(reason => <p key={reason}>✓ {reason}</p>)}
        {explanation.tradeOffs.map(reason => <p key={reason}>⚠ {reason}</p>)}
        <p><b>Optimization score:</b> {qualityScore}/100</p>
      </div>}
    </CardContent>
  </Card>;
};

export const JourneyResult: React.FC<{ itinerary: Itinerary; travelStyle?: 'urgent' | 'leisure' }> = ({ itinerary, travelStyle = 'leisure' }) => {
  const [selectedRoutes, setSelectedRoutes] = useState<Record<number, string>>({});
  const routeGeometry = itinerary.segments.flatMap((segment, index) =>
    (selectedAlternative(segment, selectedRoutes[index])?.geometry ?? segment.routeGeometry ?? [])
      .map(([lng, lat]) => ({ lat, lng }))
  );

  return <div className="space-y-6" data-testid="journey-result">
    {itinerary.origin.latitude !== undefined && itinerary.origin.longitude !== undefined &&
      itinerary.destination.latitude !== undefined && itinerary.destination.longitude !== undefined && (
        <JourneyMap
          origin={{ lat: itinerary.origin.latitude, lng: itinerary.origin.longitude, name: itinerary.origin.name }}
          destination={{ lat: itinerary.destination.latitude, lng: itinerary.destination.longitude, name: itinerary.destination.name }}
          route={routeGeometry}
          height="360px"
        />
      )}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-5 w-5" />
          {itinerary.origin.name} → {itinerary.destination.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">{itinerary.summary}</p>
        <div className="grid gap-3 text-sm sm:grid-cols-3">
          {itinerary.totalDuration !== undefined && <p><b>Estimated total duration:</b> {estimate(itinerary.totalDuration, 'minutes')}</p>}
          {itinerary.totalDistance !== undefined && <p><b>Estimated total distance:</b> {estimate(itinerary.totalDistance, 'km')}</p>}
          {itinerary.estimatedTotalCost !== undefined && <p><b>Estimated total cost:</b> ₹{itinerary.estimatedTotalCost.toLocaleString()}</p>}
        </div>
      </CardContent>
    </Card>

    {itinerary.segments.map((segment, index) => <JourneySegmentCard
      key={`${segment.mode}-${segment.from.name}-${segment.to.name}-${index}`}
      segment={segment}
      index={index}
      selectedId={selectedRoutes[index]}
      travelStyle={travelStyle}
      onSelect={id => setSelectedRoutes(previous => ({ ...previous, [index]: id }))}
    />)}
  </div>
};

const initialForm: JourneyFormData = {
  origin: '', destination: '', departureDate: '', departureTime: '09:00', returnDate: '',
  travelers: '1', intent: 'leisure', userName: '',
  routePreferenceText: '',
};

const AIJourneyPlanner: React.FC = () => {
  const [requestState, setRequestState] = useState<RequestState>('idle');
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [error, setError] = useState('');
  const [routeWarning, setRouteWarning] = useState('');
  const [weatherNotice, setWeatherNotice] = useState('');
  const [suggestedItinerary, setSuggestedItinerary] = useState<Itinerary | null>(null);
  const [loadingLabel, setLoadingLabel] = useState('Generating Your Journey...');
  const [activeTab, setActiveTab] = useState('form');
  const [form, setForm] = useState(initialForm);
  const isLoading = requestState === 'loading';
  const change = (field: keyof JourneyFormData, value: string) =>
    setForm(previous => ({ ...previous, [field]: value }));

  const generate = async () => {
    if (isLoading) return;
    if (!form.origin.trim() || !form.destination.trim() || !form.departureDate) {
      setRequestState('error');
      setError('Please fill in origin, destination, and departure date');
      return;
    }
    setRequestState('loading');
    setError('');
    setRouteWarning('');
    setWeatherNotice('');
    setSuggestedItinerary(null);
    setItinerary(null);
    try {
      setLoadingLabel('Generating Your Journey...');
      const interpretationPromise = form.routePreferenceText?.trim()
        ? preferenceInterpreter.interpret(form.routePreferenceText, form.intent)
        : Promise.resolve(fallbackPreferences(form.intent));
      const [generated, interpreted] = await Promise.all([
        bookOnceAIService.generateItinerary(buildJourneyRequest(form)),
        interpretationPromise,
      ]);
      setLoadingLabel('Verifying Route...');
      const result = await journeyEnrichmentService.enrich(generated, {
        preferences: interpreted.preferences,
        constraints: interpreted.constraints,
        preferenceLabel: interpreted.summary,
      });
      if (result.segments.some(segment => segment.routingStatus === 'unavailable')) {
        setRouteWarning('Route details could not be verified for some segments.');
      }
      if (result.destination.latitude !== undefined && result.destination.longitude !== undefined) {
        try {
          const forecast = await weatherService.getForecast(result.destination.latitude, result.destination.longitude, form.departureDate);
          if (forecast.status === 'unavailable-out-of-range') {
            setWeatherNotice('Weather forecast unavailable for these travel dates.');
          } else {
            const activities: WeatherActivity[] = result.segments.map((segment, index) => ({
              id: segment.activityId ?? `segment-${index}`,
              title: segment.instructions ?? `${segment.from.name} to ${segment.to.name}`,
              category: segment.activityCategory ?? 'transport',
              flexibility: segment.flexibility ?? 'fixed',
              timestamp: segment.departureTime ? `${form.departureDate}T${segment.departureTime}` : undefined,
              durationMinutes: segment.duration,
            }));
            const compatibility = activities.map(activity => evaluateWeatherCompatibility(
              activity,
              activity.timestamp ? nearestWeatherHour(activity.timestamp, forecast.hourly) : undefined
            ));
            const unsuitable = compatibility.find(item => item.compatibility === 'unsuitable');
            if (unsuitable) setWeatherNotice('Weather may make a planned outdoor activity less suitable.');
            const replan = proposeWeatherReplan(activities, compatibility);
            if (replan.changes.some(change => change.type === 'swap')) {
              const byId = new Map<string, JourneySegment>(result.segments.map((segment, index) => [segment.activityId ?? `segment-${index}`, segment]));
              setSuggestedItinerary({ ...result, segments: replan.proposed.map(activity => ({ ...byId.get(activity.id)!, departureTime: activity.timestamp?.slice(11, 16) })) });
            } else if (replan.changes.some(change => change.type === 'warning')) {
              setWeatherNotice('Replanning suggestion unavailable; weather conflict detected.');
            }
          }
        } catch {
          setWeatherNotice('Weather forecast is temporarily unavailable. Your itinerary is still usable.');
        }
      }
      setItinerary(result);
      setRequestState('success');
      setActiveTab('visualization');
    } catch (caughtError) {
      console.error('Itinerary generation failed', caughtError);
      setRequestState('error');
      setError("We couldn't generate this itinerary. Please try again.");
    }
  };

  const empty = <Card><CardContent className="p-12 text-center">
    <Route className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
    <h3 className="text-lg font-semibold mb-2">No Journey Plan Yet</h3>
    <p className="text-muted-foreground mb-4">Fill out the journey details and generate your AI-powered plan.</p>
    <Button onClick={() => setActiveTab('form')} variant="outline">Plan Your Journey</Button>
  </CardContent></Card>;

  return <div className="max-w-6xl mx-auto p-6 space-y-6">
    <Card className="bg-gradient-accent text-primary-foreground"><CardHeader>
      <CardTitle className="flex items-center gap-3 text-2xl"><Sparkles className="h-8 w-8" />AI Journey Planner</CardTitle>
      <p className="text-primary-foreground/80">Get personalized, step-by-step journey plans powered by AI</p>
    </CardHeader></Card>

    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="form"><MapPin className="h-4 w-4 mr-2" />Plan Journey</TabsTrigger>
        <TabsTrigger value="visualization"><Route className="h-4 w-4 mr-2" />Visual Journey</TabsTrigger>
        <TabsTrigger value="chat"><MessageSquare className="h-4 w-4 mr-2" />AI Response</TabsTrigger>
      </TabsList>
      {routeWarning && <div role="status" className="my-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">{routeWarning}</div>}
      {weatherNotice && <div data-testid="weather-notice" className="my-4 p-4 bg-sky-50 border border-sky-200 rounded-lg text-sky-900">{weatherNotice}</div>}
      {suggestedItinerary && <Button type="button" variant="outline" onClick={() => { setItinerary(suggestedItinerary); setSuggestedItinerary(null); setWeatherNotice('Suggested weather replan applied.'); }}>Apply suggested replan</Button>}
      <TabsContent value="form"><Card><CardHeader><CardTitle>Journey Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div><Label htmlFor="userName">Your Name (Optional)</Label><Input id="userName" value={form.userName} onChange={e => change('userName', e.target.value)} /></div>
            <div><Label htmlFor="travelers">Number of Travelers</Label><Input id="travelers" type="number" min="1" max="10" value={form.travelers} onChange={e => change('travelers', e.target.value)} /></div>
            <div><Label htmlFor="origin">From</Label><Input id="origin" value={form.origin} onChange={e => change('origin', e.target.value)} /></div>
            <div><Label htmlFor="destination">To</Label><Input id="destination" value={form.destination} onChange={e => change('destination', e.target.value)} /></div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div><Label htmlFor="departureDate">Departure Date</Label><Input id="departureDate" type="date" value={form.departureDate} onChange={e => change('departureDate', e.target.value)} /></div>
            <div><Label htmlFor="departureTime">Departure Time</Label><Input id="departureTime" type="time" value={form.departureTime} onChange={e => change('departureTime', e.target.value)} /></div>
            <div><Label htmlFor="returnDate">Return Date (Optional)</Label><Input id="returnDate" type="date" value={form.returnDate} onChange={e => change('returnDate', e.target.value)} /></div>
          </div>
          <div><Label>Travel Style</Label><div className="flex gap-2 mt-2">
            <Button type="button" variant={form.intent === 'urgent' ? 'default' : 'outline'} onClick={() => change('intent', 'urgent')}>Fast &amp; Efficient</Button>
            <Button type="button" variant={form.intent === 'leisure' ? 'default' : 'outline'} onClick={() => change('intent', 'leisure')}>Leisurely &amp; Scenic</Button>
          </div></div>
          <div><Label htmlFor="routePreferenceText">Route preferences (Optional)</Label><Input id="routePreferenceText" placeholder="e.g. Cheapest possible, but avoid long walks" value={form.routePreferenceText} onChange={e => change('routePreferenceText', e.target.value)} /></div>
          <Button onClick={generate} disabled={isLoading} className="w-full" size="lg">
            {isLoading ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" />{loadingLabel}</> : <><Sparkles className="h-5 w-5 mr-2" />Generate AI Journey Plan</>}
          </Button>
          {error && <div role="alert" className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">{error}</div>}
        </CardContent></Card></TabsContent>
      <TabsContent value="visualization">{itinerary ? <JourneyResult itinerary={itinerary} travelStyle={form.intent} /> : empty}</TabsContent>
      <TabsContent value="chat">{itinerary ? <JourneyResult itinerary={itinerary} travelStyle={form.intent} /> : empty}</TabsContent>
    </Tabs>
  </div>;
};

export default AIJourneyPlanner;
