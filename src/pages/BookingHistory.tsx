/**
 * BookingHistory Page Component
 * Displays user's booking history with filtering, search, and sorting
 */

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookingCard, BookingDetails } from '@/features/booking/components';
import { bookingAPIService } from '@/features/booking/services/BookingAPIService';
import type { BookingConfirmation } from '@/types/booking';

type BookingFilter = 'all' | 'upcoming' | 'past' | 'cancelled' | 'sold';
type SortOption = 'date-desc' | 'date-asc' | 'price-desc' | 'price-asc' | 'status';

export default function BookingHistory() {
  const [filter, setFilter] = useState<BookingFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [selectedBooking, setSelectedBooking] = useState<BookingConfirmation | null>(null);

  // Mock user ID - in real app, this would come from auth context
  const userId = 'mock-user-id';

  // Fetch user bookings
  const {
    data: bookings = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['bookings', userId],
    queryFn: () => bookingAPIService.getUserBookings(userId),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    retry: 2,
  });

  const [searchParams, setSearchParams] = useSearchParams();

  // Auto-open latest booking if redirected from payment
  useEffect(() => {
    if (searchParams.get('newBooking') === 'true' && bookings.length > 0) {
      // Assuming the first booking is the latest one since default sort is date-desc
      // If the API doesn't return sorted, we might need to sort here finding the max createdAt/checkIn
      const latestBooking = bookings[0]; // Simplified for demo
      setSelectedBooking(latestBooking);

      // Clean up the URL
      searchParams.delete('newBooking');
      setSearchParams(searchParams);
    }
  }, [bookings, searchParams, setSearchParams]);

  // Filter bookings based on status
  const filteredByStatus = useMemo(() => {
    const now = new Date();

    switch (filter) {
      case 'upcoming':
        return bookings.filter(
          booking => booking.status !== 'cancelled' && new Date(booking.checkInDate) >= now
        );
      case 'past':
        return bookings.filter(
          booking => booking.status !== 'cancelled' && new Date(booking.checkOutDate) < now
        );
      case 'cancelled':
        return bookings.filter(booking => booking.status === 'cancelled');
      case 'sold':
        return bookings.filter(booking => booking.status === 'market_listed');
      default:
        return bookings;
    }
  }, [bookings, filter]);

  // Filter by search query
  const filteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) return filteredByStatus;

    const query = searchQuery.toLowerCase();
    return filteredByStatus.filter(
      booking =>
        booking.hotel.title.toLowerCase().includes(query) ||
        booking.hotel.location.toLowerCase().includes(query) ||
        booking.referenceNumber.toLowerCase().includes(query)
    );
  }, [filteredByStatus, searchQuery]);

  // Sort bookings
  const sortedBookings = useMemo(() => {
    const sorted = [...filteredBySearch];

    switch (sortBy) {
      case 'date-desc':
        return sorted.sort(
          (a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime()
        );
      case 'date-asc':
        return sorted.sort(
          (a, b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime()
        );
      case 'price-desc':
        return sorted.sort((a, b) => b.pricing.total - a.pricing.total);
      case 'price-asc':
        return sorted.sort((a, b) => a.pricing.total - b.pricing.total);
      case 'status':
        return sorted.sort((a, b) => a.status.localeCompare(b.status));
      default:
        return sorted;
    }
  }, [filteredBySearch, sortBy]);

  // Handle pull-to-refresh
  const handleRefresh = () => {
    refetch();
  };

  // Handle booking selection
  const handleBookingClick = (booking: BookingConfirmation) => {
    setSelectedBooking(booking);
  };

  // Handle close details
  const handleCloseDetails = () => {
    setSelectedBooking(null);
  };

  // Handle booking update (after modification/cancellation)
  const handleBookingUpdate = () => {
    refetch();
    setSelectedBooking(null);
  };

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      {/* Header */}
      <div className="border-b bg-card shrink-0">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">My Bookings</h1>
              <p className="text-muted-foreground mt-1">Manage your hotel reservations</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefetching}
              className="md:hidden"
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by hotel, location, or reference number..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={value => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-[180px]">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Date (Newest)</SelectItem>
                  <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                  <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                  <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefetching}
                className="hidden md:flex"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="container mx-auto px-4 py-6 h-full flex flex-col">
          <Tabs value={filter} onValueChange={value => setFilter(value as BookingFilter)} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 mb-6 shrink-0">
              <TabsTrigger value="all">
                All
                {filter === 'all' && bookings.length > 0 && (
                  <span className="ml-2 text-xs">({bookings.length})</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                Upcoming
                {filter === 'upcoming' && sortedBookings.length > 0 && (
                  <span className="ml-2 text-xs">({sortedBookings.length})</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="past">
                Past
                {filter === 'past' && sortedBookings.length > 0 && (
                  <span className="ml-2 text-xs">({sortedBookings.length})</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Cancelled
                {filter === 'cancelled' && sortedBookings.length > 0 && (
                  <span className="ml-2 text-xs">({sortedBookings.length})</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="sold">
                Sold (Market)
                {filter === 'sold' && sortedBookings.length > 0 && (
                  <span className="ml-2 text-xs">({sortedBookings.length})</span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="flex-1 min-h-0 overflow-y-auto mt-0 data-[state=inactive]:hidden">
              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Loading bookings...</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center max-w-md">
                    <p className="text-destructive mb-4">
                      Failed to load bookings. Please try again.
                    </p>
                    <Button onClick={handleRefresh} variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && sortedBookings.length === 0 && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center max-w-md">
                    <p className="text-muted-foreground mb-2">
                      {searchQuery
                        ? 'No bookings match your search'
                        : filter === 'all'
                          ? 'No bookings yet'
                          : `No ${filter} bookings`}
                    </p>
                    {searchQuery && (
                      <Button variant="link" onClick={() => setSearchQuery('')} className="mt-2">
                        Clear search
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Bookings List */}
              {!isLoading && !error && sortedBookings.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pb-4">
                  {sortedBookings.map(booking => (
                    <BookingCard
                      key={booking.bookingId}
                      booking={booking}
                      onClick={() => handleBookingClick(booking)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <BookingDetails
          booking={selectedBooking}
          isOpen={!!selectedBooking}
          onClose={handleCloseDetails}
          onBookingUpdate={handleBookingUpdate}
        />
      )}
    </div>
  );
}
