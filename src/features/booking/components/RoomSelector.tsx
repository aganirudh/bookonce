/**
 * RoomSelector Component
 * Display and select available room types for booking
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Bed, Maximize2, Check, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RoomOption } from '@/types/booking';

interface RoomSelectorProps {
  rooms: RoomOption[];
  selectedRoomId: string | null;
  onRoomSelect: (room: RoomOption) => void;
  currency?: string;
  className?: string;
}

/**
 * RoomSelector component for displaying and selecting room types
 * Shows amenities, capacity, pricing, and instant booking availability
 */
export function RoomSelector({
  rooms,
  selectedRoomId,
  onRoomSelect,
  currency = 'USD',
  className,
}: RoomSelectorProps) {
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null);

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price);
  };

  const toggleExpanded = (roomId: string) => {
    setExpandedRoomId(expandedRoomId === roomId ? null : roomId);
  };

  if (rooms.length === 0) {
    return (
      <div className={cn('text-center py-8', className)} role="status" aria-live="polite">
        <p className="text-muted-foreground">No rooms available for selected dates</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)} role="list">
      {rooms.map((room) => {
        const isSelected = selectedRoomId === room.id;
        const isExpanded = expandedRoomId === room.id;

        return (
          <Card
            key={room.id}
            className={cn(
              'transition-all duration-200 cursor-pointer',
              'hover:shadow-md',
              isSelected 
                ? 'border-primary border-2 bg-primary/5' 
                : 'hover:border-primary/50'
            )}
            onClick={() => toggleExpanded(room.id)}
            role="article"
            aria-label={`${room.name}, ${formatPrice(room.basePrice)} per night, ${room.available} available`}
          >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {room.name}
                      {room.instantBooking && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          Instant
                        </Badge>
                      )}
                      {isSelected && (
                        <Badge variant="default" className="flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Selected
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {room.description}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{formatPrice(room.basePrice)}</div>
                    <div className="text-xs text-muted-foreground">per night</div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* Room Details */}
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Up to {room.capacity} guests</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Bed className="h-4 w-4 text-muted-foreground" />
                    <span>{room.bedType}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Maximize2 className="h-4 w-4 text-muted-foreground" />
                    <span>{room.size} m²</span>
                  </div>
                </div>

                {/* Availability */}
                <div className="mb-4">
                  <Badge variant={room.available > 0 ? 'default' : 'destructive'}>
                    {room.available > 0
                      ? `${room.available} room${room.available > 1 ? 's' : ''} available`
                      : 'Sold out'}
                  </Badge>
                </div>

                {/* Amenities - Show first 3, expand for more */}
                {room.amenities.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Amenities</h4>
                    <div className="flex flex-wrap gap-2">
                      {(isExpanded ? room.amenities : room.amenities.slice(0, 3)).map((amenity, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="text-xs px-3 py-1 bg-secondary/50 hover:bg-secondary transition-colors"
                        >
                          {amenity}
                        </Badge>
                      ))}
                      {!isExpanded && room.amenities.length > 3 && (
                        <Badge 
                          variant="outline" 
                          className="text-xs px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          +{room.amenities.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Images - Show when expanded */}
                {isExpanded && room.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {room.images.slice(0, 4).map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${room.name} - Image ${index + 1} of ${room.images.length}`}
                        className="w-full h-32 object-cover rounded-md"
                      />
                    ))}
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <Button
                  className={cn(
                    "w-full min-h-[44px] transition-all duration-200",
                    isSelected && "shadow-md"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRoomSelect(room);
                  }}
                  disabled={room.available === 0}
                  variant={isSelected ? 'default' : 'outline'}
                  aria-label={`${isSelected ? 'Selected' : 'Select'} ${room.name} room for ${formatPrice(room.basePrice)} per night`}
                  aria-pressed={isSelected}
                >
                  {isSelected ? (
                    <span className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Selected
                    </span>
                  ) : room.available === 0 ? (
                    'Sold Out'
                  ) : (
                    'Select Room'
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
      })}
    </div>
  );
}
