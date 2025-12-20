import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import UtilityWidgets from '@/components/UtilityWidgets';
import TimeZoneConverter from '@/components/TimeZoneConverter';
import { useState, useEffect } from 'react';
import { Compass, MapPin, Wifi, Loader2 } from 'lucide-react';

interface Country {
  name: { common: string };
  capital?: string[];
  flags: { svg: string };
  cca2: string;
  latlng: number[];
}

const TravelUtilities = () => {
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch countries from REST Countries API
  useEffect(() => {
    const fetchCountries = async () => {
      setIsLoadingCountries(true);
      try {
        const response = await fetch(
          'https://restcountries.com/v3.1/all?fields=name,capital,flags,cca2,latlng'
        );
        const data = await response.json();
        const sorted = data.sort((a: Country, b: Country) =>
          a.name.common.localeCompare(b.name.common)
        );
        setCountries(sorted);
      } catch (error) {
        console.error('Failed to fetch countries:', error);
      }
      setIsLoadingCountries(false);
    };
    fetchCountries();
  }, []);

  const filteredCountries = countries.filter(
    country =>
      country.name.common.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (country.capital && country.capital[0]?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSimulateLocation = () => {
    if (selectedCountry) {
      alert(
        `Simulating location: ${selectedCountry.capital?.[0] || selectedCountry.name.common}, ${selectedCountry.name.common}\nCoordinates: ${selectedCountry.latlng[0]}, ${selectedCountry.latlng[1]}`
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navbar onSafetyClick={() => setIsSafetyOpen(!isSafetyOpen)} isOffline={isOffline} />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-accent mb-6"
            >
              <Compass className="w-10 h-10 text-white" />
            </motion.div>

            <h1 className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-6">
              Travel Utilities
            </h1>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
              Essential tools for the modern traveler, right at your fingertips.
            </p>
          </motion.div>

          {/* Main Utilities Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Location Simulator */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6 space-y-4"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <h4 className="font-serif font-semibold text-foreground">Location Simulator</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Test how your app behaves in different locations around the world.
              </p>
              <div className="space-y-3">
                {isLoadingCountries ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search countries or cities..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onFocus={() => setSearchQuery('')}
                        className="w-full px-3 py-2 rounded-xl bg-secondary/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      {searchQuery && filteredCountries.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute bottom-full mb-1 w-full bg-card rounded-xl shadow-xl border border-border overflow-hidden z-50 max-h-60 overflow-y-auto"
                        >
                          {filteredCountries.slice(0, 10).map(country => (
                            <button
                              key={country.cca2}
                              onClick={() => {
                                setSelectedCountry(country);
                                setSearchQuery(
                                  country.capital?.[0]
                                    ? `${country.capital[0]}, ${country.name.common}`
                                    : country.name.common
                                );
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-secondary transition-colors flex items-center gap-2 text-card-foreground"
                            >
                              <img
                                src={country.flags.svg}
                                alt={country.name.common}
                                className="w-6 h-4 object-cover rounded"
                              />
                              <div>
                                <div className="text-sm font-medium text-foreground">
                                  {country.capital?.[0] || country.name.common}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {country.name.common}
                                </div>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </div>
                    {selectedCountry && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="flex items-center gap-2 p-3 rounded-xl bg-primary/10"
                      >
                        <img
                          src={selectedCountry.flags.svg}
                          alt={selectedCountry.name.common}
                          className="w-8 h-6 object-cover rounded"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-foreground">
                            {selectedCountry.capital?.[0] || selectedCountry.name.common}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {selectedCountry.name.common} • {selectedCountry.latlng[0].toFixed(2)},{' '}
                            {selectedCountry.latlng[1].toFixed(2)}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSimulateLocation}
                  disabled={!selectedCountry}
                  className="w-full px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Simulate Location
                </motion.button>
              </div>
            </motion.div>

            {/* Currency Converter & AI Packer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-1"
            >
              <UtilityWidgets />
            </motion.div>

            {/* Time Zone Converter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <TimeZoneConverter />
            </motion.div>

            {/* Offline Mode Tester */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-6 space-y-4"
            >
              <div className="flex items-center gap-2">
                <Wifi className="w-5 h-5 text-primary" />
                <h4 className="font-serif font-semibold text-foreground">Offline Mode</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Test your app's offline capabilities and see how it handles no connectivity.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOffline(!isOffline)}
                className={`w-full px-4 py-2 rounded-xl font-medium transition-colors ${
                  isOffline
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`}
              >
                {isOffline ? 'Go Online' : 'Go Offline'}
              </motion.button>
              {isOffline && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-3 rounded-xl bg-destructive/10 border border-destructive/20"
                >
                  <p className="text-xs text-destructive font-medium">
                    ⚠️ Offline mode active. Some features may be limited.
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* Travel Checklist */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card p-6 space-y-4 lg:col-span-2"
            >
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-primary" />
                <h4 className="font-serif font-semibold text-foreground">Pre-Travel Checklist</h4>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  'Check passport validity (6+ months)',
                  'Apply for visa if required',
                  'Get travel insurance',
                  'Notify bank of travel plans',
                  'Download offline maps',
                  'Pack essential medications',
                  'Make copies of important documents',
                  'Check weather forecast',
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 text-sm text-foreground"
                  >
                    <div className="w-4 h-4 rounded border-2 border-primary/30" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Additional Resources */}
      <section className="py-16 px-4 md:px-8 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              More Coming Soon
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We're constantly adding new utilities to make your travel experience smoother.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: '🌍',
                title: 'Language Translator',
                desc: 'Real-time translation for 100+ languages',
              },
              {
                icon: '💰',
                title: 'Budget Tracker',
                desc: 'Track expenses across multiple currencies',
              },
              { icon: '📱', title: 'SIM Card Finder', desc: 'Find the best local SIM cards' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6 text-center space-y-3"
              >
                <div className="text-4xl">{item.icon}</div>
                <h3 className="font-serif font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default TravelUtilities;
