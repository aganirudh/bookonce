import { motion, AnimatePresence } from 'framer-motion';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import { DivIcon } from 'leaflet';
import {
  X,
  Volume2,
  MapPin,
  Cloud,
  Droplets,
  Wind,
  Thermometer,
  Search,
  Star,
  Users,
  Clock,
  Phone,
  Globe,
  Shield,
  AlertTriangle,
  Plus,
  HelpCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import heatspots from '../data/heatspots.json';
import echoes from '../data/echoes.json';
import { reviewService } from '../services/ReviewService';
import { safetyService } from '../services/SafetyService';
import { MapTutorial } from './MapTutorial';
import { CommunityReviewModal } from './CommunityReviewModal';
import { Button } from './ui/button';

interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  description: string;
  icon: string;
  location: string;
  aqi?: number;
  aqiLevel?: string;
}

interface POIData {
  id: string;
  name: string;
  type: string;
  coordinates: [number, number];
  rating?: number;
  reviews?: Array<{
    id: string;
    rating: number;
    text: string;
    author: string;
    date: string;
    helpful?: number;
  }>;
  amenity?: string;
  cuisine?: string;
  website?: string;
  phone?: string;
  opening_hours?: string;
  address?: string;
}

interface MapViewProps {
  isOpen: boolean;
  onClose: () => void;
  onEchoClick: (echo: (typeof echoes)[0]) => void;
  isNearby: boolean;
}

