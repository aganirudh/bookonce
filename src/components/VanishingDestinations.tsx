import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, AlertTriangle, Camera, Heart, MapPin, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import vanishingData from '@/data/vanishing-destinations.json';

const threatColors: Record<string, string> = {
  critical: 'bg-destructive',
  high: 'bg-warning',
  moderate: 'bg-warning/80',
};

const threatBgColors: Record<string, string> = {
  critical: 'bg-destructive/10 border-destructive/30',
  high: 'bg-warning/10 border-warning/30',
  moderate: 'bg-warning/10 border-warning/30',
};

interface Destination {
  id: number;
  name: string;
  location: string;
  image: string;
  yearsRemaining: number;
  threatLevel: string;
  threats: string[];
  culture: string;
  witnesses: number;
  lastWitness: string;
  story: string;
  coordinates: number[];
}

const VanishingDestinations = () => {
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const filteredDestinations =
    filter === 'all' ? vanishingData : vanishingData.filter(d => d.threatLevel === filter);

  return (
    <section id="lastmile" className="py-20 px-4 md:px-8 bg-foreground/[0.02]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/20 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
            </span>
            <span className="text-sm font-medium text-destructive">
              The Last Mile of Civilization
            </span>
          </div>

          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            Witness Before It Vanishes
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto mb-8">
            These places, cultures, and ecosystems will disappear within our lifetime. Don't just
            visit — become a <strong>final witness</strong>, a <strong>cultural preserver</strong>,
            and a <strong>voice for the voiceless</strong>.
          </p>

          {/* Filter Pills */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {[
              { value: 'all', label: 'All Destinations' },
              { value: 'critical', label: 'Critical (<10 yrs)', color: 'red' },
              { value: 'high', label: 'High Risk', color: 'orange' },
              { value: 'moderate', label: 'Moderate', color: 'amber' },
            ].map(item => (
              <motion.button
                key={item.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(item.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === item.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Destinations Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredDestinations.map((destination, index) => (
              <motion.div
                key={destination.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ y: -8 }}
                onClick={() => setSelectedDestination(destination)}
                className="group cursor-pointer bg-card rounded-3xl overflow-hidden shadow-card hover:shadow-medium transition-all duration-300 border border-border"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <motion.img
                    src={destination.image}
                    alt={destination.name}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Countdown Badge */}
                  <div
                    className={`absolute top-4 right-4 px-3 py-1.5 rounded-xl border ${threatBgColors[destination.threatLevel]}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-foreground" />
                      <span className="text-sm font-bold text-foreground">
                        {destination.yearsRemaining} years left
                      </span>
                    </div>
                  </div>

                  {/* Threat Level */}
                  <div className="absolute top-4 left-4">
                    <div
                      className={`w-3 h-3 rounded-full ${threatColors[destination.threatLevel]} animate-pulse`}
                    />
                  </div>

                  {/* Title Overlay */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="font-serif text-xl font-bold text-white mb-1">
                      {destination.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-white/80">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-sm">{destination.location}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  {/* Threats */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {destination.threats.slice(0, 2).map(threat => (
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
                    {destination.culture}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span className="text-sm font-medium">{destination.witnesses}</span>
                        <span className="text-xs">witnesses</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-primary">
                      <span className="text-sm font-medium">Document</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="glass-card p-8 md:p-12 max-w-3xl mx-auto">
            <h3 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-4">
              Become a Final Witness
            </h3>
            <p className="text-muted-foreground mb-6">
              Your visit isn't just tourism — it's preservation. Document what you see, support
              local economies, and carry their stories forward.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-accent text-primary-foreground rounded-xl font-medium shadow-glow"
              >
                <Camera className="w-5 h-5" />
                Start Documenting
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-6 py-3 bg-secondary text-foreground rounded-xl font-medium"
              >
                <Heart className="w-5 h-5" />
                Pledge to Preserve
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedDestination && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedDestination(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-card rounded-3xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-heavy"
            >
              {/* Hero Image */}
              <div className="relative h-64">
                <img
                  src={selectedDestination.image}
                  alt={selectedDestination.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                <div className="absolute bottom-6 left-6 right-6">
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${threatBgColors[selectedDestination.threatLevel]} mb-3`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-bold">
                      {selectedDestination.yearsRemaining} years until disappearance
                    </span>
                  </div>
                  <h2 className="font-serif text-3xl font-bold text-white">
                    {selectedDestination.name}
                  </h2>
                  <p className="text-white/80 flex items-center gap-1.5 mt-1">
                    <MapPin className="w-4 h-4" />
                    {selectedDestination.location}
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Story */}
                <div>
                  <h4 className="font-semibold text-foreground mb-2">The Story</h4>
                  <p className="text-muted-foreground">{selectedDestination.story}</p>
                </div>

                {/* Culture */}
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Cultural Heritage</h4>
                  <p className="text-muted-foreground">{selectedDestination.culture}</p>
                </div>

                {/* Threats */}
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Primary Threats</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDestination.threats.map(threat => (
                      <span
                        key={threat}
                        className="px-3 py-1.5 text-sm bg-destructive/10 text-destructive rounded-xl"
                      >
                        {threat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Witness Stats */}
                <div className="glass-card p-4 flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {selectedDestination.witnesses}
                    </p>
                    <p className="text-sm text-muted-foreground">Final Witnesses</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">Last documented</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedDestination.lastWitness}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 bg-gradient-accent text-primary-foreground rounded-xl font-medium"
                  >
                    Plan Expedition
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedDestination(null)}
                    className="px-6 py-3 bg-secondary text-foreground rounded-xl font-medium"
                  >
                    Close
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default VanishingDestinations;
