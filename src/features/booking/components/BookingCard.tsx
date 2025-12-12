/**
 * BookingCard Component
 * Compact booking summary card for list view
 */

import { useMemo } from 'react';
import { format, differenceInDays, differenceInHours } from 'date-fns';
import { Calendar, MapPin, Users, Clock, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { BookingConfirmation } from '@/types/booking';

interface BookingCardProps {
  booking: BookingConfirmation;
  onClick?: () => void;
  onModify?: () => void;
  onCancel?: () => void;
}

export function BookingCard({ booking, onClick, onModify, onCancel }: BookingCardProps) {
  const { hotel, checkInDate, checkOutDate, status, referenceNumber, roomDetails, pricing } = booking;

  // Calculate countdown to check-in
  const countdown = useMemo(() => {
    const now = new Date();
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (status === 'cancelled') {
      return null;
    }

    // If check-in is in the future
    if (checkIn > now) {
      const days = differenceInDays(checkIn, now);
      const hours = differenceInHours(checkIn, now) % 24;

      if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''} until check-in`;
      } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} until check-in`;
      } else {
        return 'Check-in today';
      }
    }

    // If currently checked in
    if (checkIn <= now && checkOut > now) {
      return 'Currently checked in';
    }

    return null;
  }, [checkInDate, checkOutDate, status]);

  // Get status badge variant
  const getStatusBadge = () => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default" className="bg-green-500">Confirmed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Calculate number of nights
  const numberOfNights = differenceInDays(new Date(checkOutDate), new Date(checkInDate));

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-4">
        {/* Hotel Image and Status */}
        <div className="relative mb-3">
          <img
            src={hotel.image}
            alt={hotel.title}
            className="w-full h-40 object-cover rounded-md"
          />
          <div className="absolute top-2 right-2">
            {getStatusBadge()}
          </div>
        </div>

        {/* Hotel Info */}
        <div className="space-y-2">
          <div>
            <h3 className="font-semibold text-lg line-clamp-1">{hotel.title}</h3>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <MapPin className="h-3 w-3 mr-1" />
              <span className="line-clamp-1">{hotel.location}</span>
            </div>
          </div>

          {/* Dates */}
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>
              {format(new Date(checkInDate), 'MMM d')} - {format(new Date(checkOutDate), 'MMM d, yyyy')}
            </span>
            <span className="text-muted-foreground ml-2">
              ({numberOfNights} night{numberOfNights > 1 ? 's' : ''})
            </span>
          </div>

          {/* Room Info */}
          <div className="flex items-center text-sm">
            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{roomDetails.name}</span>
          </div>

          {/* Countdown */}
          {countdown && (
            <div className="flex items-center text-sm font-medium text-primary">
              <Clock className="h-4 w-4 mr-2" />
              <span>{countdown}</span>
            </div>
          )}

          {/* Reference Number */}
          <div className="text-xs text-muted-foreground">
            Ref: {referenceNumber}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        {/* Price */}
        <div>
          <div className="text-2xl font-bold">
            ${pricing.total.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground">
            {pricing.currency}
          </div>
        </div>

        {/* Quick Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}>
              View Details
            </DropdownMenuItem>
            {status === 'confirmed' && (
              <>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onModify?.();
                }}>
                  Modify Booking
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancel?.();
                  }}
                  className="text-destructive"
                >
                  Cancel Booking
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
