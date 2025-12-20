import { motion } from 'framer-motion';
import { AlertTriangle, Clock, MapPin, Users, ExternalLink, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EndangeredPlace } from '@/services/EndangeredPlacesService';
import { useNavigate } from 'react-router-dom';

interface EndangeredPlacesInlineProps {
  places: EndangeredPlace[];
  destination: string;
  isLoading?: boolean;
  onAddToTrip?: (place: EndangeredPlace) => void;
}

const threatColors = {
  critical: 'text-red-600 bg-red-50 border-red-200',
  high: 'text-orange-600 bg-orange-50 border-orange-200',
  moderate: 'text-yellow-600 bg-yellow-50 border-yellow-200',
};

const EndangeredPlacesInline = ({
  places,
  destination,
  isLoading,
  onAddToTrip,
}: EndangeredPlacesInlineProps) => {
  const navigate = useNavigate();

  const handleViewAllEndangered = () => {
    navigate('/stays');
  };

  const handlePlaceClick = (place: EndangeredPlace) => {
    if (onAddToTrip) {
      onAddToTrip(place);
    } else {
      navigate('/stays', { state: { selectedPlace: place } });
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-2xl">🌍</div>
          <div>
            <h3 className="font-semibold text-lg">Endangered Places Near {destination}</h3>
            <p className="text-sm text-muted-foreground">
              Loading nearby places that need your witness...
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="flex gap-4 p-4 border rounded-lg">
                <div className="w-20 h-16 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (places.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-2xl">🌍</div>
          <div>
            <h3 className="font-semibold text-lg">Endangered Places Near {destination}</h3>
            <p className="text-sm text-muted-foreground">
              Discover places that need urgent attention
            </p>
          </div>
        </div>
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="font-medium text-gray-900 mb-2">No Endangered Places Found Nearby</h4>
          <p className="text-sm text-gray-600 mb-4">
            We couldn't find any endangered places near {destination}, but there are many others
            around the world.
          </p>
          <Button onClick={handleViewAllEndangered} variant="outline" size="sm">
            <ExternalLink className="w-4 h-4 mr-2" />
            Explore All Endangered Places
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🌍</div>
          <div>
            <h3 className="font-semibold text-lg">Endangered Places Near {destination}</h3>
            <p className="text-sm text-muted-foreground">
              {places.length} places that need your witness before they disappear
            </p>
          </div>
        </div>
        <Button onClick={handleViewAllEndangered} variant="outline" size="sm">
          <ExternalLink className="w-4 h-4 mr-2" />
          View All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {places.slice(0, 3).map((place, index) => (
          <motion.div
            key={place.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="group relative border rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 bg-white dark:bg-card"
          >
            {/* Image Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity z-10" />

            {/* Image */}
            <div className="h-48 overflow-hidden">
              <img
                src={place.image}
                alt={place.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </div>

            {/* Threat Badge */}
            <div className="absolute top-3 right-3 z-20">
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-md ${place.threatLevel === 'critical' ? 'bg-red-500/90' :
                  place.threatLevel === 'high' ? 'bg-orange-500/90' : 'bg-yellow-500/90'
                }`}>
                {place.threatLevel}
              </span>
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-4 z-20 text-white">
              <h4 className="font-bold text-lg leading-tight mb-1 group-hover:text-primary-foreground transition-colors">{place.name}</h4>

              <div className="flex items-center gap-1 text-xs text-gray-200 mb-3">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[150px]">{place.location}</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-md">
                  <Clock className="w-3 h-3 text-red-300" />
                  <span className="text-[10px] font-medium">{place.yearsRemaining} yrs left</span>
                </div>

                {onAddToTrip && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 text-xs bg-white/90 hover:bg-white text-black border-0 shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300"
                    onClick={() => handlePlaceClick(place)}
                  >
                    Add +
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {places.length > 3 && (
        <div className="mt-4 text-center">
          <Button onClick={handleViewAllEndangered} variant="outline" size="sm">
            View {places.length - 3} More Endangered Places
          </Button>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700">
          💡 <strong>Tip:</strong> Consider adding these endangered places as side visits to your
          journey. Every witness helps preserve these precious locations for future generations.
        </p>
      </div>
    </Card>
  );
};

export default EndangeredPlacesInline;
