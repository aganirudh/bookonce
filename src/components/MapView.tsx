import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import { DivIcon } from "leaflet";
import { X, Volume2, MapPin, Cloud, Droplets, Wind, Thermometer, Search } from "lucide-react";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import heatspots from "../data/heatspots.json";
import echoes from "../data/echoes.json";

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

interface MapViewProps {
  isOpen: boolean;
  onClose: () => void;
  onEchoClick: (echo: typeof echoes[0]) => void;
  isNearby: boolean;
}

// Component to expose map instance and handle clicks
function MapController({ onMapReady, onMapClick }: { onMapReady: (map: any) => void; onMapClick: (lat: number, lng: number) => void }) {
  const map = useMap();
  
  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);
  
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  
  return null;
}

const MapContent = ({ onEchoClick, isNearby, onMapReady, onMapClick }: { onEchoClick: (echo: typeof echoes[0]) => void; isNearby: boolean; onMapReady: (map: any) => void; onMapClick: (lat: number, lng: number) => void }) => {
  return (
    <>
      <MapController onMapReady={onMapReady} onMapClick={onMapClick} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {/* Heatspots */}
      {heatspots.map((spot) => (
        <CircleMarker
          key={spot.id}
          center={[spot.coordinates[0], spot.coordinates[1]]}
          radius={30 * spot.intensity}
          pathOptions={{
            color: "transparent",
            fillColor: spot.type === "event" ? "#ef4444" : spot.type === "food" ? "#f97316" : "#8b5cf6",
            fillOpacity: 0.4,
          }}
        >
          <Popup>
            <div className="p-2 min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-semibold text-sm">{spot.title}</span>
              </div>
              <p className="text-xs text-gray-600">{spot.description}</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {/* Echo Markers */}
      {echoes.map((echo) => {
        const echoIcon = new DivIcon({
          className: "custom-echo-marker",
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
            <Popup>
              <div className="p-2 min-w-[180px]">
                <div className="flex items-center gap-2 mb-1">
                  <Volume2 className="w-4 h-4 text-purple-600" />
                  <span className="font-semibold text-sm">{echo.title}</span>
                </div>
                <p className="text-xs text-gray-500">Click to {isNearby ? "listen" : "preview"}</p>
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
            'User-Agent': 'VagabondApp/1.0'
          }
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
        duration: 1.5
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
              'User-Agent': 'VagabondApp/1.0'
            }
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
        aqiLevel
      });
    } catch (error) {
      console.error('Weather fetch error:', error);
      setWeatherError('Unable to fetch weather data for this location');
    } finally {
      setWeatherLoading(false);
    }
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
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-md"
            onClick={onClose}
          />
          
          {/* Map Modal */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-24 bottom-6 left-6 right-6 md:left-12 md:right-12 lg:left-16 lg:right-16 z-50 bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200"
          >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-[1000] bg-white/95 backdrop-blur-lg px-5 py-3 flex items-center justify-between border-b border-slate-200/50 rounded-t-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <MapPin className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-serif text-base font-semibold text-slate-900">Serendipity Map</h3>
                <p className="text-[10px] text-slate-500">Discover what's happening NOW</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Legend */}
              <div className="hidden md:flex items-center gap-3 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                  <span className="text-slate-600">Events</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400/70" />
                  <span className="text-slate-600">Food</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400/70" />
                  <span className="text-slate-600">Echoes</span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
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
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                placeholder="Search location..."
                className="w-full px-4 py-3 pl-11 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
            
            {searchResults.length > 0 && (
              <div className="mt-2 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-slate-200 overflow-hidden">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectLocation(result)}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                  >
                    <div className="font-medium text-slate-900">{result.display_name.split(',')[0]}</div>
                    <div className="text-xs text-slate-500 line-clamp-1">{result.display_name}</div>
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
              style={{ height: "100%", width: "100%" }}
              className="rounded-b-2xl"
              minZoom={2}
              maxBounds={[[-90, -180], [90, 180]]}
            >
              <MapContent onEchoClick={onEchoClick} isNearby={isNearby} onMapReady={handleMapReady} onMapClick={handleMapClick} />
            </MapContainer>
          </div>

          {/* Weather Display */}
          <AnimatePresence>
            {weather && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute top-20 left-6 z-[1000] bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200 p-4 min-w-[280px]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-blue-500" />
                    <h4 className="font-semibold text-sm">Weather</h4>
                  </div>
                  <button
                    onClick={() => setWeather(null)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <p className="text-xs text-slate-500 mb-3 line-clamp-1">{weather.location}</p>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl font-bold text-slate-900">{weather.temp}°C</div>
                  <div className="text-sm text-slate-600 capitalize">{weather.description}</div>
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                  <div className="flex flex-col items-center gap-1 p-2 bg-slate-50 rounded-lg">
                    <Thermometer className="w-4 h-4 text-orange-500" />
                    <span className="text-slate-500">Feels like</span>
                    <span className="font-semibold">{weather.feels_like}°C</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 p-2 bg-slate-50 rounded-lg">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    <span className="text-slate-500">Humidity</span>
                    <span className="font-semibold">{weather.humidity}%</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 p-2 bg-slate-50 rounded-lg">
                    <Wind className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-500">Wind</span>
                    <span className="font-semibold">{weather.wind_speed} km/h</span>
                  </div>
                </div>
                
                {/* Air Quality Index */}
                {weather.aqi !== undefined && (
                  <div className={`p-3 rounded-lg text-center ${
                    weather.aqi <= 50 ? 'bg-green-50 border border-green-200' :
                    weather.aqi <= 100 ? 'bg-yellow-50 border border-yellow-200' :
                    weather.aqi <= 150 ? 'bg-orange-50 border border-orange-200' :
                    weather.aqi <= 200 ? 'bg-red-50 border border-red-200' :
                    weather.aqi <= 300 ? 'bg-purple-50 border border-purple-200' :
                    'bg-red-100 border border-red-300'
                  }`}>
                    <div className="text-xs font-semibold text-slate-600 mb-1">Air Quality Index</div>
                    <div className="flex items-center justify-center gap-2">
                      <span className={`text-2xl font-bold ${
                        weather.aqi <= 50 ? 'text-green-600' :
                        weather.aqi <= 100 ? 'text-yellow-600' :
                        weather.aqi <= 150 ? 'text-orange-600' :
                        weather.aqi <= 200 ? 'text-red-600' :
                        weather.aqi <= 300 ? 'text-purple-600' :
                        'text-red-700'
                      }`}>{weather.aqi}</span>
                      <span className={`text-xs font-medium ${
                        weather.aqi <= 50 ? 'text-green-700' :
                        weather.aqi <= 100 ? 'text-yellow-700' :
                        weather.aqi <= 150 ? 'text-orange-700' :
                        weather.aqi <= 200 ? 'text-red-700' :
                        weather.aqi <= 300 ? 'text-purple-700' :
                        'text-red-800'
                      }`}>{weather.aqiLevel}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Weather Loading Indicator */}
          {weatherLoading && (
            <div className="absolute top-20 left-6 z-[1000] bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-slate-600">Loading weather...</span>
              </div>
            </div>
          )}

          {/* Weather Error */}
          {weatherError && (
            <div className="absolute top-20 left-6 z-[1000] bg-red-50 rounded-2xl shadow-xl border border-red-200 p-4">
              <div className="flex items-center gap-2">
                <X className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600">{weatherError}</span>
              </div>
            </div>
          )}

          {/* Custom Zoom Controls - Horizontal */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex gap-2 bg-white rounded-xl shadow-lg p-1.5 border border-slate-200">
            <button
              onClick={handleZoomOut}
              className="w-12 h-12 rounded-lg bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 hover:text-slate-900 transition-all"
              aria-label="Zoom out"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 12H6" />
              </svg>
            </button>
            <div className="w-px bg-slate-200" />
            <button
              onClick={handleZoomIn}
              className="w-12 h-12 rounded-lg bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 hover:text-slate-900 transition-all"
              aria-label="Zoom in"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v12m6-6H6" />
              </svg>
            </button>
          </div>
        </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MapView;
