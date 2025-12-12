import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  ArrowLeft, MapPin, Calendar, Users, Clock,
  Navigation, Train, Plane, Bus, Footprints, Utensils,
  Hotel, Sparkles, AlertCircle, RefreshCw, Map, ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { JourneyMap, type Location, type RouteStep } from '@/features/journey/components/JourneyMap';
import { freeGeocodingService } from '@/features/journey/services/FreeGeocodingService';
import { freeRoutingService } from '@/features/journey/services/FreeRoutingService';
import { bookOnceAIService } from '@/features/journey/services/BookOnceAIService';
import JourneyVisualization from '@/components/JourneyVisualization';
import { BookOnceAISidebar } from '@/components/BookOnceAISidebar';


const RoutePlanning = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get data from URL params
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const departure = searchParams.get('departure') || '';
  const returnDate = searchParams.get('return') || '';
  const guests = searchParams.get('guests') || '2';
  const intent = searchParams.get('intent') as 'urgent' | 'leisure' || 'urgent';
  const visitor = searchParams.get('visitor') as 'first-time' | 'returning' || 'first-time';
  const departureTimeParam = searchParams.get('departureTime') || '09:00';

  const [isPlanning, setIsPlanning] = useState(true);
  const [departureTime, setDepartureTime] = useState(departureTimeParam);
  const [showFlightModal, setShowFlightModal] = useState(false);
  const [selectedFlightRoute, setSelectedFlightRoute] = useState<{from: string; to: string; time: string; date: string} | null>(null);
  const numGuests = parseInt(guests) || 2;

  // Map state
  const [originLocation, setOriginLocation] = useState<Location | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<Location | null>(null);
  const [routeSteps, setRouteSteps] = useState<RouteStep[] | null>(null);
  const [mapLoading, setMapLoading] = useState(true);

  // AI-generated journey plan
  const [aiJourneyPlan, setAiJourneyPlan] = useState<string>('');
  const [aiPlanError, setAiPlanError] = useState<string>('');
  const [aiPlanLoading, setAiPlanLoading] = useState(true);

  // AI Sidebar state
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);

  // Calculate pricing based on number of travelers
  const calculatePricing = () => {
    const basePrices = {
      metro: 60,
      flight: intent === 'urgent' ? 8500 : 5500,
      bus: 40,
    };

    const totalPerPerson = basePrices.metro + basePrices.flight + basePrices.bus;
    const total = totalPerPerson * numGuests;

    // Group discount for 4+ travelers
    const discount = numGuests >= 4 ? 0.1 : 0;
    const finalTotal = total * (1 - discount);

    return {
      perPerson: totalPerPerson,
      subtotal: total,
      discount: total * discount,
      total: finalTotal,
      hasDiscount: numGuests >= 4,
    };
  };

  const pricing = calculatePricing();

  // Load map data
  useEffect(() => {
    const loadMapData = async () => {
      if (!from || !to) return;

      setMapLoading(true);
      try {
        // Geocode origin
        const originResults = await freeGeocodingService.search(from);
        if (originResults.length > 0) {
          setOriginLocation({
            lat: originResults[0].coordinates.lat,
            lng: originResults[0].coordinates.lng,
            name: from,
          });
        }

        // Geocode destination
        const destResults = await freeGeocodingService.search(to);
        if (destResults.length > 0) {
          setDestinationLocation({
            lat: destResults[0].coordinates.lat,
            lng: destResults[0].coordinates.lng,
            name: to,
          });

          // Calculate route if both locations are available
          if (originResults.length > 0) {
            const route = await freeRoutingService.getRoute({
              origin: {
                lat: originResults[0].coordinates.lat,
                lng: originResults[0].coordinates.lng,
              },
              destination: {
                lat: destResults[0].coordinates.lat,
                lng: destResults[0].coordinates.lng,
              },
              mode: 'driving-car',
            });
            setRouteSteps(route.steps);
          }
        }
      } catch (error) {
        console.error('Error loading map data:', error);
      } finally {
        setMapLoading(false);
      }
    };

    loadMapData();
  }, [from, to]);

  // Calculate segment times based on departure time
  const calculateSegmentTimes = (startTime: string) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    let currentMinutes = hours * 60 + minutes;

    const addMinutes = (mins: number) => {
      currentMinutes += mins;
      const h = Math.floor(currentMinutes / 60) % 24;
      const m = currentMinutes % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    return {
      walk1: startTime,
      metro: addMinutes(8),
      flight: addMinutes(25 + 120), // 25 min metro + 2 hour buffer
      bus: addMinutes(150), // 2.5 hour flight
      walk2: addMinutes(35), // 35 min bus
    };
  };

  const segmentTimes = calculateSegmentTimes(departureTime);

  // Generate flight comparison links (no API needed!)
  const generateFlightLinks = (from: string, to: string, date: string) => {
    const airportCodes: Record<string, string> = {
      'Mumbai': 'BOM',
      'Goa': 'GOI',
      'Delhi': 'DEL',
      'Bangalore': 'BLR',
      'Chennai': 'MAA',
      'Kolkata': 'CCU',
      'Hyderabad': 'HYD',
      'Jaipur': 'JAI',
      'Pune': 'PNQ',
      'Ahmedabad': 'AMD',
    };

    const fromCity = from.split(',')[0].trim();
    const toCity = to.split(',')[0].trim();
    
    const originCode = airportCodes[fromCity] || 'BOM';
    const destCode = airportCodes[toCity] || 'GOI';

    // Generate links to multiple flight search engines
    return [
      {
        name: 'Google Flights',
        logo: '🔍',
        url: `https://www.google.com/travel/flights?q=flights+from+${originCode}+to+${destCode}+on+${date}+${numGuests}+passengers`,
        description: 'Compare prices across airlines',
        color: 'bg-blue-50 text-blue-700 border-blue-200',
      },
      {
        name: 'Skyscanner',
        logo: '✈️',
        url: `https://www.skyscanner.co.in/transport/flights/${originCode}/${destCode}/${date.replace(/-/g, '')}/?adults=${numGuests}&cabinclass=${intent === 'urgent' ? 'business' : 'economy'}`,
        description: 'Find cheapest flights',
        color: 'bg-purple-50 text-purple-700 border-purple-200',
      },
      {
        name: 'Kayak',
        logo: '🌊',
        url: `https://www.kayak.co.in/flights/${originCode}-${destCode}/${date}/${numGuests}adults?sort=bestflight_a`,
        description: 'Search hundreds of sites',
        color: 'bg-orange-50 text-orange-700 border-orange-200',
      },
      {
        name: 'MakeMyTrip',
        logo: '🇮🇳',
        url: `https://www.makemytrip.com/flight/search?itinerary=${originCode}-${destCode}-${date.replace(/-/g, '/')}&paxType=A-${numGuests}_C-0_I-0&intl=false&cabinClass=${intent === 'urgent' ? 'B' : 'E'}`,
        description: 'India\'s leading travel site',
        color: 'bg-red-50 text-red-700 border-red-200',
      },
      {
        name: 'Cleartrip',
        logo: '🎯',
        url: `https://www.cleartrip.com/flight-booking/flights-from-${fromCity.toLowerCase()}-to-${toCity.toLowerCase()}-on-${date}?adults=${numGuests}&class=${intent === 'urgent' ? 'Business' : 'Economy'}`,
        description: 'Simple & transparent booking',
        color: 'bg-green-50 text-green-700 border-green-200',
      },
      {
        name: 'Goibibo',
        logo: '🐐',
        url: `https://www.goibibo.com/flights/${originCode}-${destCode}-air-tickets/?date=${date}&adults=${numGuests}&class=${intent === 'urgent' ? 'B' : 'E'}`,
        description: 'Best deals & offers',
        color: 'bg-teal-50 text-teal-700 border-teal-200',
      },
    ];
  };

  const handleFlightClick = (from: string, to: string, time: string, date: string) => {
    setSelectedFlightRoute({ from, to, time, date });
    setShowFlightModal(true);
  };

  // Generate AI journey plan
  useEffect(() => {
    const generatePlan = async () => {
      if (!from || !to) return;

      setAiPlanLoading(true);
      setAiPlanError('');

      try {
        const context = {
          origin: from,
          destination: to,
          departureDate: departure,
          returnDate: returnDate || undefined,
          travelers: numGuests,
          intent,
          visitor,
          departureTime,
        };

        console.log('Generating AI journey plan with context:', context);
        const plan = await bookOnceAIService.generateCompleteJourneyPlan(context);
        console.log('AI journey plan generated:', plan ? 'Success' : 'Empty');
        setAiJourneyPlan(plan);
      } catch (error: any) {
        console.error('Error generating journey plan:', error);
        setAiPlanError(error?.message || 'Failed to generate AI plan');
      } finally {
        setIsPlanning(false);
        setAiPlanLoading(false);
      }
    };

    const timer = setTimeout(() => {
      generatePlan();
    }, 1500);

    return () => clearTimeout(timer);
  }, [from, to, departure, returnDate, numGuests, intent, visitor, departureTime]);

  if (!from || !to) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <h2 className="text-lg font-semibold mb-2">Missing Information</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Please start from the home page and enter your travel details.
          </p>
          <Button onClick={() => navigate('/')}>Go to Home</Button>
        </Card>
      </div>
    );
  }

  if (isPlanning) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <Card className="p-8 max-w-md text-center">
          <div className="mb-4">
            <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            </div>
          </div>
          <h2 className="text-xl font-bold mb-2">Planning Your Journey</h2>
          <p className="text-sm text-muted-foreground mb-4">
            AI is analyzing {intent === 'urgent' ? 'fastest routes' : 'best experiences'} from {from} to {to}...
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>Optimizing multi-modal transport</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
              {intent === 'urgent' ? '⚡ Urgent' : '🎒 Leisure'}
            </span>
          </div>
        </div>

        {/* Trip Summary */}
        <Card className="p-6 mb-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">From</p>
                <p className="font-medium text-sm">{from}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Navigation className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">To</p>
                <p className="font-medium text-sm">{to}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{returnDate ? 'Trip Dates' : 'Departure'}</p>
                <p className="font-medium text-sm">
                  {departure && format(new Date(departure), 'MMM dd')}
                  {returnDate && ` - ${format(new Date(returnDate), 'MMM dd')}`}
                </p>
                {returnDate && (
                  <p className="text-xs text-muted-foreground">
                    {Math.ceil((new Date(returnDate).getTime() - new Date(departure).getTime()) / (1000 * 60 * 60 * 24))} nights
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Travelers</p>
                <p className="font-medium text-sm">{guests} guests</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Route Timeline */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Your Door-to-Door Route</h2>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="time"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="text-sm border rounded px-2 py-1"
                  />
                </div>
              </div>

              <Tabs defaultValue="outbound" className="w-full">
                <TabsList className={`grid w-full ${returnDate ? 'grid-cols-4' : 'grid-cols-3'}`}>
                  <TabsTrigger value="outbound">Outbound</TabsTrigger>
                  {returnDate && <TabsTrigger value="return">Return</TabsTrigger>}
                  <TabsTrigger value="stops">Stops & Food</TabsTrigger>
                  <TabsTrigger value="stay">Accommodation</TabsTrigger>
                </TabsList>

                <TabsContent value="outbound" className="space-y-4 mt-4">
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium">
                      {departure && format(new Date(departure), 'EEEE, MMMM dd, yyyy')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {from} → {to} • Departure: {departureTime}
                    </p>
                  </div>

                  {aiPlanLoading ? (
                    <div className="flex flex-col items-center justify-center p-8 space-y-3">
                      <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Generating AI-powered route...</p>
                    </div>
                  ) : aiPlanError ? (
                    <Card className="p-4 border-blue-200 bg-blue-50">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900 mb-1">
                            {aiPlanError.includes('rate limit') ? '⏱️ AI Service Busy' : 'AI Plan Unavailable'}
                          </p>
                          <p className="text-xs text-blue-700 mb-2">
                            {aiPlanError.includes('rate limit') 
                              ? 'The AI service is experiencing high demand. Your journey is still planned using our reliable routing system below.'
                              : aiPlanError}
                          </p>
                          {aiPlanError.includes('rate limit') && (
                            <div className="text-xs text-blue-600 space-y-1">
                              <p>✓ All transport modes calculated</p>
                              <p>✓ Timing based on your {departureTime} departure</p>
                              <p>✓ Optimized for {intent === 'urgent' ? 'speed' : 'comfort'}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ) : aiJourneyPlan ? (
                    <JourneyVisualization 
                      aiResponse={aiJourneyPlan.split('## RETURN JOURNEY')[0].split('## STOPS & FOOD')[0].split('## ACCOMMODATION')[0]}
                      journeyType="outbound"
                      userName="Traveler"
                    />
                  ) : null}

                  {/* Fallback: Outbound Route segments - Show if AI plan failed or is empty */}
                  {(!aiJourneyPlan || aiPlanError) && !aiPlanLoading && (
                    <>
                      <RouteSegment
                    icon={<Footprints className="h-5 w-5" />}
                    mode="Walk"
                    from="Your Home"
                    to="Metro Station"
                    duration="8 min"
                    distance="650 m"
                    time={segmentTimes.walk1}
                    color="text-green-500"
                    travelers={numGuests}
                  />
                  
                  <RouteSegment
                    icon={<Train className="h-5 w-5" />}
                    mode="Metro"
                    from="Central Station"
                    to="Airport Station"
                    duration="25 min"
                    distance="18 km"
                    time={segmentTimes.metro}
                    color="text-blue-500"
                    details="Line 3 - Direction Airport"
                    price={60}
                    travelers={numGuests}
                    seatsRequired={true}
                  />

                  <RouteSegment
                    icon={<Plane className="h-5 w-5" />}
                    mode="Flight"
                    from={from}
                    to={to}
                    duration="2h 30min"
                    distance="1,200 km"
                    time={segmentTimes.flight}
                    color="text-purple-500"
                    details={`AI 101 - Economy • ${numGuests} ${numGuests === 1 ? 'passenger' : 'passengers'}`}
                    price={intent === 'urgent' ? 8500 : 5500}
                    travelers={numGuests}
                    seatsRequired={true}
                    isClickable={true}
                    onClick={() => handleFlightClick(from, to, segmentTimes.flight, departure)}
                  />

                  <RouteSegment
                    icon={<Bus className="h-5 w-5" />}
                    mode="Bus"
                    from="Airport"
                    to="City Center"
                    duration="35 min"
                    distance="22 km"
                    time={segmentTimes.bus}
                    color="text-orange-500"
                    price={40}
                    travelers={numGuests}
                    seatsRequired={true}
                  />

                  <RouteSegment
                    icon={<Footprints className="h-5 w-5" />}
                    mode="Walk"
                    from="Bus Stop"
                    to="Your Destination"
                    duration="5 min"
                    distance="400 m"
                    time={segmentTimes.walk2}
                    color="text-green-500"
                    travelers={numGuests}
                  />
                    </>
                  )}
                </TabsContent>

                {returnDate && (
                  <TabsContent value="return" className="space-y-4 mt-4">
                    <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium">
                        {format(new Date(returnDate), 'EEEE, MMMM dd, yyyy')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {to} → {from}
                      </p>
                    </div>

                    {aiJourneyPlan && aiJourneyPlan.includes('## RETURN JOURNEY') && (
                      <JourneyVisualization 
                        aiResponse={aiJourneyPlan.split('## RETURN JOURNEY')[1]?.split('## STOPS & FOOD')[0]?.split('## ACCOMMODATION')[0] || 'Calculating return journey...'}
                        journeyType="return"
                        userName="Traveler"
                      />
                    )}

                    {/* Return Route segments (reversed) */}
                    <RouteSegment
                      icon={<Footprints className="h-5 w-5" />}
                      mode="Walk"
                      from="Your Hotel"
                      to="Bus Stop"
                      duration="5 min"
                      distance="400 m"
                      time="08:00"
                      color="text-green-500"
                    />

                    <RouteSegment
                      icon={<Bus className="h-5 w-5" />}
                      mode="Bus"
                      from="City Center"
                      to="Airport"
                      duration="35 min"
                      distance="22 km"
                      time="08:10"
                      color="text-orange-500"
                    />

                    <RouteSegment
                      icon={<Plane className="h-5 w-5" />}
                      mode="Flight"
                      from={to}
                      to={from}
                      duration="2h 30min"
                      distance="1,200 km"
                      time="10:00"
                      color="text-purple-500"
                      details="AI 202 - Economy"
                    />

                    <RouteSegment
                      icon={<Train className="h-5 w-5" />}
                      mode="Metro"
                      from="Airport Station"
                      to="Central Station"
                      duration="25 min"
                      distance="18 km"
                      time="13:00"
                      color="text-blue-500"
                      details="Line 3 - Direction City"
                    />

                    <RouteSegment
                      icon={<Footprints className="h-5 w-5" />}
                      mode="Walk"
                      from="Metro Station"
                      to="Your Home"
                      duration="8 min"
                      distance="650 m"
                      time="13:30"
                      color="text-green-500"
                    />
                  </TabsContent>
                )}

                <TabsContent value="stops" className="space-y-4 mt-4">
                  {aiJourneyPlan && aiJourneyPlan.includes('## STOPS & FOOD') && (
                    <JourneyVisualization 
                      aiResponse={aiJourneyPlan.split('## STOPS & FOOD')[1]?.split('## ACCOMMODATION')[0]?.split('## RETURN JOURNEY')[0] || 'Calculating meal stops...'}
                      journeyType="outbound"
                      userName="Traveler"
                    />
                  )}

                  {numGuests >= 4 && (
                    <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-900">Group Dining</span>
                      </div>
                      <p className="text-xs text-orange-700">
                        For groups of {numGuests}, we recommend restaurants with group seating. Reservations suggested.
                      </p>
                    </div>
                  )}
                  
                  <StopCard
                    icon={<Utensils className="h-5 w-5 text-orange-500" />}
                    title="Breakfast Stop"
                    location="Airport Terminal 2"
                    time="09:45 - 10:15"
                    description={intent === 'urgent' 
                      ? `Quick grab-and-go options for ${numGuests} ${numGuests === 1 ? 'person' : 'people'}` 
                      : `Local cuisine recommendations • Table for ${numGuests}`}
                  />
                  
                  <StopCard
                    icon={<Utensils className="h-5 w-5 text-orange-500" />}
                    title="Lunch"
                    location="Near destination"
                    time="14:30"
                    description={visitor === 'first-time' 
                      ? `Popular local restaurant • Seating for ${numGuests}` 
                      : `Your favorite from last visit • Party of ${numGuests}`}
                  />
                  
                  {numGuests >= 6 && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        💡 Tip: Large groups may qualify for set menus or group discounts at select restaurants.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="stay" className="space-y-4 mt-4">
                  {aiJourneyPlan && aiJourneyPlan.includes('## ACCOMMODATION') && (
                    <JourneyVisualization 
                      aiResponse={aiJourneyPlan.split('## ACCOMMODATION')[1] || 'Calculating accommodation options...'}
                      journeyType="outbound"
                      userName="Traveler"
                    />
                  )}

                  {returnDate && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Hotel className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Accommodation Required</span>
                      </div>
                      <div className="space-y-1 text-xs text-blue-700">
                        <p>• {numGuests} {numGuests === 1 ? 'traveler' : 'travelers'}</p>
                        <p>• {Math.ceil(numGuests / 2)} {Math.ceil(numGuests / 2) === 1 ? 'room' : 'rooms'} recommended (2 guests per room)</p>
                        <p>• {Math.ceil((new Date(returnDate).getTime() - new Date(departure).getTime()) / (1000 * 60 * 60 * 24))} nights</p>
                      </div>
                    </div>
                  )}
                  
                  <StopCard
                    icon={<Hotel className="h-5 w-5 text-blue-500" />}
                    title="Recommended Hotel"
                    location="City Center, 500m from destination"
                    time="Check-in: 15:00"
                    description={intent === 'urgent' ? 'Quick check-in, near transport' : 'Comfortable stay with local experiences'}
                  />
                  
                  {numGuests > 2 && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        💡 Tip: For groups of {numGuests}, consider booking connecting rooms or a suite for better coordination.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Right: Map & Info */}
          <div className="space-y-4">
            {/* Pricing Summary */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Trip Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Travelers</span>
                  <span className="font-medium">{numGuests} {numGuests === 1 ? 'person' : 'people'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price per person</span>
                  <span className="font-medium">₹{pricing.perPerson.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">₹{pricing.subtotal.toLocaleString()}</span>
                </div>
                {pricing.hasDiscount && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Group discount (10%)</span>
                    <span>-₹{pricing.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-3 border-t">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-lg">₹{pricing.total.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {returnDate ? 'Round-trip for all travelers' : 'One-way for all travelers'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Map className="h-4 w-4" />
                Route Map
              </h3>
              {mapLoading ? (
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading map...</p>
                  </div>
                </div>
              ) : originLocation && destinationLocation ? (
                <JourneyMap
                  origin={originLocation}
                  destination={destinationLocation}
                  route={routeSteps || undefined}
                  height="400px"
                />
              ) : (
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Unable to load map</p>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Real-Time Updates
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5" />
                  <p className="text-muted-foreground">All routes clear</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5" />
                  <p className="text-muted-foreground">Weather: Clear skies</p>
                </div>
                {numGuests >= 4 && (
                  <div className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
                    <p className="text-muted-foreground">Group booking - 10% discount applied</p>
                  </div>
                )}
              </div>
            </Card>

            <Button className="w-full" size="lg">
              Confirm & Book Journey
              <span className="ml-2 text-xs opacity-80">₹{pricing.total.toLocaleString()}</span>
            </Button>
          </div>
        </div>

      </div>

      {/* BookOnce AI Chat Widget */}
      <BookOnceAISidebar
        isOpen={isAISidebarOpen}
        onClose={() => setIsAISidebarOpen(false)}
        onToggle={() => setIsAISidebarOpen(!isAISidebarOpen)}
      />

      {/* Flight Comparison Modal */}
      <Dialog open={showFlightModal} onOpenChange={setShowFlightModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Compare Flights: {selectedFlightRoute?.from} → {selectedFlightRoute?.to}
            </DialogTitle>
            <DialogDescription>
              Search real-time flights on multiple platforms • {numGuests} {numGuests === 1 ? 'passenger' : 'passengers'} • {selectedFlightRoute?.date && format(new Date(selectedFlightRoute.date), 'MMM dd, yyyy')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 text-sm">No Account Required!</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Click any platform below to search flights with your details pre-filled. Compare prices and book directly - no API keys or sign-ups needed!
                  </p>
                </div>
              </div>
            </div>

            {selectedFlightRoute && generateFlightLinks(selectedFlightRoute.from, selectedFlightRoute.to, selectedFlightRoute.date).map((platform, index) => (
              <Card key={index} className={`p-4 hover:shadow-lg transition-all border-2 ${platform.color}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-3xl">{platform.logo}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-base mb-1">{platform.name}</h3>
                      <p className="text-xs text-muted-foreground">{platform.description}</p>
                    </div>
                  </div>
                  <Button size="sm" asChild className="shrink-0">
                    <a href={platform.url} target="_blank" rel="noopener noreferrer">
                      Search Flights
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Pro Tip:</strong> Open multiple tabs to compare prices across platforms. Prices can vary significantly between sites. 
              Each link opens with your search details pre-filled for instant results!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Route Segment Component
interface RouteSegmentProps {
  icon: React.ReactNode;
  mode: string;
  from: string;
  to: string;
  duration: string;
  distance: string;
  time: string;
  color: string;
  details?: string;
  price?: number;
  travelers?: number;
  seatsRequired?: boolean;
  onClick?: () => void;
  isClickable?: boolean;
}

const RouteSegment = ({ icon, mode, from, to, duration, distance, time, color, details, price, travelers, seatsRequired, onClick, isClickable }: RouteSegmentProps) => (
  <div 
    className={`flex gap-4 p-4 rounded-lg border bg-card transition-colors ${
      isClickable ? 'cursor-pointer hover:bg-muted/50 hover:border-primary/50 hover:shadow-md' : 'hover:bg-muted/50'
    }`}
    onClick={onClick}
  >
    <div className="flex flex-col items-center">
      <div className={`p-2 rounded-full bg-muted ${color}`}>
        {icon}
      </div>
      <div className="w-px h-full bg-border mt-2" />
    </div>
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{mode}</span>
          {isClickable && (
            <span className="text-xs text-blue-600 font-medium">View Options →</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{time}</span>
          {price && (
            <span className="text-xs font-medium text-primary">₹{(price * (travelers || 1)).toLocaleString()}</span>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-1">
        {from} → {to}
      </p>
      {details && (
        <p className="text-xs text-muted-foreground mb-2">{details}</p>
      )}
      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {duration}
        </span>
        <span>{distance}</span>
        {seatsRequired && travelers && (
          <span className="flex items-center gap-1 text-blue-600">
            <Users className="h-3 w-3" />
            {travelers} {travelers === 1 ? 'seat' : 'seats'}
          </span>
        )}
      </div>
    </div>
  </div>
);

// Stop Card Component
interface StopCardProps {
  icon: React.ReactNode;
  title: string;
  location: string;
  time: string;
  description: string;
}

const StopCard = ({ icon, title, location, time, description }: StopCardProps) => (
  <div className="flex gap-4 p-4 rounded-lg border bg-card">
    <div className="p-2 rounded-full bg-muted h-fit">
      {icon}
    </div>
    <div className="flex-1">
      <h4 className="font-semibold text-sm mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground mb-1">{location}</p>
      <p className="text-xs text-muted-foreground mb-2">{time}</p>
      <p className="text-xs">{description}</p>
    </div>
  </div>
);

export default RoutePlanning;
