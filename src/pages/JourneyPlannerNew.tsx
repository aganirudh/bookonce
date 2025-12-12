/**
 * Journey Planner Page
 * 
 * Complete door-to-door journey planning with:
 * - Location search (Nominatim - free)
 * - Route calculation (OpenRouteService - free)
 * - Weather forecast (Open-Meteo - free)
 * - Interactive map (Leaflet + OpenStreetMap - free)
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Navigation, Cloud, Clock, Route, AlertCircle } from 'lucide-react';
import { JourneyMap, type Location, type RouteStep } from '@/features/journey/components/JourneyMap';
import { freeGeocodingService, type GeocodingResult } from '@/features/journey/services/FreeGeocodingService';
import { freeRoutingService } from '@/features/journey/services/FreeRoutingService';
import { weatherService } from '@/features/journey/services/WeatherService';

export default function JourneyPlannerNew() {
  const [originQuery, setOriginQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [originSuggestions, setOriginSuggestions] = useState<GeocodingResult[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<GeocodingResult[]>([]);
  const [selectedOrigin, setSelectedOrigin] = useState<Location | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<Location | null>(null);
  const [route, setRoute] = useState<RouteStep[] | null>(null);
  const [routeSummary, setRouteSummary] = useState<string>('');
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [travelMode, setTravelMode] = useState<'driving-car' | 'cycling-regular' | 'foot-walking'>('driving-car');

  // Search for origin location
  const searchOrigin = async (query: string) => {
    if (query.length < 3) {
      setOriginSuggestions([]);
      return;
    }

    try {
      const results = await freeGeocodingService.search(query);
      setOriginSuggestions(results.slice(0, 5));
    } catch (err) {
      console.error('Origin search error:', err);
    }
  };

  // Search for destination location
  const searchDestination = async (query: string) => {
    if (query.length < 3) {
      setDestinationSuggestions([]);
      return;
    }

    try {
      const results = await freeGeocodingService.search(query);
      setDestinationSuggestions(results.slice(0, 5));
    } catch (err) {
      console.error('Destination search error:', err);
    }
  };

  // Select origin
  const selectOrigin = (result: GeocodingResult) => {
    setSelectedOrigin({
      lat: result.coordinates.lat,
      lng: result.coordinates.lng,
      name: result.displayName,
    });
    setOriginQuery(result.displayName);
    setOriginSuggestions([]);
  };

  // Select destination
  const selectDestination = (result: GeocodingResult) => {
    setSelectedDestination({
      lat: result.coordinates.lat,
      lng: result.coordinates.lng,
      name: result.displayName,
    });
    setDestinationQuery(result.displayName);
    setDestinationSuggestions([]);
  };

  // Plan journey
  const planJourney = async () => {
    if (!selectedOrigin || !selectedDestination) {
      setError('Please select both origin and destination');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get route
      const routeResult = await freeRoutingService.getRoute({
        origin: { lat: selectedOrigin.lat, lng: selectedOrigin.lng },
        destination: { lat: selectedDestination.lat, lng: selectedDestination.lng },
        mode: travelMode,
      });

      setRoute(routeResult.steps);
      setRouteSummary(routeResult.summary);

      // Get weather for destination
      const weatherData = await weatherService.getCurrentWeather(
        selectedDestination.lat,
        selectedDestination.lng
      );

      setWeather(weatherData);
    } catch (err: any) {
      setError(err.message || 'Failed to plan journey');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Journey Planner</h1>
        <p className="text-muted-foreground">
          Plan your door-to-door journey with free, open-source services
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Search */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Locations
              </CardTitle>
              <CardDescription>Enter your origin and destination</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Origin */}
              <div className="space-y-2">
                <Label htmlFor="origin">Origin</Label>
                <div className="relative">
                  <Input
                    id="origin"
                    placeholder="Search for origin..."
                    value={originQuery}
                    onChange={(e) => {
                      setOriginQuery(e.target.value);
                      searchOrigin(e.target.value);
                    }}
                  />
                  {originSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                      {originSuggestions.map((result, index) => (
                        <button
                          key={index}
                          className="w-full px-4 py-2 text-left hover:bg-secondary text-sm text-card-foreground"
                          onClick={() => selectOrigin(result)}
                        >
                          {result.displayName}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedOrigin && (
                  <Badge variant="secondary" className="mt-2">
                    <MapPin className="w-3 h-3 mr-1" />
                    Selected
                  </Badge>
                )}
              </div>

              {/* Destination */}
              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <div className="relative">
                  <Input
                    id="destination"
                    placeholder="Search for destination..."
                    value={destinationQuery}
                    onChange={(e) => {
                      setDestinationQuery(e.target.value);
                      searchDestination(e.target.value);
                    }}
                  />
                  {destinationSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                      {destinationSuggestions.map((result, index) => (
                        <button
                          key={index}
                          className="w-full px-4 py-2 text-left hover:bg-secondary text-sm text-card-foreground"
                          onClick={() => selectDestination(result)}
                        >
                          {result.displayName}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedDestination && (
                  <Badge variant="secondary" className="mt-2">
                    <MapPin className="w-3 h-3 mr-1" />
                    Selected
                  </Badge>
                )}
              </div>

              {/* Travel Mode */}
              <div className="space-y-2">
                <Label>Travel Mode</Label>
                <Tabs value={travelMode} onValueChange={(v: any) => setTravelMode(v)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="driving-car">🚗 Car</TabsTrigger>
                    <TabsTrigger value="cycling-regular">🚴 Bike</TabsTrigger>
                    <TabsTrigger value="foot-walking">🚶 Walk</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Plan Button */}
              <Button
                className="w-full"
                onClick={planJourney}
                disabled={!selectedOrigin || !selectedDestination || loading}
              >
                {loading ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Planning...
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4 mr-2" />
                    Plan Journey
                  </>
                )}
              </Button>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weather Card */}
          {weather && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="w-5 h-5" />
                  Weather at Destination
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold">{Math.round(weather.temp)}°C</span>
                    <img src={weather.iconUrl} alt={weather.description} className="w-16 h-16" />
                  </div>
                  <p className="text-sm text-muted-foreground capitalize">{weather.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Feels like:</span>
                      <span className="ml-1 font-medium">{Math.round(weather.feelsLike)}°C</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Humidity:</span>
                      <span className="ml-1 font-medium">{weather.humidity}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Wind:</span>
                      <span className="ml-1 font-medium">{weather.windSpeed} m/s</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Clouds:</span>
                      <span className="ml-1 font-medium">{weather.clouds}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel - Map and Route */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map */}
          {selectedOrigin && selectedDestination && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="w-5 h-5" />
                  Route Map
                </CardTitle>
                {routeSummary && (
                  <CardDescription>{routeSummary}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <JourneyMap
                  origin={selectedOrigin}
                  destination={selectedDestination}
                  route={route || undefined}
                  height="600px"
                />
              </CardContent>
            </Card>
          )}

          {/* Route Steps */}
          {route && route.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Route Instructions</CardTitle>
                <CardDescription>Step-by-step directions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {route
                    .filter((step) => step.instruction)
                    .map((step, index) => (
                      <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{step.instruction}</p>
                          {(step.distance || step.duration) && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {step.distance && `${freeRoutingService.formatDistance(step.distance)}`}
                              {step.distance && step.duration && ' • '}
                              {step.duration && `${freeRoutingService.formatDuration(step.duration)}`}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Placeholder when no journey planned */}
          {!selectedOrigin && !selectedDestination && (
            <Card className="h-[600px] flex items-center justify-center">
              <CardContent className="text-center">
                <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Plan Your Journey</h3>
                <p className="text-muted-foreground">
                  Enter origin and destination to see the route on the map
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Info Footer */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>100% Free Services:</strong> This journey planner uses OpenStreetMap (maps), Nominatim (geocoding),
          OpenRouteService (routing), and Open-Meteo (weather) - all completely free and open-source!
        </p>
      </div>
    </div>
  );
}
