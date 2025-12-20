import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, Users, Search, Navigation2, Loader2, Compass, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface JourneySearchCardProps {
  onExplore: (params: JourneySearchParams) => void;
  initialDestination?: string;
  initialDestinationName?: string;
}

export interface JourneySearchParams {
  source: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  guests: number;
}

const POPULAR_DESTINATIONS = [
  'Mumbai, Maharashtra',
  'Goa, India',
  'Delhi, India',
  'Bangalore, Karnataka',
  'Jaipur, Rajasthan',
  'Udaipur, Rajasthan',
  'Kerala, India',
  'Manali, Himachal Pradesh',
  'Rishikesh, Uttarakhand',
  'Varanasi, Uttar Pradesh',
];

const JourneySearchCard = ({
  onExplore,
  initialDestination,
  initialDestinationName,
}: JourneySearchCardProps) => {
  const navigate = useNavigate();
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [guests, setGuests] = useState(2);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [tripType, setTripType] = useState<'round-trip' | 'one-way'>('round-trip');
  const [showExploreSuggestion, setShowExploreSuggestion] = useState(true);

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showSourceSuggestions, setShowSourceSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sourceSuggestions, setSourceSuggestions] = useState<string[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<string[]>([]);
  const [tempDepartureDate, setTempDepartureDate] = useState<Date | null>(null);
  const [tempReturnDate, setTempReturnDate] = useState<Date | null>(null);
  const [tempTripType, setTempTripType] = useState<'round-trip' | 'one-way'>('round-trip');

  const sourceRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);
  const guestRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const [sourceDropdownPos, setSourceDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [destDropdownPos, setDestDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  // Set initial destination from props
  useEffect(() => {
    if (initialDestination) {
      setDestination(initialDestinationName || initialDestination);
    }
  }, [initialDestination, initialDestinationName]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sourceRef.current && !sourceRef.current.contains(event.target as Node)) {
        setShowSourceSuggestions(false);
        if (focusedField === 'source') setFocusedField(null);
      }
      if (destRef.current && !destRef.current.contains(event.target as Node)) {
        setShowDestSuggestions(false);
        if (focusedField === 'destination') setFocusedField(null);
      }
      if (guestRef.current && !guestRef.current.contains(event.target as Node)) {
        setShowGuestPicker(false);
        if (focusedField === 'guests') setFocusedField(null);
      }
      if (dateRef.current && !dateRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
        if (focusedField === 'dates') setFocusedField(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [focusedField]);

  // Update dropdown positions on scroll/resize
  useEffect(() => {
    const updatePositions = () => {
      if (showSourceSuggestions && sourceRef.current) {
        const rect = sourceRef.current.getBoundingClientRect();
        setSourceDropdownPos({ top: rect.bottom + 8, left: rect.left, width: rect.width });
      }
      if (showDestSuggestions && destRef.current) {
        const rect = destRef.current.getBoundingClientRect();
        setDestDropdownPos({ top: rect.bottom + 8, left: rect.left, width: rect.width });
      }
    };

    window.addEventListener('scroll', updatePositions, true);
    window.addEventListener('resize', updatePositions);
    return () => {
      window.removeEventListener('scroll', updatePositions, true);
      window.removeEventListener('resize', updatePositions);
    };
  }, [showSourceSuggestions, showDestSuggestions]);

  useEffect(() => {
    setTempDepartureDate(departureDate);
    setTempReturnDate(returnDate);
    setTempTripType(tripType);
  }, [departureDate, returnDate, tripType]);

  const handleDetectLocation = async () => {
    setIsLoadingLocation(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async position => {
          const { latitude, longitude } = position.coords;

          try {
            const cityName = await getCityFromCoords(latitude, longitude);
            setSource(cityName);
            setShowSourceSuggestions(false);
          } catch (error) {
            setSource(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
          setIsLoadingLocation(false);
        },
        error => {
          console.error('Error getting location:', error);
          alert('Unable to detect location. Please enter manually.');
          setIsLoadingLocation(false);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
      setIsLoadingLocation(false);
    }
  };

  const getCityFromCoords = async (lat: number, lng: number): Promise<string> => {
    const cities = [
      { name: 'Mumbai, Maharashtra', lat: 19.076, lng: 72.8777, radius: 0.5 },
      { name: 'Delhi, India', lat: 28.7041, lng: 77.1025, radius: 0.5 },
      { name: 'Bangalore, Karnataka', lat: 12.9716, lng: 77.5946, radius: 0.5 },
      { name: 'Goa, India', lat: 15.2993, lng: 74.124, radius: 0.5 },
    ];

    for (const city of cities) {
      const distance = Math.sqrt(Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2));
      if (distance < city.radius) {
        return city.name;
      }
    }

    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  // Debounce timer
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCitySuggestions = async (query: string): Promise<string[]> => {
    if (query.length < 2) return [];

    try {
      // Using Nominatim (OpenStreetMap) - completely free, no API key needed
      // Removed featuretype=city to allow ANY location worldwide (cities, addresses, landmarks, etc.)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(query)}&` +
          `format=json&` +
          `addressdetails=1&` +
          `limit=5`,
        {
          headers: {
            'User-Agent': 'BookOnceApp/1.0', // Required by Nominatim
          },
        }
      );

      if (!response.ok) {
        // Fallback to local suggestions if API fails
        return POPULAR_DESTINATIONS.filter(dest =>
          dest.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);
      }

      const data = await response.json();

      // Format results to show full location details
      const formatted = data
        .map((place: any) => {
          // Build location string from most specific to least specific
          const parts = [];

          // Add specific location (building, attraction, etc.)
          if (
            place.name &&
            place.name !== place.address?.city &&
            place.name !== place.address?.country
          ) {
            parts.push(place.name);
          }

          // Add city/town/village
          if (place.address?.city) parts.push(place.address.city);
          else if (place.address?.town) parts.push(place.address.town);
          else if (place.address?.village) parts.push(place.address.village);

          // Add state/region if available
          if (place.address?.state) parts.push(place.address.state);

          // Always add country
          if (place.address?.country) parts.push(place.address.country);

          // If no parts, use display_name
          if (parts.length === 0) {
            return place.display_name.split(',').slice(0, 3).join(',');
          }

          return parts.join(', ');
        })
        .filter(
          (value: string, index: number, self: string[]) => self.indexOf(value) === index // Remove duplicates
        );

      return formatted.slice(0, 5);
    } catch (error) {
      console.error('Error fetching locations:', error);
      // Fallback to local suggestions
      return POPULAR_DESTINATIONS.filter(dest =>
        dest.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);
    }
  };

  const handleSourceChange = (value: string) => {
    setSource(value);

    if (value.length >= 2) {
      setShowSourceSuggestions(true);
      setShowExploreSuggestion(false);

      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer for debounced API call
      debounceTimerRef.current = setTimeout(async () => {
        const suggestions = await fetchCitySuggestions(value);
        setSourceSuggestions(suggestions);
      }, 300); // 300ms debounce
    } else if (value.length === 0) {
      setSourceSuggestions(POPULAR_DESTINATIONS);
      setShowSourceSuggestions(false);
      setShowExploreSuggestion(true);
    } else {
      setShowSourceSuggestions(false);
      setShowExploreSuggestion(false);
    }
  };

  const handleDestChange = (value: string) => {
    setDestination(value);

    if (value.length >= 2) {
      setShowDestSuggestions(true);

      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer for debounced API call
      debounceTimerRef.current = setTimeout(async () => {
        const suggestions = await fetchCitySuggestions(value);
        setDestSuggestions(suggestions);
      }, 300); // 300ms debounce
    } else if (value.length === 0) {
      setDestSuggestions(POPULAR_DESTINATIONS);
      setShowDestSuggestions(false);
    } else {
      setShowDestSuggestions(false);
    }
  };

  const handleSourceFocus = () => {
    if (source.length === 0) {
      setSourceSuggestions(POPULAR_DESTINATIONS.slice(0, 4));
    }
    setShowSourceSuggestions(true);
    setFocusedField('source');
    if (sourceRef.current) {
      const rect = sourceRef.current.getBoundingClientRect();
      setSourceDropdownPos({ top: rect.bottom + 8, left: rect.left, width: rect.width });
    }
  };

  const handleDestFocus = () => {
    if (destination.length === 0) {
      setDestSuggestions(POPULAR_DESTINATIONS.slice(0, 4));
    }
    setShowDestSuggestions(true);
    setFocusedField('destination');
    if (destRef.current) {
      const rect = destRef.current.getBoundingClientRect();
      setDestDropdownPos({ top: rect.bottom + 8, left: rect.left, width: rect.width });
    }
  };

  const selectSourceSuggestion = (suggestion: string) => {
    setSource(suggestion);
    setShowSourceSuggestions(false);
    setShowExploreSuggestion(false);
    setFocusedField(null);
  };

  const selectDestSuggestion = (suggestion: string) => {
    setDestination(suggestion);
    setShowDestSuggestions(false);
    setFocusedField(null);
  };

  const handleExplore = () => {
    if (!source || !destination || !departureDate) {
      alert('Please fill in source, destination, and departure date');
      return;
    }

    if (tripType === 'round-trip' && !returnDate) {
      alert('Please select a return date for round-trip');
      return;
    }

    setIsSearching(true);

    setTimeout(() => {
      onExplore({
        source,
        destination,
        departureDate: departureDate.toISOString().split('T')[0],
        returnDate: returnDate ? returnDate.toISOString().split('T')[0] : '',
        guests,
      });
      setIsSearching(false);
    }, 1000);
  };

  const formatDateDisplay = () => {
    if (!departureDate) return 'Add dates';
    if (tripType === 'one-way' || !returnDate) return format(departureDate, 'MMM dd');

    const nights = Math.ceil(
      (returnDate.getTime() - departureDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return `${format(departureDate, 'MMM dd')} - ${format(returnDate, 'MMM dd')} (${nights}n)`;
  };

  const handleDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range) return;
    setTempDepartureDate(range.from || null);
    if (tempTripType === 'round-trip') {
      setTempReturnDate(range.to || null);
    }
  };

  const handleApplyDates = () => {
    if (!tempDepartureDate) return;

    if (tempTripType === 'one-way') {
      setDepartureDate(tempDepartureDate);
      setReturnDate(null);
      setTripType('one-way');
      setShowDatePicker(false);
      setFocusedField(null);
    } else if (tempDepartureDate && tempReturnDate) {
      setDepartureDate(tempDepartureDate);
      setReturnDate(tempReturnDate);
      setTripType('round-trip');
      setShowDatePicker(false);
      setFocusedField(null);
    }
  };

  const handleClearDates = () => {
    setTempDepartureDate(null);
    setTempReturnDate(null);
    setDepartureDate(null);
    setReturnDate(null);
  };

  const today = startOfDay(new Date());

  const isDateDisabled = (date: Date): boolean => {
    if (isBefore(date, today)) {
      return true;
    }
    return false;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-6xl mx-auto relative z-50"
    >
      {/* Compact Horizontal Search Bar */}
      <div className="bg-white rounded-full shadow-2xl p-2 flex items-center gap-2 relative">
        {/* Source */}
        <div ref={sourceRef} className="relative flex-1 overflow-visible">
          {/* Cute Explore Suggestion Tooltip */}
          <AnimatePresence>
            {showExploreSuggestion && source.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ duration: 0.3, type: 'spring', bounce: 0.3 }}
                className="absolute -top-16 left-0 z-50"
              >
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-2xl shadow-xl relative">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Compass className="w-4 h-4" />
                    <span>Don't know where to go?</span>
                    <Button
                      onClick={() => {
                        navigate('/stays');
                        setShowExploreSuggestion(false);
                      }}
                      size="sm"
                      variant="secondary"
                      className="h-6 px-2 text-xs bg-white/20 hover:bg-white/30 text-white border-white/30"
                    >
                      Explore Places
                    </Button>
                    <button
                      onClick={() => setShowExploreSuggestion(false)}
                      className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  {/* Arrow pointing down */}
                  <div className="absolute -bottom-1 left-8 w-2 h-2 bg-gradient-to-br from-purple-500 to-pink-500 rotate-45"></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            animate={{
              scale: focusedField === 'source' ? 1.02 : 1,
            }}
            className={`flex items-center gap-3 px-6 py-4 rounded-full cursor-pointer transition-all ${
              focusedField === 'source' ? 'bg-gray-50 shadow-md' : 'hover:bg-gray-50'
            }`}
            onClick={() => {
              setFocusedField('source');
              handleSourceFocus();
            }}
          >
            <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gray-500 mb-0.5">From</div>
              <input
                type="text"
                placeholder="Source"
                value={source}
                onChange={e => handleSourceChange(e.target.value)}
                onFocus={handleSourceFocus}
                className="w-full bg-transparent border-none outline-none text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:ring-0"
                style={{ boxShadow: 'none' }}
              />
            </div>
          </motion.div>

          <AnimatePresence>
            {showSourceSuggestions && sourceSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="fixed bg-white rounded-xl shadow-xl border border-gray-200 overflow-y-auto overflow-x-hidden max-h-96 z-[9999]"
                style={{ 
                  top: `${sourceDropdownPos.top}px`, 
                  left: `${sourceDropdownPos.left}px`, 
                  width: `${sourceDropdownPos.width}px`,
                  zIndex: 9999 
                }}
              >
                <button
                  onClick={handleDetectLocation}
                  disabled={isLoadingLocation}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-blue-50 transition-colors border-b border-gray-100 text-left"
                >
                  {isLoadingLocation ? (
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  ) : (
                    <Navigation2 className="w-5 h-5 text-blue-600" />
                  )}
                  <div>
                    <div className="font-semibold text-blue-600 text-sm">
                      {isLoadingLocation ? 'Detecting...' : 'Detect my location'}
                    </div>
                    <div className="text-xs text-gray-500">Use current GPS location</div>
                  </div>
                </button>

                {sourceSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => selectSourceSuggestion(suggestion)}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{suggestion}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-px h-12 bg-gray-200" />

        {/* Destination */}
        <div ref={destRef} className="relative flex-1 overflow-visible">
          <motion.div
            animate={{
              scale: focusedField === 'destination' ? 1.02 : 1,
            }}
            className={`flex items-center gap-3 px-6 py-4 rounded-full cursor-pointer transition-all ${
              focusedField === 'destination' ? 'bg-gray-50 shadow-md' : 'hover:bg-gray-50'
            }`}
            onClick={() => {
              setFocusedField('destination');
              handleDestFocus();
            }}
          >
            <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gray-500 mb-0.5">To</div>
              <input
                type="text"
                placeholder="Destination"
                value={destination}
                onChange={e => handleDestChange(e.target.value)}
                onFocus={handleDestFocus}
                className="w-full bg-transparent border-none outline-none text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:ring-0"
                style={{ boxShadow: 'none' }}
              />
            </div>
          </motion.div>

          <AnimatePresence>
            {showDestSuggestions && destSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="fixed bg-white rounded-xl shadow-xl border border-gray-200 overflow-y-auto overflow-x-hidden max-h-96 z-[9999]"
                style={{ 
                  top: `${destDropdownPos.top}px`, 
                  left: `${destDropdownPos.left}px`, 
                  width: `${destDropdownPos.width}px`,
                  zIndex: 9999 
                }}
              >
                {destSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => selectDestSuggestion(suggestion)}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{suggestion}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-px h-12 bg-gray-200" />

        {/* Date Range Picker */}
        <div ref={dateRef} className="relative">
          <motion.div
            animate={{
              scale: focusedField === 'dates' ? 1.02 : 1,
            }}
            className={`flex items-center gap-3 px-6 py-4 rounded-full cursor-pointer transition-all ${
              focusedField === 'dates' ? 'bg-gray-50 shadow-md' : 'hover:bg-gray-50'
            }`}
            onClick={() => {
              setShowDatePicker(!showDatePicker);
              setFocusedField('dates');
            }}
          >
            <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-500 mb-0.5">Dates</div>
              <div className="text-sm font-medium text-gray-900">{formatDateDisplay()}</div>
            </div>
          </motion.div>

          <AnimatePresence>
            {showDatePicker && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="fixed left-1/2 -translate-x-1/2 top-24 bg-white rounded-xl shadow-2xl border border-gray-100 p-3 max-h-[calc(100vh-7rem)] overflow-y-auto"
                style={{ zIndex: 9999 }}
              >
                <div className="space-y-3">
                  <div className="space-y-1">
                    <h4 className="font-medium text-xs">Select your travel dates</h4>
                    <p className="text-[10px] text-gray-500">
                      {tempTripType === 'one-way' &&
                        !tempDepartureDate &&
                        'Choose your departure date'}
                      {tempTripType === 'round-trip' &&
                        !tempDepartureDate &&
                        'Choose your departure date'}
                      {tempTripType === 'round-trip' &&
                        tempDepartureDate &&
                        !tempReturnDate &&
                        'Choose your return date'}
                      {tempTripType === 'round-trip' &&
                        tempDepartureDate &&
                        tempReturnDate &&
                        `${Math.ceil((tempReturnDate.getTime() - tempDepartureDate.getTime()) / (1000 * 60 * 60 * 24))} days selected`}
                      {tempTripType === 'one-way' && tempDepartureDate && 'One-way trip selected'}
                    </p>
                  </div>

                  {/* Trip Type Selector */}
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                    <button
                      onClick={() => {
                        setTempTripType('round-trip');
                        if (tempDepartureDate && !tempReturnDate) {
                          setTempReturnDate(addDays(tempDepartureDate, 3));
                        }
                      }}
                      className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                        tempTripType === 'round-trip'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Round-trip
                    </button>
                    <button
                      onClick={() => {
                        setTempTripType('one-way');
                        setTempReturnDate(null);
                      }}
                      className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                        tempTripType === 'one-way'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      One-way
                    </button>
                  </div>

                  {tempTripType === 'one-way' ? (
                    <CalendarComponent
                      mode="single"
                      selected={tempDepartureDate || undefined}
                      onSelect={date => setTempDepartureDate(date || null)}
                      disabled={isDateDisabled}
                      initialFocus
                      numberOfMonths={1}
                      className="rounded-md border scale-90 origin-top"
                    />
                  ) : (
                    <CalendarComponent
                      mode="range"
                      selected={{
                        from: tempDepartureDate || undefined,
                        to: tempReturnDate || undefined,
                      }}
                      onSelect={handleDateSelect}
                      disabled={isDateDisabled}
                      initialFocus
                      numberOfMonths={1}
                      className="rounded-md border scale-90 origin-top"
                    />
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={() => {
                        setTempDepartureDate(departureDate);
                        setTempReturnDate(returnDate);
                        setTempTripType(tripType);
                        setShowDatePicker(false);
                        setFocusedField(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={handleApplyDates}
                      disabled={
                        !tempDepartureDate || (tempTripType === 'round-trip' && !tempReturnDate)
                      }
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-px h-12 bg-gray-200" />

        {/* Guests */}
        <div ref={guestRef} className="relative">
          <motion.div
            animate={{
              scale: focusedField === 'guests' ? 1.02 : 1,
            }}
            className={`flex items-center gap-3 px-6 py-4 rounded-full cursor-pointer transition-all ${
              focusedField === 'guests' ? 'bg-gray-50 shadow-md' : 'hover:bg-gray-50'
            }`}
            onClick={() => {
              setShowGuestPicker(!showGuestPicker);
              setFocusedField('guests');
            }}
          >
            <Users className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-0.5">Guests</div>
              <div className="text-sm font-medium text-gray-900">{guests}</div>
            </div>
          </motion.div>

          <AnimatePresence>
            {showGuestPicker && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-64"
                style={{ zIndex: 9999 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Travelers</span>
                  <div className="flex items-center gap-3">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setGuests(Math.max(1, guests - 1))}
                      className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-blue-500 flex items-center justify-center text-gray-700 font-bold transition-all"
                    >
                      −
                    </motion.button>
                    <span className="w-8 text-center font-semibold text-gray-900">{guests}</span>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setGuests(Math.min(20, guests + 1))}
                      className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-blue-500 flex items-center justify-center text-gray-700 font-bold transition-all"
                    >
                      +
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleExplore}
          disabled={isSearching}
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSearching ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
          <span className="whitespace-nowrap">Explore</span>
        </motion.button>
      </div>

    </motion.div>
  );
};

export default JourneySearchCard;
