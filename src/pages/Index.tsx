import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { motion } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import JourneySearchCard, { JourneySearchParams } from '@/components/JourneySearchCard';
import MapView from '@/components/MapView';
import SquaresBackground from '@/components/SquaresBackground';
import TextType from '@/components/TextType';
import EchoModal from '@/components/EchoModal';
import LocalShadowWidget from '@/components/LocalShadowWidget';
import SafetyMesh from '@/components/SafetyMesh';
import VanishingDestinations from '@/components/VanishingDestinations';
import { ContextLayerPanel } from '@/components/ContextLayer';

import echoesData from '@/data/echoes.json';
// Hyperspeed background removed to disable landing animations/background image

const Index = () => {
  const [searchParams] = useSearchParams();

  // State
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isNearby, setIsNearby] = useState(true);
  const [isContextOpen, setIsContextOpen] = useState(false);

  // Echo Modal State
  const [selectedEcho, setSelectedEcho] = useState<(typeof echoesData)[0] | null>(null);
  const [isEchoModalOpen, setIsEchoModalOpen] = useState(false);

  // Get destination from URL params (from Stays page)
  const initialDestination = searchParams.get('to');
  const initialDestinationName = searchParams.get('destination');

  // High contrast mode when offline
  useEffect(() => {
    if (isOffline) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [isOffline]);

  // Theme for adaptive light/dark styles
  const { resolvedTheme } = useTheme();

  const handleEchoClick = (echo: (typeof echoesData)[0]) => {
    setSelectedEcho(echo);
    setIsEchoModalOpen(true);
  };

  const navigate = useNavigate();

  const handleJourneyExplore = (params: JourneySearchParams) => {
    console.log('Journey search params:', params);
    // Navigate to journey planner with search parameters
    const searchParams = new URLSearchParams({
      from: params.source,
      to: params.destination,
      departure: params.departureDate,
      return: params.returnDate,
      guests: params.guests.toString(),
    });
    navigate(`/journey?${searchParams.toString()}`);
  };

  return (
    <div
      className={`min-h-screen bg-background transition-colors duration-500 ${isOffline ? 'high-contrast' : ''}`}
    >
      {/* Navigation */}
      <Navbar
        onSafetyClick={() => setIsSafetyOpen(true)}
        isOffline={isOffline}
        onMapClick={() => setIsMapOpen(true)}
      />

      {/* Hero Section with Journey Search */}
      <section className="relative min-h-screen flex items-center justify-center overflow-x-hidden overflow-y-visible">
        {/* Background and animations removed — show plain page background */}
        {/* Squares background animation (subtle, theme-friendly) */}
        <div className="absolute inset-0">
          <SquaresBackground />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-24 overflow-visible">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className={`inline-flex items-center justify-center px-4 py-2 rounded-md mb-6 ${resolvedTheme === 'light'
                  ? 'bg-[#f5f7fa] text-[#5b6e7a] border border-[#e1e8ed]'
                  : 'bg-white/10 text-white'
                }`}
            >
              <span className={`text-sm font-medium ${resolvedTheme === 'light' ? 'text-[#5b6e7a]' : 'text-white'}`}>
                Complete door-to-door journey planning • One Click • Zero Hassle
              </span>
            </motion.div>

            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4 leading-tight">
              <TextType
                texts={['Plan']}
                typingSpeed={60}
                deletingSpeed={30}
                pause={1000}
                loop={false}
                className="text-foreground"
              />
              <br />
              <TextType
                texts={['Your Escape']}
                typingSpeed={80}
                deletingSpeed={30}
                pause={1800}
                loop={false}
                className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
              />
            </h1>

            <p
              className={`text-base md:text-lg ${resolvedTheme === 'light' ? 'text-[#5b6e7a]' : 'text-muted-foreground'
                } max-w-2xl mx-auto mb-8`}
            >
              Plan unforgettable trips with personalised recommendations and seamless booking.
            </p>
          </motion.div>

          {/* Journey Search Card */}
          <JourneySearchCard
            onExplore={handleJourneyExplore}
            initialDestination={initialDestination || undefined}
            initialDestinationName={initialDestinationName || undefined}
          />

          {/* Stats removed per request */}
        </div>
      </section>

      {/* Main Content */}
      <main className="relative">
        {/* Vanishing Destinations - Last Mile of Civilization */}
        <VanishingDestinations />

        {/* Footer */}
        <footer className="py-12 px-4 md:px-8 border-t border-border">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-accent flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">BO</span>
              </div>
              <span className="font-serif text-xl font-semibold text-foreground">BookOnce</span>
            </div>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
              Book your perfect journey in one place. Complete travel booking platform for modern
              travelers.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                About
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
            <p className="text-xs text-muted-foreground mt-8">
              © 2024 BookOnce. Built for hackathon demonstration.
            </p>
          </div>
        </footer>
      </main>

      {/* Local Shadow Widget (Floating) */}
      <LocalShadowWidget />

      {/* Context Layer Panel */}
      <ContextLayerPanel isOpen={isContextOpen} onClose={() => setIsContextOpen(false)} />

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

export default Index;
