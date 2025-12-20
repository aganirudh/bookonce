import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  Calendar,
  Zap,
  Palmtree,
  Sparkles,
  Navigation,
  Loader2,
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface HeroEnhancedProps {
  onPlanJourney: (params: JourneyParams) => void;
}

export interface JourneyParams {
  source: string;
  destination: string;
  departureDate: string;
  departureTime?: string;
  returnDate?: string;
  mode: 'urgent' | 'fun';
  guests: number;
}

const HeroEnhanced = ({ onPlanJourney }: HeroEnhancedProps) => {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [mode, setMode] = useState<'urgent' | 'fun'>('fun');
  const [guests, setGuests] = useState(1);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  // Auto-detect user location on mount
  useEffect(() => {
    handleGetCurrentLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGetCurrentLocation = () => {
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async position => {
          const { latitude, longitude } = position.coords;

          // Try to get city name from coordinates (reverse geocoding)
          // For now, use coordinates as fallback
          try {
            // In production, use Google Geocoding API here
            // For demo, we'll use a simple city detection
            const cityName = await getCityFromCoords(latitude, longitude);
            setSource(cityName || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          } catch (error) {
            setSource(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
          setIsLoadingLocation(false);
        },
        error => {
          console.error('Error getting location:', error);
          setSource('Your Location');
          setIsLoadingLocation(false);
        }
      );
    } else {
      setSource('Your Location');
      setIsLoadingLocation(false);
    }
  };

  // Simple city detection based on coordinates (mock for demo)
  const getCityFromCoords = async (lat: number, lng: number): Promise<string> => {
    // Mock city detection - in production use Google Geocoding API
    const cities = [
      { name: 'Mumbai', lat: 19.076, lng: 72.8777, radius: 0.5 },
      { name: 'Delhi', lat: 28.7041, lng: 77.1025, radius: 0.5 },
      { name: 'Bangalore', lat: 12.9716, lng: 77.5946, radius: 0.5 },
      { name: 'Goa', lat: 15.2993, lng: 74.124, radius: 0.5 },
      { name: 'Jaipur', lat: 26.9124, lng: 75.7873, radius: 0.5 },
    ];

    for (const city of cities) {
      const distance = Math.sqrt(Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2));
      if (distance < city.radius) {
        return city.name;
      }
    }

    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  const handlePlanJourney = async () => {
    if (!source || !destination || !departureDate) {
      alert('Please fill in source, destination, and departure date');
      return;
    }

    // Validate time for urgent mode
    if (mode === 'urgent' && !departureTime) {
      alert('Please specify departure time for urgent mode');
      return;
    }

    setIsPlanning(true);

    // Simulate AI planning delay
    setTimeout(() => {
      onPlanJourney({
        source,
        destination,
        departureDate,
        departureTime: departureTime || undefined,
        returnDate,
        mode,
        guests,
      });
      setIsPlanning(false);
    }, 1500);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1920&auto=format&fit=crop"
          alt="Travel destination"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/20 to-background" />
        <div className="absolute inset-0 bg-gradient-hero" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 text-center pt-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Complete Door-to-Door Journey Planning
            </span>
          </motion.div>

          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4 leading-tight">
            One Search,
            <br />
            <span className="gradient-text">Complete Journey</span>
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            From your doorstep to destination. We handle flights, trains, local transport, hotels,
            and everything in between.
          </p>
        </motion.div>

        {/* Enhanced Journey Planner */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="glass-strong rounded-3xl p-4 md:p-6 shadow-medium max-w-5xl mx-auto"
        >
          {/* Mode Toggle */}
          <div className="flex justify-center gap-3 mb-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode('urgent')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                mode === 'urgent'
                  ? 'bg-red-500 text-white shadow-lg'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}
            >
              <Zap className="w-5 h-5" />
              <span>Urgent Mode</span>
              <span className="text-xs opacity-75">(Fastest)</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode('fun')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                mode === 'fun'
                  ? 'bg-gradient-accent text-primary-foreground shadow-glow'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}
            >
              <Palmtree className="w-5 h-5" />
              <span>Fun Mode</span>
              <span className="text-xs opacity-75">(Scenic & Budget)</span>
            </motion.button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Source Location */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10">
                {isLoadingLocation ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Navigation className="w-5 h-5" />
                )}
              </div>
              <input
                type="text"
                placeholder={
                  isLoadingLocation ? 'Detecting your location...' : 'From: Your location'
                }
                value={source}
                onChange={e => setSource(e.target.value)}
                disabled={isLoadingLocation}
                className="w-full pl-12 pr-24 py-4 bg-secondary/50 rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-50"
              />
              <button
                onClick={handleGetCurrentLocation}
                disabled={isLoadingLocation}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-primary/10 hover:bg-primary/20 rounded-lg text-primary text-xs font-medium transition-all disabled:opacity-50"
              >
                {isLoadingLocation ? '...' : 'Refresh'}
              </button>
            </div>

            {/* Destination */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10">
                <MapPin className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="To: Where do you want to go?"
                value={destination}
                onChange={e => setDestination(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-secondary/50 rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>

            {/* Departure Date */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10">
                <Calendar className="w-5 h-5" />
              </div>
              <input
                type="date"
                placeholder="Departure"
                value={departureDate}
                onChange={e => setDepartureDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full pl-12 pr-4 py-4 bg-secondary/50 rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>

            {/* Return Date */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10">
                <Calendar className="w-5 h-5" />
              </div>
              <input
                type="date"
                placeholder="Return (Optional)"
                value={returnDate}
                onChange={e => setReturnDate(e.target.value)}
                min={departureDate || new Date().toISOString().split('T')[0]}
                className="w-full pl-12 pr-4 py-4 bg-secondary/50 rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>

          {/* Departure Time - Show only in Urgent Mode */}
          <AnimatePresence>
            {mode === 'urgent' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-4"
              >
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10">
                    <Zap className="w-5 h-5" />
                  </div>
                  <input
                    type="time"
                    placeholder="Departure Time"
                    value={departureTime}
                    onChange={e => setDepartureTime(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800 rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-red-600 dark:text-red-400">
                    Required for urgent mode
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"
            style={{ display: 'none' }}
          ></div>

          {/* Guests */}
          <div className="flex items-center justify-between mb-6 px-4">
            <span className="text-sm font-medium text-foreground">Number of Travelers</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setGuests(Math.max(1, guests - 1))}
                className="w-10 h-10 rounded-lg bg-secondary/50 hover:bg-secondary flex items-center justify-center text-foreground font-semibold transition-all"
              >
                −
              </button>
              <span className="w-12 text-center font-semibold text-foreground">{guests}</span>
              <button
                onClick={() => setGuests(Math.min(10, guests + 1))}
                className="w-10 h-10 rounded-lg bg-secondary/50 hover:bg-secondary flex items-center justify-center text-foreground font-semibold transition-all"
              >
                +
              </button>
            </div>
          </div>

          {/* Plan Journey Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePlanJourney}
            disabled={isPlanning}
            className="w-full px-8 py-5 bg-gradient-accent text-primary-foreground rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-glow transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <AnimatePresence mode="wait">
              {isPlanning ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3"
                >
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Planning Your Perfect Journey...</span>
                </motion.div>
              ) : (
                <motion.div
                  key="search"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3"
                >
                  <Search className="w-6 h-6" />
                  <span>Plan My Complete Journey</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Info Text */}
          <p className="text-xs text-muted-foreground mt-4 text-center">
            ✨ AI-powered routing • 🚗 Local transport • ✈️ Flights & trains • 🏨 Hotels • 🛡️ Safety
            monitoring
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-wrap justify-center gap-8 md:gap-16 mt-12"
        >
          {[
            { value: '1-Click', label: 'Complete Booking' },
            { value: '24/7', label: 'Local Guardian' },
            { value: '100%', label: 'Door-to-Door' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1"
        >
          <div className="w-1.5 h-3 bg-muted-foreground/50 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroEnhanced;