// Component to expose map instance and handle clicks
function MapController({
  onMapReady,
  onMapClick,
}: {
  onMapReady: (map: any) => void;
  onMapClick: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    onMapReady(map);

    // Add popup positioning fix
    map.on('popupopen', (e: any) => {
      const popup = e.popup;
      const popupElement = popup.getElement();

      if (popupElement) {
        // Ensure popup stays within viewport
        setTimeout(() => {
          const rect = popupElement.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;

          // Check if popup is going off-screen and adjust
          if (rect.right > viewportWidth - 20) {
            popupElement.style.transform = `translateX(-${rect.right - viewportWidth + 30}px)`;
          }
          if (rect.left < 20) {
            popupElement.style.transform = `translateX(${30 - rect.left}px)`;
          }
          if (rect.bottom > viewportHeight - 20) {
            popupElement.style.transform = `translateY(-${rect.bottom - viewportHeight + 30}px)`;
          }
          if (rect.top < 20) {
            popupElement.style.transform = `translateY(${30 - rect.top}px)`;
          }
        }, 10);
      }
    });
  }, [map, onMapReady]);

  useMapEvents({
    click: e => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}

const MapContent = ({
  onEchoClick,
  isNearby,
  onMapReady,
  onMapClick,
  pois,
  safetyData,
  onAddReview,
}: {
  onEchoClick: (echo: (typeof echoes)[0]) => void;
  isNearby: boolean;
  onMapReady: (map: any) => void;
  onMapClick: (lat: number, lng: number) => void;
  pois: POIData[];
  safetyData: any[];
  onAddReview: (location: any, type: 'place' | 'safety') => void;
}) => {
  return (
    <>
      <MapController onMapReady={onMapReady} onMapClick={onMapClick} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Heatspots */}
      {heatspots.map(spot => (
        <CircleMarker
          key={spot.id}
          center={[spot.coordinates[0], spot.coordinates[1]]}
          radius={30 * spot.intensity}
          pathOptions={{
            color: 'transparent',
            fillColor:
              spot.type === 'event' ? '#ef4444' : spot.type === 'food' ? '#f97316' : '#8b5cf6',
            fillOpacity: 0.4,
          }}
        >
          <Popup
            closeButton={true}
            className="custom-popup"
            maxWidth={280}
            minWidth={200}
            autoPan={true}
            autoPanPadding={[30, 30]}
            keepInView={true}
            autoPanPaddingTopLeft={[10, 10]}
            autoPanPaddingBottomRight={[10, 10]}
          >
            <div className="p-3 max-w-[280px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                <span className="font-semibold text-sm">{spot.title}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{spot.description}</p>

              {/* Reviews Section */}
              <div className="border-t pt-2">
                <div className="flex items-center gap-1 mb-1">
                  <div className="flex text-yellow-400">
                    {'★'.repeat(Math.floor(Math.random() * 2) + 3)}
                    {'☆'.repeat(5 - (Math.floor(Math.random() * 2) + 3))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    ({Math.floor(Math.random() * 50) + 10} reviews)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground italic">
                  "
                  {spot.type === 'food'
                    ? 'Amazing local cuisine!'
                    : spot.type === 'event'
                      ? 'Great atmosphere!'
                      : 'Must visit!'}
                  "
                </p>
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {/* Echo Markers */}
      {echoes.map(echo => {
        const echoIcon = new DivIcon({
          className: 'custom-echo-marker',
          html: `
            <div class="w-10 h-10 rounded-full bg-purple-500/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:scale-110 transition-transform border-2 border-purple-400/50">
              <svg class="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" x2="12" y1="19" y2="22"/>
              </svg>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        return (
          <Marker
            key={echo.id}
            position={[echo.coordinates[0], echo.coordinates[1]]}
            icon={echoIcon}
            eventHandlers={{
              click: () => onEchoClick(echo),
            }}
          >
            <Popup
              closeButton={true}
              className="custom-popup"
              maxWidth={280}
              minWidth={180}
              autoPan={true}
              autoPanPadding={[30, 30]}
              keepInView={true}
              autoPanPaddingTopLeft={[10, 10]}
              autoPanPaddingBottomRight={[10, 10]}
            >
              <div className="p-3 max-w-[280px]">
                <div className="flex items-center gap-2 mb-2">
                  <Volume2 className="w-4 h-4 text-purple-600" />
                  <span className="font-semibold text-sm">{echo.title}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Click to {isNearby ? 'listen' : 'preview'}
                </p>

                {/* Audio Preview */}
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
                      <Volume2 className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium">Audio Echo</div>
                      <div className="text-xs text-muted-foreground">
                        Duration: {Math.floor(Math.random() * 60) + 30}s
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reviews */}
                <div className="border-t pt-2">
                  <div className="flex items-center gap-1 mb-1">
                    <div className="flex text-yellow-400 text-xs">
                      {'★'.repeat(4)}
                      {'☆'}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      ({Math.floor(Math.random() * 20) + 5} listens)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    "Fascinating local sounds and stories!"
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* POI Markers with Reviews */}
      {pois.map(poi => {
        const poiIcon = new DivIcon({
          className: 'custom-poi-marker',
          html: `
            <div class="w-8 h-8 rounded-full bg-blue-500/90 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:scale-110 transition-transform border-2 border-white shadow-lg">
              <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });

        return (
          <Marker key={`poi-${poi.id}`} position={poi.coordinates} icon={poiIcon}>
            <Popup
              closeButton={true}
              className="custom-popup poi-popup"
              maxWidth={320}
              minWidth={280}
              autoPan={true}
              autoPanPadding={[30, 30]}
              keepInView={true}
              autoPanPaddingTopLeft={[15, 15]}
              autoPanPaddingBottomRight={[15, 15]}
            >
              <div className="p-4 max-w-[320px]">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-base text-foreground mb-1">{poi.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                        {poi.type}
                      </span>
                      {poi.cuisine && (
                        <span className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded-full">
                          {poi.cuisine}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rating */}
                {poi.rating && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-sm">{poi.rating}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      ({poi.reviews?.length || 0} reviews)
                    </span>
                  </div>
                )}

                {/* Contact Info */}
                <div className="space-y-2 mb-3">
                  {poi.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-muted-foreground line-clamp-2">
                        {poi.address}
                      </span>
                    </div>
                  )}
                  {poi.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{poi.phone}</span>
                    </div>
                  )}
                  {poi.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-3 h-3 text-muted-foreground" />
                      <a
                        href={poi.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                  {poi.opening_hours && (
                    <div className="flex items-start gap-2">
                      <Clock className="w-3 h-3 text-muted-foreground mt-0.5" />
                      <span className="text-xs text-muted-foreground">{poi.opening_hours}</span>
                    </div>
                  )}
                </div>

                {/* Latest Review */}
                {poi.reviews && poi.reviews.length > 0 && (
                  <div className="border-t pt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs font-medium text-foreground">Latest Review</span>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex text-yellow-400">
                          {'★'.repeat(poi.reviews[0].rating)}
                          {'☆'.repeat(5 - poi.reviews[0].rating)}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          by {poi.reviews[0].author}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground italic line-clamp-3">
                        "{poi.reviews[0].text}"
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">{poi.reviews[0].date}</span>
                        {poi.reviews[0].helpful && (
                          <span className="text-xs text-muted-foreground">
                            {poi.reviews[0].helpful} found helpful
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Add Review Button */}
                <div className="border-t pt-3 mt-3">
                  <Button
                    size="sm"
                    onClick={() =>
                      onAddReview(
                        {
                          name: poi.name,
                          coordinates: poi.coordinates,
                          address: poi.address,
                        },
                        'place'
                      )
                    }
                    className="w-full flex items-center gap-2"
                  >
                    <Plus className="w-3 h-3" />
                    Add Review
                  </Button>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Safety Markers */}
      {safetyData.map(safety => {
        const getSafetyIcon = (type: string, severity: string) => {
          const colors = {
            low: '#22c55e',
            medium: '#f59e0b',
            high: '#ef4444',
            critical: '#dc2626',
          };

          const icons = {
            police: '👮',
            hospital: '🏥',
            emergency: '🚨',
            crime: '⚠️',
            alert: '🔔',
            community: '👥',
          };

          return `
            <div class="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform border-2 border-white shadow-lg" style="background-color: ${colors[severity as keyof typeof colors] || colors.medium}">
              <span class="text-sm">${icons[type as keyof typeof icons] || '📍'}</span>
            </div>
          `;
        };

        const safetyIcon = new DivIcon({
          className: 'custom-safety-marker',
          html: getSafetyIcon(safety.type, safety.severity),
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });

        return (
          <Marker key={`safety-${safety.id}`} position={safety.coordinates} icon={safetyIcon}>
            <Popup
              closeButton={true}
              className="custom-popup safety-popup"
              maxWidth={300}
              minWidth={250}
              autoPan={true}
              autoPanPadding={[30, 30]}
              keepInView={true}
              autoPanPaddingTopLeft={[15, 15]}
              autoPanPaddingBottomRight={[15, 15]}
            >
              <div className="p-4 max-w-[300px]">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          safety.severity === 'low'
                            ? 'bg-green-500'
                            : safety.severity === 'medium'
                              ? 'bg-yellow-500'
                              : safety.severity === 'high'
                                ? 'bg-red-500'
                                : 'bg-red-600'
                        }`}
                      />
                      <span className="text-xs px-2 py-1 bg-secondary rounded-full capitalize">
                        {safety.type}
                      </span>
                      {safety.verified && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                          Verified
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm text-foreground mb-1">{safety.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{safety.description}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Source:</span>
                    <span className="font-medium">{safety.source}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Reported:</span>
                    <span className="font-medium">
                      {new Date(safety.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  {safety.contact && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Contact:</span>
                      <span className="font-medium">{safety.contact}</span>
                    </div>
                  )}
                </div>

                {/* Report Safety Concern Button */}
                {safety.type !== 'police' && safety.type !== 'hospital' && (
                  <div className="border-t pt-3 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        onAddReview(
                          {
                            name: safety.title,
                            coordinates: safety.coordinates,
                            address: safety.address,
                          },
                          'safety'
                        )
                      }
                      className="w-full flex items-center gap-2"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      Report Concern
                    </Button>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

const MapView = ({ isOpen, onClose, onEchoClick, isNearby }: MapViewProps) => {
  let mapInstance: any = null;
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [pois, setPois] = useState<POIData[]>([]);
  const [poisLoading, setPoisLoading] = useState(false);
  const [safetyData, setSafetyData] = useState<any[]>([]);
  const [safetyLoading, setSafetyLoading] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewLocation, setReviewLocation] = useState<any>(null);
  const [reviewType, setReviewType] = useState<'place' | 'safety'>('place');

  // Show tutorial every time the map opens
  useEffect(() => {
    if (isOpen) {
      setShowTutorial(true);
    }
  }, [isOpen]);

  const handleMapReady = (map: any) => {
    mapInstance = map;
  };

  const handleSearch = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
        {
          headers: {
            'User-Agent': 'BookOnceApp/1.0',
          },
        }
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleSelectLocation = (result: any) => {
    if (mapInstance) {
      mapInstance.flyTo([parseFloat(result.lat), parseFloat(result.lon)], 10, {
        duration: 1.5,
      });
      setSearchQuery('');
      setSearchResults([]);
      handleMapClick(parseFloat(result.lat), parseFloat(result.lon));
    }
  };

  const handleZoomIn = () => {
    if (mapInstance) {
      mapInstance.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstance) {
      mapInstance.zoomOut();
    }
  };

  const handleMapClick = async (lat: number, lng: number) => {
    setWeatherLoading(true);
    setWeatherError(null);
    setWeather(null);
    setPoisLoading(true);

    try {
      // Using Open-Meteo API (completely free, works worldwide, no API key needed)
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`
      );

      if (!weatherResponse.ok) {
        throw new Error('Weather service unavailable');
      }

      const weatherData = await weatherResponse.json();

      // Map weather codes to descriptions (WMO Weather interpretation codes)
      const weatherDescriptions: { [key: number]: string } = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        56: 'Freezing drizzle',
        57: 'Dense freezing drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        66: 'Freezing rain',
        67: 'Heavy freezing rain',
        71: 'Slight snow',
        73: 'Moderate snow',
        75: 'Heavy snow',
        77: 'Snow grains',
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers',
        85: 'Slight snow showers',
        86: 'Heavy snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with hail',
        99: 'Thunderstorm with heavy hail',
      };

      // Get location name using reverse geocoding (with fallback)
      let locationName = `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;

      try {
        const geoResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
          {
            headers: {
              'User-Agent': 'BookOnceApp/1.0',
            },
          }
        );

        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          if (geoData.address) {
            const parts = [];
            if (geoData.address.city) parts.push(geoData.address.city);
            else if (geoData.address.town) parts.push(geoData.address.town);
            else if (geoData.address.village) parts.push(geoData.address.village);

            if (geoData.address.country) parts.push(geoData.address.country);

            if (parts.length > 0) {
              locationName = parts.join(', ');
            }
          }
        }
      } catch (geoError) {
        console.log('Geocoding failed, using coordinates:', geoError);
      }

      const weatherCode = weatherData.current.weather_code;
      const temp = weatherData.current.temperature_2m;

      // Fetch AQI data from Open-Meteo Air Quality API
      let aqi = undefined;
      let aqiLevel = undefined;

      try {
        const aqiResponse = await fetch(
          `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&current=us_aqi`
        );

        if (aqiResponse.ok) {
          const aqiData = await aqiResponse.json();
          aqi = Math.round(aqiData.current.us_aqi);

          // Determine AQI level
          if (aqi <= 50) aqiLevel = 'Good';
          else if (aqi <= 100) aqiLevel = 'Moderate';
          else if (aqi <= 150) aqiLevel = 'Unhealthy for Sensitive';
          else if (aqi <= 200) aqiLevel = 'Unhealthy';
          else if (aqi <= 300) aqiLevel = 'Very Unhealthy';
          else aqiLevel = 'Hazardous';
        }
      } catch (aqiError) {
        console.log('AQI data unavailable:', aqiError);
      }

      setWeather({
        temp: Math.round(temp),
        feels_like: Math.round(temp - 2), // Simple approximation
        humidity: Math.round(weatherData.current.relative_humidity_2m),
        wind_speed: Math.round(weatherData.current.wind_speed_10m * 10) / 10,
        description: weatherDescriptions[weatherCode] || 'Unknown conditions',
        icon: weatherCode <= 3 ? '01d' : '10d',
        location: locationName,
        aqi,
        aqiLevel,
      });
    } catch (error) {
      console.error('Weather fetch error:', error);
      setWeatherError('Unable to fetch weather data for this location');
    } finally {
      setWeatherLoading(false);
    }

    // Load POIs and safety data near the clicked location
    try {
      const [nearbyPois, safetySummary] = await Promise.all([
        reviewService.getPOIsNearLocation(lat, lng, 1000),
        safetyService.getSafetyData(lat, lng, 2000),
      ]);
      setPois(nearbyPois);
      setSafetyData(safetySummary);
    } catch (error) {
      console.error('Error loading location data:', error);
    } finally {
      setPoisLoading(false);
      setSafetyLoading(false);
    }
  };

  const handleAddReview = (location: any, type: 'place' | 'safety' = 'place') => {
    setReviewLocation(location);
    setReviewType(type);
    setShowReviewModal(true);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 modal-backdrop"
            onClick={onClose}
          />

          {/* Map Modal */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-24 bottom-6 left-6 right-6 md:left-12 md:right-12 lg:left-16 lg:right-16 z-50 bg-card rounded-2xl overflow-hidden shadow-2xl border border-border"
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-[1000] bg-card/95 backdrop-blur-lg px-5 py-3 flex items-center justify-between border-b border-border/50 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-semibold text-foreground">
                    Serendipity Map
                  </h3>
                  <p className="text-[10px] text-muted-foreground">Discover what's happening NOW</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Legend */}
                <div className="hidden md:flex items-center gap-3 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
                    <span className="text-muted-foreground">Events</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-warning/70" />
                    <span className="text-muted-foreground">Food</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary/70" />
                    <span className="text-muted-foreground">Echoes</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500/70" />
                    <span className="text-muted-foreground">Places</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                    <span className="text-muted-foreground">Safety</span>
                  </div>
                </div>

                {/* Tutorial Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTutorial(true)}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Help</span>
                </Button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  aria-label="Close map"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Search Box */}
            <div className="absolute top-20 right-6 z-[1000] w-80">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  placeholder="Search location..."
                  className="w-full px-4 py-3 pl-11 bg-card/95 backdrop-blur-xl rounded-xl shadow-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>

              {searchResults.length > 0 && (
                <div className="mt-2 bg-card/95 backdrop-blur-xl rounded-xl shadow-xl border border-border overflow-hidden">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectLocation(result)}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-secondary transition-colors border-b border-border last:border-b-0"
                    >
                      <div className="font-medium text-foreground">
                        {result.display_name.split(',')[0]}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {result.display_name}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Map Container */}
            <div className="w-full h-full pt-14">
              <MapContainer
                center={[20, 0]}
                zoom={2}
                zoomControl={false}
                style={{ height: '100%', width: '100%' }}
                className="rounded-b-2xl"
                minZoom={2}
                maxBounds={[
                  [-90, -180],
                  [90, 180],
                ]}
              >
                <MapContent
                  onEchoClick={onEchoClick}
                  isNearby={isNearby}
                  onMapReady={handleMapReady}
                  onMapClick={handleMapClick}
                  pois={pois}
                  safetyData={safetyData}
                  onAddReview={handleAddReview}
                />
              </MapContainer>
            </div>

            {/* Weather Display */}
            <AnimatePresence>
              {weather && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="absolute top-20 left-6 z-[1000] bg-card/95 backdrop-blur-xl rounded-2xl shadow-xl border border-border p-4 min-w-[280px]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-5 h-5 text-primary" />
                      <h4 className="font-semibold text-sm">Weather</h4>
                    </div>
                    <button
                      onClick={() => setWeather(null)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                    {weather.location}
                  </p>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-4xl font-bold text-foreground">{weather.temp}°C</div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {weather.description}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                    <div className="flex flex-col items-center gap-1 p-2 bg-secondary rounded-lg">
                      <Thermometer className="w-4 h-4 text-warning" />
                      <span className="text-muted-foreground">Feels like</span>
                      <span className="font-semibold">{weather.feels_like}°C</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 bg-secondary rounded-lg">
                      <Droplets className="w-4 h-4 text-info" />
                      <span className="text-muted-foreground">Humidity</span>
                      <span className="font-semibold">{weather.humidity}%</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 bg-secondary rounded-lg">
                      <Wind className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Wind</span>
                      <span className="font-semibold">{weather.wind_speed} km/h</span>
                    </div>
                  </div>

                  {/* Air Quality Index */}
                  {weather.aqi !== undefined && (
                    <div
                      className={`p-3 rounded-lg text-center ${
                        weather.aqi <= 50
                          ? 'bg-success/10 border border-success/20'
                          : weather.aqi <= 100
                            ? 'bg-warning/10 border border-warning/20'
                            : weather.aqi <= 150
                              ? 'bg-warning/20 border border-warning/30'
                              : weather.aqi <= 200
                                ? 'bg-destructive/10 border border-destructive/20'
                                : weather.aqi <= 300
                                  ? 'bg-destructive/20 border border-destructive/30'
                                  : 'bg-destructive/30 border border-destructive/40'
                      }`}
                    >
                      <div className="text-xs font-semibold text-muted-foreground mb-1">
                        Air Quality Index
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <span
                          className={`text-2xl font-bold ${
                            weather.aqi <= 50
                              ? 'text-success'
                              : weather.aqi <= 100
                                ? 'text-warning'
                                : weather.aqi <= 150
                                  ? 'text-warning'
                                  : weather.aqi <= 200
                                    ? 'text-destructive'
                                    : weather.aqi <= 300
                                      ? 'text-destructive'
                                      : 'text-destructive'
                          }`}
                        >
                          {weather.aqi}
                        </span>
                        <span
                          className={`text-xs font-medium ${
                            weather.aqi <= 50
                              ? 'text-success'
                              : weather.aqi <= 100
                                ? 'text-warning'
                                : weather.aqi <= 150
                                  ? 'text-warning'
                                  : weather.aqi <= 200
                                    ? 'text-destructive'
                                    : weather.aqi <= 300
                                      ? 'text-destructive'
                                      : 'text-destructive'
                          }`}
                        >
                          {weather.aqiLevel}
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Weather Loading Indicator */}
            {weatherLoading && (
              <div className="absolute top-20 left-6 z-[1000] bg-card/95 backdrop-blur-xl rounded-2xl shadow-xl border border-border p-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading weather...</span>
                </div>
              </div>
            )}

            {/* POIs Loading Indicator */}
            {poisLoading && (
              <div className="absolute bottom-20 left-6 z-[1000] bg-card/95 backdrop-blur-xl rounded-xl shadow-xl border border-border p-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-muted-foreground">Loading places & reviews...</span>
                </div>
              </div>
            )}

            {/* Weather Error */}
            {weatherError && (
              <div className="absolute top-20 left-6 z-[1000] bg-destructive/10 rounded-2xl shadow-xl border border-destructive/20 p-4">
                <div className="flex items-center gap-2">
                  <X className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-destructive">{weatherError}</span>
                </div>
              </div>
            )}

            {/* Custom Zoom Controls - Horizontal */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex gap-2 bg-card rounded-xl shadow-lg p-1.5 border border-border">
              <button
                onClick={handleZoomOut}
                className="w-12 h-12 rounded-lg bg-card hover:bg-secondary flex items-center justify-center text-foreground hover:text-foreground transition-all"
                aria-label="Zoom out"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M18 12H6"
                  />
                </svg>
              </button>
              <div className="w-px bg-border" />
              <button
                onClick={handleZoomIn}
                className="w-12 h-12 rounded-lg bg-card hover:bg-secondary flex items-center justify-center text-foreground hover:text-foreground transition-all"
                aria-label="Zoom in"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M12 6v12m6-6H6"
                  />
                </svg>
              </button>
            </div>
          </motion.div>

          {/* Tutorial Modal */}
          <MapTutorial
            isOpen={showTutorial}
            onClose={() => setShowTutorial(false)}
            onComplete={() => setShowTutorial(false)}
          />

          {/* Community Review Modal */}
          <CommunityReviewModal
            isOpen={showReviewModal}
            onClose={() => setShowReviewModal(false)}
            location={reviewLocation}
            type={reviewType}
          />
        </>
      )}
    </AnimatePresence>
  );
};

export default MapView;
