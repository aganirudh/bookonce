import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import JourneySearchCard, { JourneySearchParams } from "@/components/JourneySearchCard";
import HotelGrid from "@/components/HotelGrid";
import VibeSidebar from "@/components/VibeSidebar";
import MapView from "@/components/MapView";
import EchoModal from "@/components/EchoModal";
import LocalShadowWidget from "@/components/LocalShadowWidget";
import SafetyMesh from "@/components/SafetyMesh";
import FloatingControls from "@/components/FloatingControls";
import VanishingDestinations from "@/components/VanishingDestinations";
import { ContextLayerPanel } from "@/components/ContextLayer";

import hotelsData from "@/data/hotels.json";
import echoesData from "@/data/echoes.json";

const Index = () => {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [isVibeOpen, setIsVibeOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isNearby, setIsNearby] = useState(true);
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [instantBookingOnly, setInstantBookingOnly] = useState(false);
  
  // Echo Modal State
  const [selectedEcho, setSelectedEcho] = useState<typeof echoesData[0] | null>(null);
  const [isEchoModalOpen, setIsEchoModalOpen] = useState(false);

  // Vibe Sliders
  const [energy, setEnergy] = useState(5);
  const [social, setSocial] = useState(5);
  const [budget, setBudget] = useState(5);

  // High contrast mode when offline
  useEffect(() => {
    if (isOffline) {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
  }, [isOffline]);

  // Filter hotels based on vibe sliders
  const filteredHotels = useMemo(() => {
    type HotelType = typeof hotelsData[0];
    let hotels: HotelType[] = [...hotelsData];

    // Filter by search query
    if (searchQuery) {
      hotels = hotels.filter(
        (hotel) =>
          hotel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          hotel.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          hotel.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by instant booking
    if (instantBookingOnly) {
      hotels = hotels.filter((hotel) => hotel.instantBooking === true);
    }

    // Score and sort by vibe match
    const scoredHotels = hotels
      .map((hotel) => {
        const energyDiff = Math.abs(hotel.energy - energy);
        const socialDiff = Math.abs(hotel.social - social);
        const budgetDiff = Math.abs(hotel.budget - budget);
        const score = energyDiff + socialDiff + budgetDiff;
        return { ...hotel, vibeScore: score };
      })
      .sort((a, b) => a.vibeScore - b.vibeScore);

    // Filter out hotels that are too far from vibe preferences
    const threshold = 12; // Allows some flexibility
    const filtered = scoredHotels.filter((hotel) => hotel.vibeScore <= threshold);

    return filtered;
  }, [searchQuery, energy, social, budget, instantBookingOnly]);

  const handleEchoClick = (echo: typeof echoesData[0]) => {
    setSelectedEcho(echo);
    setIsEchoModalOpen(true);
  };

  const handleJourneyExplore = (params: JourneySearchParams) => {
    console.log("Journey search params:", params);
    // TODO: Implement door-to-door journey planning
    alert(`Planning journey from ${params.source} to ${params.destination}`);
  };

  return (
    <div className={`min-h-screen bg-background transition-colors duration-500 ${isOffline ? "high-contrast" : ""}`}>
      {/* Navigation */}
      <Navbar 
        onSafetyClick={() => setIsSafetyOpen(true)} 
        isOffline={isOffline}
        onContextClick={() => setIsContextOpen(!isContextOpen)}
        onMapClick={() => setIsMapOpen(true)}
      />

      {/* Hero Section with Journey Search */}
      <section className="relative min-h-screen flex items-center justify-center overflow-x-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920&q=80')",
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-24">
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-6"
            >
              <span className="text-sm font-medium text-white">✨ AI-Powered Travel</span>
            </motion.div>

            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight">
              Travel That
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Adapts to You
              </span>
            </h1>

            <p className="text-base md:text-lg text-white/80 max-w-2xl mx-auto mb-8">
              The world's first bio-adaptive travel platform. Your journey evolves with your mood, energy, and desires.
            </p>
          </motion.div>

          {/* Journey Search Card */}
          <JourneySearchCard onExplore={handleJourneyExplore} />

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap justify-center gap-8 md:gap-16 mt-12"
          >
            {[
              { value: "50K+", label: "Destinations" },
              { value: "2M+", label: "Happy Travelers" },
              { value: "4.9", label: "App Rating" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-white/70">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main className="relative">
        {/* Floating Controls */}
        <FloatingControls
          onVibeClick={() => setIsVibeOpen(!isVibeOpen)}
          isVibeOpen={isVibeOpen}
          instantBookingOnly={instantBookingOnly}
          onInstantBookingToggle={() => setInstantBookingOnly(!instantBookingOnly)}
        />

        {/* Vibe Sidebar */}
        <VibeSidebar
          isOpen={isVibeOpen}
          onClose={() => setIsVibeOpen(false)}
          energy={energy}
          social={social}
          budget={budget}
          onEnergyChange={(val) => setEnergy(val[0])}
          onSocialChange={(val) => setSocial(val[0])}
          onBudgetChange={(val) => setBudget(val[0])}
        />

        {/* Hotel Grid */}
        <div className={`transition-all duration-300 ${isVibeOpen ? "lg:ml-96" : ""} ${isContextOpen ? "lg:mr-96" : ""}`}>
          <HotelGrid hotels={filteredHotels} searchQuery={searchQuery} />
        </div>

        {/* Vanishing Destinations - Last Mile of Civilization */}
        <VanishingDestinations />

        {/* Footer */}
        <footer className="py-12 px-4 md:px-8 border-t border-border">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-accent flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">V</span>
              </div>
              <span className="font-serif text-xl font-semibold text-foreground">Vagabond</span>
            </div>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
              The world's first bio-adaptive travel platform. Your journey evolves with you.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">About</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
            <p className="text-xs text-muted-foreground mt-8">
              © 2024 Vagabond. Built for hackathon demonstration.
            </p>
          </div>
        </footer>
      </main>

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

export default Index;
