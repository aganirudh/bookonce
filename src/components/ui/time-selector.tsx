import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeSelectorProps {
  value: string;
  onChange: (time: string) => void;
  className?: string;
}

export const TimeSelector: React.FC<TimeSelectorProps> = ({ value, onChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState(9);
  const [minutes, setMinutes] = useState(0);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial value
  useEffect(() => {
    if (value) {
      const [timeStr] = value.split(':');
      const hour = parseInt(timeStr);
      const min = parseInt(value.split(':')[1] || '0');

      if (hour === 0) {
        setHours(12);
        setPeriod('AM');
      } else if (hour < 12) {
        setHours(hour);
        setPeriod('AM');
      } else if (hour === 12) {
        setHours(12);
        setPeriod('PM');
      } else {
        setHours(hour - 12);
        setPeriod('PM');
      }
      setMinutes(min);
    }
  }, [value]);

  // Close on outside click and handle keyboard
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          setIsOpen(false);
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (event.shiftKey) {
            handleMinuteChange(15);
          } else {
            handleHourChange(1);
          }
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (event.shiftKey) {
            handleMinuteChange(-15);
          } else {
            handleHourChange(-1);
          }
          break;
        case 'Tab':
          if (event.shiftKey) {
            handlePeriodToggle();
            event.preventDefault();
          }
          break;
        case 'Enter':
        case ' ':
          setIsOpen(false);
          event.preventDefault();
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, hours, minutes, period]);

  const formatDisplayTime = () => {
    const displayHour = hours === 0 ? 12 : hours;
    const displayMinute = minutes.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  };

  const updateTime = (newHours: number, newMinutes: number, newPeriod: 'AM' | 'PM') => {
    let hour24 = newHours;
    if (newPeriod === 'AM' && newHours === 12) {
      hour24 = 0;
    } else if (newPeriod === 'PM' && newHours !== 12) {
      hour24 = newHours + 12;
    }

    const timeString = `${hour24.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
    onChange(timeString);
  };

  const handleHourChange = (delta: number) => {
    const newHours = ((hours + delta - 1 + 12) % 12) + 1;
    setHours(newHours);
    updateTime(newHours, minutes, period);
  };

  const handleMinuteChange = (delta: number) => {
    const newMinutes = (minutes + delta + 60) % 60;
    setMinutes(newMinutes);
    updateTime(hours, newMinutes, period);
  };

  const handlePeriodToggle = () => {
    const newPeriod = period === 'AM' ? 'PM' : 'AM';
    setPeriod(newPeriod);
    updateTime(hours, minutes, newPeriod);
  };

  const quickTimes = [
    { label: 'Early Morning', time: '06:00', period: 'AM' },
    { label: 'Morning', time: '09:00', period: 'AM' },
    { label: 'Noon', time: '12:00', period: 'PM' },
    { label: 'Afternoon', time: '03:00', period: 'PM' },
    { label: 'Evening', time: '06:00', period: 'PM' },
  ];

  const handleQuickTime = (quickTime: (typeof quickTimes)[0]) => {
    const [h, m] = quickTime.time.split(':').map(Number);
    setHours(h === 0 ? 12 : h > 12 ? h - 12 : h);
    setMinutes(m);
    setPeriod(quickTime.period as 'AM' | 'PM');
    updateTime(h === 0 ? 12 : h > 12 ? h - 12 : h, m, quickTime.period as 'AM' | 'PM');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full justify-between h-auto p-4 text-left font-normal transition-all duration-200',
          'hover:bg-primary/5 hover:border-primary/50 focus:ring-2 focus:ring-primary/20',
          isOpen && 'border-primary bg-primary/5'
        )}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-lg font-semibold text-foreground">{formatDisplayTime()}</div>
            <div className="text-xs text-muted-foreground">
              AI will calculate your entire journey timeline from this time
            </div>
          </div>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform duration-200 text-muted-foreground',
            isOpen && 'rotate-180 text-primary'
          )}
        />
      </Button>

      {/* Time Picker Modal */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-2 p-6 shadow-xl border z-50 bg-background animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Quick Select */}
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-3 text-foreground">Quick Select</h4>
            <div className="grid grid-cols-2 gap-2">
              {quickTimes.map(qt => (
                <Button
                  key={qt.label}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickTime(qt)}
                  className="justify-start text-xs hover:bg-primary/10 transition-colors"
                >
                  {qt.label} ({qt.time} {qt.period})
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Time Picker */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Custom Time</h4>

            <div className="flex items-center justify-center gap-6 bg-muted/30 rounded-lg p-4">
              {/* Hours */}
              <div className="flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleHourChange(1)}
                  className="h-8 w-8 p-0 hover:bg-primary/20 transition-colors"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <div className="text-3xl font-bold py-3 w-16 text-center text-primary">
                  {hours.toString().padStart(2, '0')}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleHourChange(-1)}
                  className="h-8 w-8 p-0 hover:bg-primary/20 transition-colors"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <div className="text-xs text-muted-foreground mt-2 font-medium">Hours</div>
              </div>

              <div className="text-3xl font-bold text-muted-foreground">:</div>

              {/* Minutes */}
              <div className="flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMinuteChange(15)}
                  className="h-8 w-8 p-0 hover:bg-primary/20 transition-colors"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <div className="text-3xl font-bold py-3 w-16 text-center text-primary">
                  {minutes.toString().padStart(2, '0')}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMinuteChange(-15)}
                  className="h-8 w-8 p-0 hover:bg-primary/20 transition-colors"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <div className="text-xs text-muted-foreground mt-2 font-medium">Minutes</div>
              </div>

              {/* AM/PM */}
              <div className="flex flex-col items-center gap-2">
                <Button
                  variant={period === 'AM' ? 'default' : 'outline'}
                  size="sm"
                  onClick={handlePeriodToggle}
                  className="h-10 w-14 text-sm font-semibold transition-all"
                >
                  AM
                </Button>
                <Button
                  variant={period === 'PM' ? 'default' : 'outline'}
                  size="sm"
                  onClick={handlePeriodToggle}
                  className="h-10 w-14 text-sm font-semibold transition-all"
                >
                  PM
                </Button>
                <div className="text-xs text-muted-foreground mt-1 font-medium">Period</div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Selected:{' '}
                  <span className="font-semibold text-foreground">{formatDisplayTime()}</span>
                </div>
                <Button onClick={() => setIsOpen(false)} size="sm" className="px-6">
                  Done
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Keyboard shortcuts:</span> ↑↓ hours, Shift+↑↓ minutes,
                Tab AM/PM, Esc close
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
