import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, MapPin, Users, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EndangeredPlace } from '@/services/EndangeredPlacesService';
import { useNavigate } from 'react-router-dom';

interface EndangeredPlacesSuggestionProps {
  isOpen: boolean;
  onClose: () => void;
  places: EndangeredPlace[];
  destination: string;
}

const threatColors = {
  critical: 'text-red-600 bg-red-50 border-red-200',
  high: 'text-orange-600 bg-orange-50 border-orange-200',
  moderate: 'text-yellow-600 bg-yellow-50 border-yellow-200',
};

const EndangeredPlacesSuggestion = ({
  isOpen,
  onClose,
  places,
  destination,
}: EndangeredPlacesSuggestionProps) => {
  const navigate = useNavigate();

  const handleViewAllEndangered = () => {
    navigate('/stays');
    onClose();
  };

  const handlePlaceClick = (place: EndangeredPlace) => {
    // Navigate to stays page with the specific place pre-selected
    navigate('/stays', { state: { selectedPlace: place } });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    🌍 Endangered Places Near {destination}
                  </h2>
                  <p className="text-gray-600">
                    These precious places are disappearing. Visit them before they're gone forever.
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full">
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {places.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Endangered Places Found Nearby
                  </h3>
                  <p className="text-gray-600 mb-6">
                    We couldn't find any endangered places near {destination}, but there are many
                    others around the world that need your witness.
                  </p>
                  <Button onClick={handleViewAllEndangered} className="gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Explore All Endangered Places
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {places.map((place, index) => (
                    <motion.div
                      key={place.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => handlePlaceClick(place)}
                    >
                      <div className="flex">
                        {/* Image */}
                        <div className="w-48 h-32 flex-shrink-0">
                          <img
                            src={place.image}
                            alt={place.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                                {place.name}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                <MapPin className="w-4 h-4" />
                                {place.location}
                              </div>
                            </div>

                            {/* Threat Level Badge */}
                            <div
                              className={`px-3 py-1 rounded-full border text-xs font-medium ${threatColors[place.threatLevel]}`}
                            >
                              {place.threatLevel.toUpperCase()}
                            </div>
                          </div>

                          {/* Story */}
                          <p className="text-sm text-gray-700 mb-3 line-clamp-2">{place.story}</p>

                          {/* Stats */}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span className="font-medium text-red-600">
                                {place.yearsRemaining} years left
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>{place.witnesses} witnesses</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{place.threats.length} threats</span>
                            </div>
                          </div>

                          {/* Threats */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {place.threats.slice(0, 3).map((threat, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                              >
                                {threat}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  💡 <strong>Tip:</strong> Book your main trip and add these endangered places as
                  side visits
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={onClose}>
                    Maybe Later
                  </Button>
                  <Button onClick={handleViewAllEndangered} className="gap-2">
                    <ExternalLink className="w-4 h-4" />
                    View All Endangered Places
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EndangeredPlacesSuggestion;
