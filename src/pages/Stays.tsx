import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import MapView from "@/components/MapView";
import EchoModal from "@/components/EchoModal";
import LocalShadowWidget from "@/components/LocalShadowWidget";
import SafetyMesh from "@/components/SafetyMesh";
import { ContextLayerPanel } from "@/components/ContextLayer";

import { Search, MapPin, Clock, AlertTriangle, Star, Users, Zap, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import hotelsData from "@/data/hotels.json";
import vanishingData from "@/data/vanishing-destinations.json";
import echoesData from "@/data/echoes.json";

const Stays = () => {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isNearby] = useState(true);
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [userLocation, setUserLocation] = useState<string>("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Echo Modal State
  const [selectedEcho, setSelectedEcho] = useState<typeof echoesData[0] | null>(null);
  const [isEchoModalOpen, setIsEchoModalOpen] = useState(false);



  // High contrast mode when offline
  useEffect(() => {
    if (isOffline) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  }, [isOffline]);

  // Detect user location
  const detectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            // Use reverse geocoding to get location name
            try {
              const response = await fetch(
                `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY`
              );
              const data = await response.json();
              if (data.results && data.results[0]) {
                const locationName = data.results[0].components.city || 
                                   data.results[0].components.town || 
                                   data.results[0].components.county || 
                                   data.results[0].components.state;
                setUserLocation(locationName);
                setLocation(locationName);
              }
            } catch (error) {
              // Fallback to coordinates
              setUserLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
              setLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
            }
            setIsDetectingLocation(false);
          },
          (error) => {
            console.error("Error detecting location:", error);
            setIsDetectingLocation(false);
          }
        );
      }
    } catch (error) {
      console.error("Geolocation not supported");
      setIsDetectingLocation(false);
    }
  };

  // Filter places based on search
  const filteredEndangeredPlaces = useMemo(() => {
    if (!location && !searchQuery) return [];
    
    return vanishingData.filter(place => {
      const matchesLocation = location ? 
        place.location.toLowerCase().includes(location.toLowerCase()) ||
        place.name.toLowerCase().includes(location.toLowerCase()) : true;
      
      const matchesSearch = searchQuery ?
        place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.culture.toLowerCase().includes(searchQuery.toLowerCase()) : true;
      
      return matchesLocation && matchesSearch;
    });
  }, [location, searchQuery]);

  const filteredPopularPlaces = useMemo(() => {
    if (!location && !searchQuery) return [];
    
    return hotelsData.filter(hotel => {
      const matchesLocation = location ? 
        hotel.location.toLowerCase().includes(location.toLowerCase()) ||
        hotel.title.toLowerCase().includes(location.toLowerCase()) : true;
      
      const matchesSearch = searchQuery ?
        hotel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hotel.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hotel.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) : true;
      
      return matchesLocation && matchesSearch;
    }).sort((a, b) => b.rating - a.rating);
  }, [location, searchQuery]);

  const handleEchoClick = (echo: typeof echoesData[0]) => {
    setSelectedEcho(echo);
    setIsEchoModalOpen(true);
  };



  return (
    <div className={`min-h-screen bg-background transition-colors duration-500 ${isOffline ? "high-contrast" : ""}`}>
      <Navbar 
        onSafetyClick={() => setIsSafetyOpen(true)} 
        isOffline={isOffline}
        onContextClick={() => setIsContextOpen(!isContextOpen)}
        onMapClick={() => setIsMapOpen(true)}
      />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm mb-6"
            >
              <span className="text-sm font-medium text-primary">🏨 Discover Places</span>
            </motion.div>

            <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground mb-6">
              Endangered & Popular
              <span className="block gradient-text">Destinations</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore vanishing places before they disappear forever, or visit the world's most beloved destinations
            </p>
          </motion.div>

          {/* Location Detection & Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-card rounded-2xl shadow-xl border border-border p-6 mb-8"
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* Detect Location Button */}
              <Button
                onClick={detectLocation}
                disabled={isDetectingLocation}
                variant="outline"
                className="flex items-center gap-2 min-w-fit"
              >
                <MapPin className="w-4 h-4" />
                {isDetectingLocation ? "Detecting..." : "Detect Location"}
              </Button>

              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search places, destinations, or cultures..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {userLocation && (
              <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                <p className="text-sm text-primary">
                  📍 Current location: <strong>{userLocation}</strong>
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Results Section - Two Column Layout */}
      {(location || searchQuery) && (
        <section className="px-4 pb-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8">
              
              {/* Left Column - Endangered Places */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <span className="text-sm font-medium text-destructive">Endangered Places</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {filteredEndangeredPlaces.length} places found
                  </span>
                </div>

                {filteredEndangeredPlaces.map((place, index) => (
                  <motion.div
                    key={place.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-border"
                  >
                    <div className="relative h-48">
                      <img
                        src={place.image}
                        alt={place.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      {/* Countdown Badge */}
                      <div className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-destructive/90 text-white">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-sm font-bold">{place.yearsRemaining} years left</span>
                        </div>
                      </div>

                      {/* Title Overlay */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="font-serif text-xl font-bold text-white mb-1">
                          {place.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-white/80">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="text-sm">{place.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5">
                      {/* Threats */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {place.threats.slice(0, 2).map((threat) => (
                          <span
                            key={threat}
                            className="px-2.5 py-1 text-xs font-medium bg-destructive/10 text-destructive rounded-lg"
                          >
                            {threat}
                          </span>
                        ))}
                      </div>

                      {/* Culture */}
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {place.culture}
                      </p>

                      {/* Stats & Book Button */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span className="text-sm">{place.witnesses} witnesses</span>
                        </div>
                        <Button
                          onClick={() => {
                            // Redirect to home page with destination pre-filled
                            const searchParams = new URLSearchParams({
                              to: place.location,
                              destination: place.name
                            });
                            window.location.href = `/?${searchParams.toString()}`;
                          }}
                          size="sm"
                          className="bg-destructive hover:bg-destructive/90 text-white"
                        >
                          Book Experience
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {filteredEndangeredPlaces.length === 0 && (
                  <div className="text-center py-12">
                    <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No endangered places found in this area</p>
                  </div>
                )}
              </div>

              {/* Right Column - Popular Places */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                    <Star className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Popular Places</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {filteredPopularPlaces.length} places found
                  </span>
                </div>

                {filteredPopularPlaces.map((hotel, index) => (
                  <motion.div
                    key={hotel.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-border"
                  >
                    <div className="relative h-48">
                      <img
                        src={hotel.image}
                        alt={hotel.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      
                      {/* Rating Badge */}
                      <div className="absolute top-4 left-4">
                        <div className="flex items-center gap-1 px-2 py-1 bg-black/70 rounded-full text-white text-xs">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{hotel.rating}</span>
                        </div>
                      </div>

                      {/* Instant Booking Badge */}
                      {hotel.instantBooking && (
                        <div className="absolute top-4 right-4">
                          <div className="px-2 py-1 bg-green-500 rounded-full text-white text-xs font-medium">
                            <Zap className="w-3 h-3 inline mr-1" />
                            Instant
                          </div>
                        </div>
                      )}

                      {/* Title Overlay */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="font-serif text-xl font-bold text-white mb-1">
                          {hotel.title}
                        </h3>
                        <div className="flex items-center gap-1.5 text-white/80">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="text-sm">{hotel.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5">
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {hotel.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary rounded-lg capitalize"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Amenities */}
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {hotel.amenities.slice(0, 3).join(" • ")}
                      </p>

                      {/* Price & Book Button */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold text-foreground">${hotel.price}</span>
                          <span className="text-muted-foreground text-sm">/night</span>
                        </div>
                        <Button
                          onClick={() => {
                            // Redirect to home page with destination pre-filled
                            const searchParams = new URLSearchParams({
                              to: hotel.location,
                              destination: hotel.title
                            });
                            window.location.href = `/?${searchParams.toString()}`;
                          }}
                          size="sm"
                          className="bg-primary hover:bg-primary/90"
                        >
                          Book Now
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {filteredPopularPlaces.length === 0 && (
                  <div className="text-center py-12">
                    <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No popular places found in this area</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Empty State */}
      {!location && !searchQuery && (
        <section className="px-4 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              Discover Amazing Places
            </h3>
            <p className="text-muted-foreground mb-8">
              Use location detection or search to find endangered places that need your witness, 
              or popular destinations loved by travelers worldwide.
            </p>
            <Button
              onClick={detectLocation}
              disabled={isDetectingLocation}
              className="bg-primary hover:bg-primary/90"
            >
              <MapPin className="w-4 h-4 mr-2" />
              {isDetectingLocation ? "Detecting Location..." : "Detect My Location"}
            </Button>
          </div>
        </section>
      )}

      {/* Local Shadow Widget (Floating) */}
      <LocalShadowWidget />

      {/* Context Layer Panel */}
      <ContextLayerPanel 
        isOpen={isContextOpen} 
        onClose={() => setIsContextOpen(false)} 
      />

      {/* Map View (Modal) */}
      <MapView
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onEchoClick={handleEchoClick}
        isNearby={isNearby}
      />

      {/* Echo Modal */}
      <EchoModal
        echo={selectedEcho}
        isOpen={isEchoModalOpen}
        onClose={() => setIsEchoModalOpen(false)}
        isNearby={isNearby}
      />



      {/* Safety Mesh Modal */}
      <SafetyMesh
        isOpen={isSafetyOpen}
        onClose={() => setIsSafetyOpen(false)}
        isOffline={isOffline}
        onToggleOffline={() => setIsOffline(!isOffline)}
      />
    </div>
  );
};

export default Stays;