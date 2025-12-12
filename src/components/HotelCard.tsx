import { motion } from "framer-motion";
import { Star, MapPin, Wifi, Coffee, Waves, Mountain, AlertTriangle, Zap } from "lucide-react";
import { ContextLayerBadge } from "./ContextLayer";
import contextData from "@/data/context-alerts.json";
import { Hotel } from "@/types/booking";
import { Button } from "@/components/ui/button";

interface HotelCardProps {
  hotel: Hotel;
  index: number;
  onBookingClick?: (hotelId: number) => void;
}

const amenityIcons: Record<string, typeof Wifi> = {
  "Spa": Waves,
  "Lake View": Mountain,
  "Private Dock": Waves,
  "Fine Dining": Coffee,
  "City View": Mountain,
  "Smart Home": Wifi,
  "Rooftop Bar": Coffee,
  "Gym": Mountain,
  "Hot Spring": Waves,
  "Meditation Garden": Mountain,
  "Private Beach": Waves,
  "Water Villa": Waves,
  "Gear Storage": Mountain,
  "Guide Services": Mountain,
  "Art Gallery": Coffee,
  "Rooftop Pool": Waves,
  "Northern Lights View": Mountain,
  "Sauna": Waves,
  "Co-working": Wifi,
  "Bar": Coffee,
  "Stargazing": Mountain,
  "Wildlife Tours": Mountain,
  "Zip Line": Mountain,
};

const HotelCard = ({ hotel, index, onBookingClick }: HotelCardProps) => {
  // Find context alert for this hotel
  const alert = contextData.alerts.find(a => a.hotelId === hotel.id);

  const handleBookNowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBookingClick?.(hotel.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -8 }}
      className="group bg-card rounded-3xl overflow-hidden shadow-card hover:shadow-medium transition-all duration-300 relative"
    >
      {/* Badges Container */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
        {/* Context Layer Alert Badge */}
        {alert && <ContextLayerBadge alert={alert} />}
        
        {/* Instant Booking Badge - Compact */}
        {hotel.instantBooking && (
          <div 
            className="flex items-center justify-center glass-strong rounded-full w-7 h-7 bg-green-500/90 text-white"
            title="Instant Booking Available"
          >
            <Zap className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Image Container */}
      <div className="relative h-56 overflow-hidden">
        <motion.img
          src={hotel.image}
          alt={hotel.title}
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.6 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Price Badge */}
        <div className="absolute top-4 right-4 glass-strong rounded-xl px-3 py-1.5">
          <span className="text-foreground font-semibold">${hotel.price}</span>
          <span className="text-muted-foreground text-sm">/night</span>
        </div>

        {/* Tags */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          {hotel.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 text-xs font-medium bg-primary/90 text-primary-foreground rounded-lg capitalize"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title & Rating */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <h3 className="font-serif text-lg font-semibold text-card-foreground line-clamp-1">
            {hotel.title}
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="text-sm font-medium text-card-foreground">{hotel.rating}</span>
            <span className="text-sm text-muted-foreground">({hotel.reviews})</span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-muted-foreground mb-4">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{hotel.location}</span>
        </div>

        {/* Amenities */}
        <div className="flex items-center gap-3 pt-4 border-t border-border">
          {hotel.amenities.slice(0, 4).map((amenity) => {
            const Icon = amenityIcons[amenity] || Coffee;
            return (
              <div
                key={amenity}
                className="flex items-center gap-1.5 text-muted-foreground"
                title={amenity}
              >
                <Icon className="w-4 h-4" />
              </div>
            );
          })}
          {hotel.amenities.length > 4 && (
            <span className="text-xs text-muted-foreground">
              +{hotel.amenities.length - 4} more
            </span>
          )}
        </div>

        {/* Book Now Button */}
        <div className="mt-4">
          <Button
            onClick={handleBookNowClick}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all duration-200"
            size="lg"
          >
            Book Now
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default HotelCard;
