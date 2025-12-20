import { motion } from 'framer-motion';
import { Globe, Clock, Search } from 'lucide-react';
import { useState, useEffect } from 'react';

interface TimezoneData {
  country: string;
  city: string;
  timezone: string;
  time: string;
  offset: string;
}

// Major cities with their timezones
const CITIES = [
  { country: 'United States', city: 'New York', timezone: 'America/New_York' },
  { country: 'United States', city: 'Los Angeles', timezone: 'America/Los_Angeles' },
  { country: 'United States', city: 'Chicago', timezone: 'America/Chicago' },
  { country: 'United Kingdom', city: 'London', timezone: 'Europe/London' },
  { country: 'France', city: 'Paris', timezone: 'Europe/Paris' },
  { country: 'Germany', city: 'Berlin', timezone: 'Europe/Berlin' },
  { country: 'Japan', city: 'Tokyo', timezone: 'Asia/Tokyo' },
  { country: 'China', city: 'Shanghai', timezone: 'Asia/Shanghai' },
  { country: 'China', city: 'Hong Kong', timezone: 'Asia/Hong_Kong' },
  { country: 'Singapore', city: 'Singapore', timezone: 'Asia/Singapore' },
  { country: 'India', city: 'Mumbai', timezone: 'Asia/Kolkata' },
  { country: 'India', city: 'Delhi', timezone: 'Asia/Kolkata' },
  { country: 'Australia', city: 'Sydney', timezone: 'Australia/Sydney' },
  { country: 'Australia', city: 'Melbourne', timezone: 'Australia/Melbourne' },
  { country: 'Canada', city: 'Toronto', timezone: 'America/Toronto' },
  { country: 'Canada', city: 'Vancouver', timezone: 'America/Vancouver' },
  { country: 'Brazil', city: 'São Paulo', timezone: 'America/Sao_Paulo' },
  { country: 'Mexico', city: 'Mexico City', timezone: 'America/Mexico_City' },
  { country: 'Russia', city: 'Moscow', timezone: 'Europe/Moscow' },
  { country: 'South Korea', city: 'Seoul', timezone: 'Asia/Seoul' },
  { country: 'UAE', city: 'Dubai', timezone: 'Asia/Dubai' },
  { country: 'Thailand', city: 'Bangkok', timezone: 'Asia/Bangkok' },
  { country: 'Indonesia', city: 'Jakarta', timezone: 'Asia/Jakarta' },
  { country: 'Turkey', city: 'Istanbul', timezone: 'Europe/Istanbul' },
  { country: 'South Africa', city: 'Johannesburg', timezone: 'Africa/Johannesburg' },
];

const TimeZoneConverter = () => {
  const [selectedCities, setSelectedCities] = useState<string[]>([
    'America/New_York',
    'Europe/London',
    'Asia/Tokyo',
  ]);
  const [times, setTimes] = useState<TimezoneData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const getTimeInTimezone = (timezone: string): TimezoneData => {
    const now = new Date();
    const city = CITIES.find(c => c.timezone === timezone);

    const timeString = now.toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const offset =
      now
        .toLocaleTimeString('en-US', {
          timeZone: timezone,
          timeZoneName: 'short',
        })
        .split(' ')
        .pop() || '';

    return {
      country: city?.country || '',
      city: city?.city || '',
      timezone,
      time: timeString,
      offset,
    };
  };

  useEffect(() => {
    const updateTimes = () => {
      const newTimes = selectedCities.map(tz => getTimeInTimezone(tz));
      setTimes(newTimes);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, [selectedCities]);

  const filteredCities = CITIES.filter(
    city =>
      (city.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        city.country.toLowerCase().includes(searchQuery.toLowerCase())) &&
      !selectedCities.includes(city.timezone)
  ).slice(0, 5);

  const addCity = (timezone: string) => {
    if (selectedCities.length < 5 && !selectedCities.includes(timezone)) {
      setSelectedCities([...selectedCities, timezone]);
    }
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const removeCity = (timezone: string) => {
    setSelectedCities(selectedCities.filter(tz => tz !== timezone));
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Globe className="w-5 h-5 text-primary" />
        <h4 className="font-serif font-semibold text-foreground">Time Zone Converter</h4>
      </div>
      <p className="text-sm text-muted-foreground">
        Track time across different cities and time zones in real-time.
      </p>

      {/* Search Box */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search cities..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && searchQuery && filteredCities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full mt-1 w-full bg-card rounded-xl shadow-xl border border-border overflow-hidden z-50"
          >
            {filteredCities.map(city => (
              <button
                key={city.timezone}
                onClick={() => addCity(city.timezone)}
                className="w-full px-4 py-3 text-left hover:bg-secondary transition-colors flex items-center gap-3"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-foreground">{city.city}</div>
                  <div className="text-xs text-muted-foreground truncate">{city.country}</div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Selected Cities */}
      <div className="space-y-2">
        {times.map((data, index) => (
          <motion.div
            key={data.timezone}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-center justify-between p-3 rounded-xl ${
              index === 0 ? 'bg-primary/10' : 'bg-secondary/30'
            }`}
          >
            <div className="flex-1">
              <div className="font-medium text-sm text-foreground">{data.city}</div>
              <div className="text-xs text-muted-foreground">{data.offset}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{data.time}</span>
              {selectedCities.length > 1 && (
                <button
                  onClick={() => removeCity(data.timezone)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {selectedCities.length < 5 && (
        <p className="text-xs text-muted-foreground text-center">
          Add up to {5 - selectedCities.length} more{' '}
          {selectedCities.length === 4 ? 'city' : 'cities'}
        </p>
      )}
    </div>
  );
};

export default TimeZoneConverter;
