import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import HotelCard from './HotelCard';
import { BookingModal } from '@/features/booking/components/BookingModal';

interface Hotel {
  id: number;
  title: string;
  location: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  amenities: string[];
  tags: string[];
  energy: number;
  social: number;
  budget: number;
  vibeScore?: number;
  coordinates?: number[];
}

interface HotelGridProps {
  hotels: Hotel[];
  searchQuery: string;
}

const HotelGrid = ({ hotels, searchQuery }: HotelGridProps) => {
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const handleBookingClick = (hotelId: number) => {
    console.log('Booking clicked for hotel:', hotelId);
    setSelectedHotelId(hotelId);
    setIsBookingModalOpen(true);
    console.log('Modal state set to open');
  };

  const handleCloseModal = () => {
    setIsBookingModalOpen(false);
    setSelectedHotelId(null);
  };

  const selectedHotel = hotels.find(h => h.id === selectedHotelId);

  console.log('HotelGrid render:', {
    selectedHotelId,
    isBookingModalOpen,
    selectedHotel: selectedHotel?.title,
    hotelsCount: hotels.length,
  });

  return (
    <section id="stays" className="py-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            {searchQuery ? `Results for "${searchQuery}"` : 'Trending Stays'}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Handpicked destinations that match your vibe. Each stay is curated for unforgettable
            experiences.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {hotels.map((hotel, index) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                index={index}
                onBookingClick={handleBookingClick}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {hotels.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-4xl">🏝️</span>
            </div>
            <h3 className="font-serif text-2xl font-semibold text-foreground mb-2">
              No matches found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your vibe sliders to discover more stays
            </p>
          </motion.div>
        )}
      </div>

      {/* Booking Modal */}
      {selectedHotel && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={handleCloseModal}
          hotel={selectedHotel}
        />
      )}
    </section>
  );
};

export default HotelGrid;
