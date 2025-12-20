/**
 * DateSelector Component
 * Date range selection for hotel bookings with availability checking
 */

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateSelectorProps {
  checkInDate: Date | null;
  checkOutDate: Date | null;
  onDateChange: (checkIn: Date | null, checkOut: Date | null) => void;
  unavailableDates?: Date[];
  minStay?: number;
  maxStay?: number;
  className?: string;
}

/**
 * DateSelector component for booking date range selection
 * Supports mobile-optimized full-screen picker and availability checking
 */
export function DateSelector({
  checkInDate,
  checkOutDate,
  onDateChange,
  unavailableDates = [],
  minStay = 1,
  maxStay = 30,
  className,
}: DateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempCheckIn, setTempCheckIn] = useState<Date | null>(checkInDate);
  const [tempCheckOut, setTempCheckOut] = useState<Date | null>(checkOutDate);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setTempCheckIn(checkInDate);
    setTempCheckOut(checkOutDate);
  }, [checkInDate, checkOutDate]);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const today = startOfDay(new Date());

  const isDateDisabled = (date: Date): boolean => {
    // Disable past dates
    if (isBefore(date, today)) {
      return true;
    }

    // Disable unavailable dates
    if (
      unavailableDates.some(
        d =>
          d.getFullYear() === date.getFullYear() &&
          d.getMonth() === date.getMonth() &&
          d.getDate() === date.getDate()
      )
    ) {
      return true;
    }

    // If check-in is selected, disable dates that violate min/max stay
    if (tempCheckIn && !tempCheckOut) {
      const minCheckOut = addDays(tempCheckIn, minStay);
      const maxCheckOut = addDays(tempCheckIn, maxStay);

      if (isBefore(date, minCheckOut) || isBefore(maxCheckOut, date)) {
        return true;
      }
    }

    return false;
  };

  const handleDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range) return;

    setTempCheckIn(range.from || null);
    setTempCheckOut(range.to || null);
  };

  const handleApply = () => {
    if (tempCheckIn && tempCheckOut) {
      onDateChange(tempCheckIn, tempCheckOut);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setTempCheckIn(null);
    setTempCheckOut(null);
    onDateChange(null, null);
  };

  const formatDateRange = (): string => {
    if (!checkInDate) return 'Select dates';
    if (!checkOutDate) return format(checkInDate, 'MMM dd, yyyy');

    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return `${format(checkInDate, 'MMM dd')} - ${format(checkOutDate, 'MMM dd, yyyy')} (${nights} night${nights > 1 ? 's' : ''})`;
  };

  const canApply = tempCheckIn && tempCheckOut;

  // Native date input handlers for mobile
  const handleNativeCheckInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value + 'T00:00:00') : null;
    if (date) {
      setTempCheckIn(date);
      if (tempCheckOut && isBefore(tempCheckOut, date)) {
        setTempCheckOut(null);
      }
    }
  };

  const handleNativeCheckOutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value + 'T00:00:00') : null;
    if (date && tempCheckIn) {
      setTempCheckOut(date);
      onDateChange(tempCheckIn, date);
    }
  };

  // Mobile native date picker
  if (isMobile) {
    const minDate = format(today, 'yyyy-MM-dd');
    const maxCheckOutDate = tempCheckIn
      ? format(addDays(tempCheckIn, maxStay), 'yyyy-MM-dd')
      : undefined;
    const minCheckOutDate = tempCheckIn
      ? format(addDays(tempCheckIn, minStay), 'yyyy-MM-dd')
      : minDate;

    return (
      <div className={cn('w-full space-y-4', className)}>
        <div className="space-y-2">
          <label htmlFor="check-in-date" className="text-sm font-medium">
            Check-in Date
          </label>
          <input
            id="check-in-date"
            type="date"
            value={tempCheckIn ? format(tempCheckIn, 'yyyy-MM-dd') : ''}
            onChange={handleNativeCheckInChange}
            min={minDate}
            aria-label="Check-in date"
            aria-required="true"
            className={cn(
              'w-full h-11 px-3 py-2 rounded-md border border-input',
              'bg-background text-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              // Ensure minimum touch target size
              'min-h-[44px]'
            )}
          />
        </div>

        {tempCheckIn && (
          <div className="space-y-2">
            <label htmlFor="check-out-date" className="text-sm font-medium">
              Check-out Date
            </label>
            <input
              id="check-out-date"
              type="date"
              value={tempCheckOut ? format(tempCheckOut, 'yyyy-MM-dd') : ''}
              onChange={handleNativeCheckOutChange}
              min={minCheckOutDate}
              max={maxCheckOutDate}
              aria-label="Check-out date"
              aria-required="true"
              className={cn(
                'w-full h-11 px-3 py-2 rounded-md border border-input',
                'bg-background text-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                // Ensure minimum touch target size
                'min-h-[44px]'
              )}
            />
          </div>
        )}

        {checkInDate && checkOutDate && (
          <div className="text-xs text-muted-foreground">
            {Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))}{' '}
            nights • Check-in: {format(checkInDate, 'MMM dd')} • Check-out:{' '}
            {format(checkOutDate, 'MMM dd')}
          </div>
        )}
      </div>
    );
  }

  // Desktop calendar picker
  return (
    <div className={cn('w-full', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !checkInDate && 'text-muted-foreground',
              // Ensure minimum touch target size
              'min-h-[44px]'
            )}
            aria-label={checkInDate ? `Selected dates: ${formatDateRange()}` : 'Select dates'}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
            {checkInDate && (
              <X
                className="ml-auto h-4 w-4 opacity-50 hover:opacity-100"
                onClick={e => {
                  e.stopPropagation();
                  handleClear();
                }}
                aria-label="Clear selected dates"
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Select your dates</h4>
              <p className="text-xs text-muted-foreground">
                {!tempCheckIn && 'Choose your check-in date'}
                {tempCheckIn && !tempCheckOut && 'Choose your check-out date'}
                {tempCheckIn &&
                  tempCheckOut &&
                  `${Math.ceil((tempCheckOut.getTime() - tempCheckIn.getTime()) / (1000 * 60 * 60 * 24))} nights selected`}
              </p>
            </div>

            <Calendar
              mode="range"
              selected={{
                from: tempCheckIn || undefined,
                to: tempCheckOut || undefined,
              }}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
              initialFocus
              numberOfMonths={2}
              className="rounded-md border"
              aria-label="Select check-in and check-out dates"
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 min-h-[44px]"
                onClick={() => {
                  setTempCheckIn(checkInDate);
                  setTempCheckOut(checkOutDate);
                  setIsOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button className="flex-1 min-h-[44px]" onClick={handleApply} disabled={!canApply}>
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {checkInDate && checkOutDate && (
        <div className="mt-2 text-xs text-muted-foreground">
          Check-in: {format(checkInDate, 'EEEE, MMMM dd, yyyy')} • Check-out:{' '}
          {format(checkOutDate, 'EEEE, MMMM dd, yyyy')}
        </div>
      )}
    </div>
  );
}
