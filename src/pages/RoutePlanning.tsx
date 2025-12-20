import React, { useState, useMemo, useEffect, ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Clock,
  Navigation,
  Train,
  Plane,
  Bus,
  Footprints,
  Utensils,
  Hotel,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Map,
  ExternalLink,
  Bed,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { endangeredPlacesService, EndangeredPlace } from '@/services/EndangeredPlacesService';
import EndangeredPlacesInline from '@/components/EndangeredPlacesInline';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import {
  JourneyMap,
  type Location,
  type RouteStep,
} from '@/features/journey/components/JourneyMap';
import { freeGeocodingService } from '@/features/journey/services/FreeGeocodingService';
import { freeRoutingService } from '@/features/journey/services/FreeRoutingService';
import { bookOnceAIService } from '@/features/journey/services/BookOnceAIService';
import JourneyVisualization from '@/components/JourneyVisualization';
import { BookOnceAISidebar } from '@/components/BookOnceAISidebar';
import { ContextLayerPanel } from '@/components/ContextLayer';

const RoutePlanning = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  // Get data from URL params
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const departure = searchParams.get('departure') || '';
  const returnDate = searchParams.get('return') || '';
  const guests = searchParams.get('guests') || '2';
  const intent = (searchParams.get('intent') as 'urgent' | 'leisure') || 'urgent';
  const visitor = (searchParams.get('visitor') as 'first-time' | 'returning') || 'first-time';
  const departureTimeParam = searchParams.get('departureTime') || '09:00';

  const [isPlanning, setIsPlanning] = useState(true);
  const [departureTime, setDepartureTime] = useState(departureTimeParam);
  const [showFlightModal, setShowFlightModal] = useState(false);
  const [selectedFlightRoute, setSelectedFlightRoute] = useState<{
    from: string;
    to: string;
    time: string;
    date: string;
  } | null>(null);
  const numGuests = parseInt(guests) || 2;

  // Map state
  const [originLocation, setOriginLocation] = useState<Location | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<Location | null>(null);
  const [highlightedMapLocation, setHighlightedMapLocation] = useState<Location | null>(null);
  const [routeSteps, setRouteSteps] = useState<RouteStep[] | null>(null);
  const [mapLoading, setMapLoading] = useState(true);

  // AI-generated journey plan
  const [aiJourneyPlan, setAiJourneyPlan] = useState<string>('');
  const [aiPlanError, setAiPlanError] = useState<string>('');
  const [aiPlanLoading, setAiPlanLoading] = useState(true);

  // AI Sidebar state
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);

  // Context Layer state
  const [isContextOpen, setIsContextOpen] = useState(false);

  // Endangered places state
  const [endangeredPlaces, setEndangeredPlaces] = useState<EndangeredPlace[]>([]);
  const [endangeredPlacesLoading, setEndangeredPlacesLoading] = useState(false);
  const [endangeredPlacesLoaded, setEndangeredPlacesLoaded] = useState(false);
  const [addedPlaces, setAddedPlaces] = useState<EndangeredPlace[]>([]);

  // Journey summary from AI visualization
  const [journeySummary, setJourneySummary] = useState<{
    duration: string;
    cost: number;
    modes: number;
  } | null>(null);

  // Parse AI Response
  const parsedPlan = useMemo(() => {
    if (!aiJourneyPlan) return null;
    try {
      const clean = aiJourneyPlan.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(clean);
    } catch (e) {
      console.warn('Failed to parse AI Plan JSON', e);
      return null;
    }
  }, [aiJourneyPlan]);

  // Calculate pricing based on number of travelers and added places
  const calculatePricing = () => {
    const basePrices = {
      metro: 60,
      flight: intent === 'urgent' ? 8500 : 5500,
      bus: 40,
    };

    // Calculate endangered places costs
    const endangeredPlacesCost = addedPlaces.reduce((total, place) => {
      // Estimate costs based on threat level and location
      const baseCost =
        place.threatLevel === 'critical' ? 1500 : place.threatLevel === 'high' ? 1000 : 800;
      const transportCost = 300; // Local transport to the place
      const guideCost = 500; // Local guide/witness fee
      return total + baseCost + transportCost + guideCost;
    }, 0);

    const baseTotal = basePrices.metro + basePrices.flight + basePrices.bus;
    const totalPerPerson = baseTotal + endangeredPlacesCost / numGuests;
    const total = baseTotal * numGuests + endangeredPlacesCost;

    // Group discount for 4+ travelers
    const discount = numGuests >= 4 ? 0.1 : 0;
    const finalTotal = total * (1 - discount);

    return {
      perPerson: totalPerPerson,
      subtotal: total,
      discount: total * discount,
      total: finalTotal,
      hasDiscount: numGuests >= 4,
      endangeredPlacesCost,
      baseTransportCost: baseTotal * numGuests,
    };
  };

  const pricing = calculatePricing();

  // Handle confirm and pay
  const handleConfirmAndPay = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Store journey data in sessionStorage to resume after login
      sessionStorage.setItem('pendingJourney', JSON.stringify({
        from,
        to,
        departure,
        returnDate,
        guests,
        intent,
        visitor,
        amount: journeySummary?.cost || pricing.total,
      }));

      toast({
        title: 'Login Required',
        description: 'Please login to continue with payment',
      });

      navigate('/auth?redirect=continue-journey');
      return;
    }

    // User is authenticated, navigate to QR payment
    const totalAmount = journeySummary?.cost || pricing.total;

    // Save pending booking to localStorage for persistence across pages
    const pendingBooking = {
      id: `BK${Date.now()}`,
      referenceNumber: `VGN-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
      status: 'pending_payment',
      from,
      to,
      // For Demo: Force specific dates
      date: '2025-12-17T09:00:00.000Z',
      returnDate: '2025-12-19T11:00:00.000Z',
      amount: totalAmount,
      guests: numGuests,
      coordinates: destinationLocation || { lat: 28.6139, lng: 77.2090 }, // Default to Delhi if missing
      hotel: {
        title: 'Determined by AI',
        location: to,
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000'
      }
    };
    localStorage.setItem('pendingBooking', JSON.stringify(pendingBooking));

    const params = new URLSearchParams({
      amount: totalAmount.toString(),
      description: `Journey from ${from} to ${to}`,
      type: 'journey',
    });
    navigate(`/qr-payment?${params.toString()}`);
  };

  // Load endangered places after planning is complete
  useEffect(() => {
    const loadEndangeredPlaces = async () => {
      if (!to || endangeredPlacesLoaded) return;

      setEndangeredPlacesLoading(true);
      try {
        const nearbyEndangeredPlaces = await endangeredPlacesService.findNearbyEndangeredPlaces(to);
        setEndangeredPlaces(nearbyEndangeredPlaces);
      } catch (error) {
        console.error('Error loading endangered places:', error);
      } finally {
        setEndangeredPlacesLoading(false);
        setEndangeredPlacesLoaded(true);
      }
    };

    // Load endangered places immediately when component mounts
    loadEndangeredPlaces();
  }, [to, endangeredPlacesLoaded]);

  // Handle adding endangered place to trip
  const handleAddToTrip = (place: EndangeredPlace) => {
    if (!addedPlaces.find(p => p.id === place.id)) {
      setAddedPlaces(prev => [...prev, place]);
      setAiPlanLoading(true);
      toast({
        title: 'Added to Your Trip! 🌍',
        description: `${place.name} has been added. AI is updating your journey plan with pricing...`,
        duration: 3000,
      });
    } else {
      toast({
        title: 'Already Added',
        description: `${place.name} is already in your trip.`,
        variant: 'destructive',
      });
    }
  };

  const [showCrowdAlert, setShowCrowdAlert] = useState(false);

  // Trigger crowd alert when destination is likely crowded (Mock logic)
  useEffect(() => {
    const safeAlternatives = ['Rishikesh', 'Udaipur', 'Coorg', 'Gokarna'];
    const isSafe = safeAlternatives.some(safe => to && to.includes(safe));
    const storageKey = `crowdAlertShown_${to}`;

    if (to && !showCrowdAlert && !isSafe && !sessionStorage.getItem(storageKey)) {
      console.log('Triggering crowd alert for:', to);
      // Simulate checking crowd levels
      const timer = setTimeout(() => {
        setShowCrowdAlert(true);
        sessionStorage.setItem(storageKey, 'true');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [to]);

  // Load map data
  useEffect(() => {
    const loadMapData = async () => {
      if (!from || !to) {
        console.log('Map data load skipped: missing from or to');
        setMapLoading(false);
        return;
      }

      setMapLoading(true);
      try {
        console.log('Loading map data for:', { from, to });

        // Geocode origin
        const originResults = await freeGeocodingService.search(from);
        console.log('Origin geocoding results:', originResults);

        if (originResults.length > 0) {
          setOriginLocation({
            lat: originResults[0].coordinates.lat,
            lng: originResults[0].coordinates.lng,
            name: from,
          });
        } else {
          console.error('No geocoding results for origin:', from);
        }

        // Geocode destination
        const destResults = await freeGeocodingService.search(to);
        console.log('Destination geocoding results:', destResults);

        if (destResults.length > 0) {
          setDestinationLocation({
            lat: destResults[0].coordinates.lat,
            lng: destResults[0].coordinates.lng,
            name: to,
          });

          // Calculate route if both locations are available
          if (originResults.length > 0) {
            console.log('Calculating route...');
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
            console.log('Route calculated:', route);
            setRouteSteps(route.steps);
          }
        } else {
          console.error('No geocoding results for destination:', to);
        }
      } catch (error) {
        console.error('Error loading map data:', error);
        toast({
          title: 'Map Load Error',
          description: 'Unable to load map data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setMapLoading(false);
      }
    };

    loadMapData();
  }, [from, to, toast]);

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
      Mumbai: 'BOM',
      Goa: 'GOI',
      Delhi: 'DEL',
      Bangalore: 'BLR',
      Chennai: 'MAA',
      Kolkata: 'CCU',
      Hyderabad: 'HYD',
      Jaipur: 'JAI',
      Pune: 'PNQ',
      Ahmedabad: 'AMD',
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
        description: "India's leading travel site",
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
          endangeredPlaces: addedPlaces.map(place => ({
            name: place.name,
            location: place.location,
            threatLevel: place.threatLevel,
            yearsRemaining: place.yearsRemaining,
            estimatedCost:
              place.threatLevel === 'critical' ? 2300 : place.threatLevel === 'high' ? 1800 : 1600,
          })),
          totalEndangeredPlacesCost: pricing.endangeredPlacesCost,
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
  }, [
    from,
    to,
    departure,
    returnDate,
    numGuests,
    intent,
    visitor,
    departureTime,
    addedPlaces,
    pricing.endangeredPlacesCost,
  ]);

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
            AI is analyzing {intent === 'urgent' ? 'fastest routes' : 'best experiences'} from{' '}
            {from} to {to}...
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
      {/* Crowd Alert Dialog */}
      <Dialog open={showCrowdAlert} onOpenChange={setShowCrowdAlert}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              High Footfall Alert: {to}
            </DialogTitle>
            <DialogDescription>
              {to} is expected to be very crowded during your selected dates due to local events.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-sm font-medium">Consider these less crowded, scenic alternatives nearby:</p>
            <div className="grid gap-2">
              {['Rishikesh (Pure Nature)', 'Udaipur (Lake Views)', 'Coorg (Hill Station)', 'Gokarna (Beach Vibes)'].map((loc, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="justify-start h-auto py-2 px-3 text-left hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200"
                  onClick={() => {
                    const placeName = loc.split(' (')[0];
                    setSearchParams(prev => {
                      const newParams = new URLSearchParams(prev);
                      newParams.set('to', placeName);
                      return newParams;
                    });

                    toast({
                      title: 'Destination Updated',
                      description: `Switched trip to ${placeName}. Recalculating route...`
                    });
                    setShowCrowdAlert(false);
                  }}
                >
                  <MapPin className="h-4 w-4 mr-2 opacity-50" />
                  {loc}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" onClick={() => setShowCrowdAlert(false)} className="text-muted-foreground hover:text-foreground">
              Stay with {to}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Small Context Layer Button - Top Right (hidden when panel is open) */}
      {!isContextOpen && (
        <button
          onClick={() => setIsContextOpen(true)}
          className="fixed top-4 right-4 z-50 p-2.5 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20 shadow-md hover:shadow-lg transition-all hover:scale-110 hover:bg-primary/20"
          title="Real-Time Updates"
        >
          <Zap className="w-4 h-4 text-primary" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
        </button>
      )}

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
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
        <Card className="p-3 mb-4">
          <div className="grid md:grid-cols-4 gap-3">
            <div className="flex items-center justify-center gap-2">
              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground text-center">From</p>
                <p className="font-medium text-sm truncate text-center">{from}</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Navigation className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground text-center">To</p>
                <p className="font-medium text-sm truncate text-center">{to}</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground text-center">
                  {returnDate ? 'Trip Dates' : 'Departure'}
                </p>
                <p className="font-medium text-sm text-center">
                  {departure && format(new Date(departure), 'MMM dd')}
                  {returnDate && ` - ${format(new Date(returnDate), 'MMM dd')}`}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Users className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground text-center">Travelers</p>
                <p className="font-medium text-sm text-center">{guests} guests</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Route Timeline */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-4 sm:p-6">
              <div className="mb-4 sm:mb-6">
                <h2 className="text-lg font-bold">Your Door-to-Door Route</h2>
              </div>

              <Tabs defaultValue="outbound" className="w-full">
                <TabsList className={`grid w-full ${returnDate ? 'grid-cols-4' : 'grid-cols-3'}`}>
                  <TabsTrigger value="outbound">Outbound</TabsTrigger>
                  {returnDate && <TabsTrigger value="return">Return</TabsTrigger>}
                  <TabsTrigger value="stops">Stops & Food</TabsTrigger>
                  <TabsTrigger value="stay">Accommodation</TabsTrigger>
                </TabsList>

                {/* Outbound Tab */}
                <TabsContent value="outbound" className="space-y-4 mt-4">
                  {aiPlanLoading ? (
                    <div className="flex flex-col items-center justify-center p-8 space-y-3">
                      <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Generating route...</p>
                    </div>
                  ) : parsedPlan?.outbound ? (
                    <JourneyVisualization
                      steps={parsedPlan.outbound}
                      journeyType="outbound"
                      onSummaryUpdate={setJourneySummary}
                    />
                  ) : (
                    <div className="text-center p-4 text-muted-foreground">
                      {aiPlanError || "No route available."}
                    </div>
                  )}
                </TabsContent>

                {/* Return Tab */}
                {returnDate && (
                  <TabsContent value="return" className="space-y-4 mt-4">
                    {parsedPlan?.return && parsedPlan.return.length > 0 ? (
                      <JourneyVisualization
                        steps={parsedPlan.return}
                        journeyType="return"
                      />
                    ) : (
                      <div className="text-center p-8 text-muted-foreground text-sm">
                        No return journey planned yet.
                      </div>
                    )}
                  </TabsContent>
                )}

                {/* Stops & Food Tab */}
                <TabsContent value="stops" className="space-y-4 mt-4">
                  <div className="grid gap-3">
                    {parsedPlan?.dining?.map((place: any, i: number) => (
                      <div key={i} className="flex items-start gap-4 p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                          <Utensils className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{place.title}</h4>
                          <p className="text-xs text-muted-foreground">{place.description}</p>
                          <div className="flex gap-2 mt-2 text-xs">
                            <Badge variant="outline">{place.time}</Badge>
                            <Badge variant="secondary">{place.cost}</Badge>
                          </div>
                        </div>
                      </div>
                    )) || <div className="text-center p-4 text-muted-foreground text-sm">No dining recommendations available.</div>}
                  </div>
                </TabsContent>

                {/* Accommodation Tab */}
                <TabsContent value="stay" className="space-y-4 mt-4">
                  <div className="grid gap-3">
                    {parsedPlan?.accommodation?.map((place: any, i: number) => (
                      <div key={i} className="flex items-start gap-4 p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                          <Bed className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{place.title}</h4>
                          <p className="text-xs text-muted-foreground">{place.location}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{place.description}</p>
                          <div className="flex gap-2 mt-2 text-xs">
                            <Badge variant="outline">Check-in: {place.checkIn}</Badge>
                            <Badge variant="secondary">{place.cost}</Badge>
                          </div>
                        </div>
                      </div>
                    )) || <div className="text-center p-4 text-muted-foreground text-sm">No accommodation recommendations available.</div>}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>











            {/* Endangered Places Section */}
            <EndangeredPlacesInline
              places={endangeredPlaces}
              destination={to}
              isLoading={endangeredPlacesLoading}
              onAddToTrip={handleAddToTrip}
            />

            {/* Added Places to Trip */}
            {
              addedPlaces.length > 0 && (
                <Card className="p-4 bg-green-50 border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                    ✅ Added to Your Trip
                  </h4>
                  <div className="space-y-2">
                    {addedPlaces.map(place => (
                      <div key={place.id} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-green-800">{place.name}</span>
                        <button
                          onClick={() => setAddedPlaces(prev => prev.filter(p => p.id !== place.id))}
                          className="ml-auto text-green-600 hover:text-green-800 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
              )
            }
          </div>

          {/* Right: Map & Info */}
          <div className="space-y-4">
            {/* Map moved to top */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Map className="h-4 w-4" />
                Route Map
              </h3>
              {
                mapLoading ? (
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
                )
              }
            </Card>

            {/* Journey Summary Card */}
            <Card className="p-6 border-2 border-primary/20 bg-primary/5">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-primary">
                <Navigation className="h-5 w-5" />
                Journey Summary
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Total Duration</span>
                  </div>
                  <span className="font-bold text-base">
                    {journeySummary?.duration || '8min'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Total Cost</span>
                  </div>
                  <span className="font-bold text-base text-primary">
                    ₹{journeySummary?.cost?.toLocaleString() || pricing.total.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Transport Modes</span>
                  </div>
                  <span className="font-bold text-base">{journeySummary?.modes || 1}</span>
                </div>
              </div>
            </Card>

            {/* Confirm and Pay Button */}
            <Button
              onClick={handleConfirmAndPay}
              className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              Confirm and Pay ₹{journeySummary?.cost?.toLocaleString() || pricing.total.toLocaleString()}
            </Button>

            <Card className="p-6">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
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
          </div>
        </div>
      </div>

      {/* BookOnce AI Chat Widget */}
      <BookOnceAISidebar
        isOpen={isAISidebarOpen}
        onClose={() => setIsAISidebarOpen(false)}
        onToggle={() => setIsAISidebarOpen(!isAISidebarOpen)}
      />

      {/* Context Layer Panel */}
      <ContextLayerPanel isOpen={isContextOpen} onClose={() => setIsContextOpen(false)} />

      {/* Flight Comparison Modal */}
      <Dialog open={showFlightModal} onOpenChange={setShowFlightModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Compare Flights: {selectedFlightRoute?.from} → {selectedFlightRoute?.to}
            </DialogTitle>
            <DialogDescription>
              Search real-time flights on multiple platforms • {numGuests}{' '}
              {numGuests === 1 ? 'passenger' : 'passengers'} •{' '}
              {selectedFlightRoute?.date &&
                format(new Date(selectedFlightRoute.date), 'MMM dd, yyyy')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 text-sm">No Account Required!</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Click any platform below to search flights with your details pre-filled. Compare
                    prices and book directly - no API keys or sign-ups needed!
                  </p>
                </div>
              </div>
            </div>

            {selectedFlightRoute &&
              generateFlightLinks(
                selectedFlightRoute.from,
                selectedFlightRoute.to,
                selectedFlightRoute.date
              ).map((platform, index) => (
                <Card
                  key={index}
                  className={`p-4 hover:shadow-lg transition-all border-2 ${platform.color}`}
                >
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
              💡 <strong>Pro Tip:</strong> Open multiple tabs to compare prices across platforms.
              Prices can vary significantly between sites. Each link opens with your search details
              pre-filled for instant results!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Route Segment Component
interface RouteSegmentProps {
  icon: ReactNode;
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

const RouteSegment = ({
  icon,
  mode,
  from,
  to,
  duration,
  distance,
  time,
  color,
  details,
  price,
  travelers,
  seatsRequired,
  onClick,
  isClickable,
}: RouteSegmentProps) => (
  <div
    className={`flex gap-4 p-4 rounded-lg border bg-card transition-colors ${isClickable
      ? 'cursor-pointer hover:bg-muted/50 hover:border-primary/50 hover:shadow-md'
      : 'hover:bg-muted/50'
      }`}
    onClick={onClick}
  >
    <div className="flex flex-col items-center">
      <div className={`p-2 rounded-full bg-muted ${color}`}>{icon}</div>
      <div className="w-px h-full bg-border mt-2" />
    </div>
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{mode}</span>
          {isClickable && <span className="text-xs text-blue-600 font-medium">View Options →</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{time}</span>
          {price && (
            <span className="text-xs font-medium text-primary">
              ₹{(price * (travelers || 1)).toLocaleString()}
            </span>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-1">
        {from} → {to}
      </p>
      {details && <p className="text-xs text-muted-foreground mb-2">{details}</p>}
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
  icon: ReactNode;
  title: string;
  location: string;
  time: string;
  description: string;
}

const StopCard = ({ icon, title, location, time, description }: StopCardProps) => (
  <div className="flex gap-4 p-4 rounded-lg border bg-card">
    <div className="p-2 rounded-full bg-muted h-fit">{icon}</div>
    <div className="flex-1">
      <h4 className="font-semibold text-sm mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground mb-1">{location}</p>
      <p className="text-xs text-muted-foreground mb-2">{time}</p>
      <p className="text-xs">{description}</p>
    </div>
  </div>
);

export default RoutePlanning;
