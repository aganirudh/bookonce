import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Plane,
  Train,
  Bus,
  Car,
  Bike,
  MapPin,
  Clock,
  CheckCircle,
  Navigation,
  Footprints,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export interface TransportOption {
  id: string;
  type: 'walk' | 'bus' | 'metro' | 'train' | 'flight' | 'car' | 'taxi' | 'rapido' | 'auto';
  from: string;
  to: string;
  duration: string;
  cost?: string;
  distance?: string;
  provider: string;
  description: string;
  bookingUrl?: string;
}

export interface JourneyStep {
  id: string;
  title: string;
  location: string;
  options: TransportOption[];
}

interface JourneyVisualizationProps {
  steps: JourneyStep[];
  journeyType: 'outbound' | 'return';
  onSummaryUpdate?: (summary: { duration: string; cost: number; modes: number }) => void;
}

const JourneyVisualization: React.FC<JourneyVisualizationProps> = ({
  steps = [],
  journeyType,
  onSummaryUpdate,
}) => {
  const [selectedOptions, setSelectedOptions] = useState<TransportOption[]>([]);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(steps[0]?.id || null);

  // Auto-select first option for each step if not selected (for better UX)
  useEffect(() => {
    if (steps.length > 0 && selectedOptions.length === 0) {
      // Optional: Pre-select first options? 
      // Let's keep it manual for now, but maybe auto-expand the first one.
    }
  }, [steps]);

  const handleOptionSelect = (stepIndex: number, option: TransportOption) => {
    const newSelectedOptions = [...selectedOptions];
    newSelectedOptions[stepIndex] = option;
    setSelectedOptions(newSelectedOptions);

    // Auto-collapse and expand next
    setExpandedStepId(null);
    if (stepIndex < steps.length - 1) {
      setTimeout(() => setExpandedStepId(steps[stepIndex + 1].id), 300);
    }
  };

  const getTotalCost = () => {
    return selectedOptions.reduce((total, option) => {
      if (!option) return total;
      const cost = option.cost?.replace(/[₹$€£,]/g, '') || '0';
      return total + (cost === 'Free' ? 0 : parseInt(cost));
    }, 0);
  };

  const getTotalDuration = () => {
    let totalMinutes = 0;
    selectedOptions.forEach(option => {
      if (!option) return;
      const duration = option.duration;
      if (duration.includes('hour') || duration.includes('h')) {
        const hours = parseInt(duration.match(/(\d+)\s*h/)?.[1] || '0');
        const minutes = parseInt(duration.match(/(\d+)\s*m/)?.[1] || '0');
        totalMinutes += hours * 60 + minutes;
      } else if (duration.includes('min')) {
        totalMinutes += parseInt(duration.match(/(\d+)/)?.[1] || '0');
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  useEffect(() => {
    if (onSummaryUpdate) {
      onSummaryUpdate({
        duration: getTotalDuration(),
        cost: getTotalCost(),
        modes: selectedOptions.filter(Boolean).length,
      });
    }
  }, [selectedOptions, onSummaryUpdate]);

  const getStepIcon = (type: string) => {
    const props = { className: "h-4 w-4" };
    switch (type) {
      case 'walk': return <Footprints {...props} />;
      case 'bus': return <Bus {...props} />;
      case 'metro': case 'train': return <Train {...props} />;
      case 'flight': return <Plane {...props} />;
      case 'car': case 'taxi': case 'auto': return <Car {...props} />;
      case 'rapido': return <Bike {...props} />;
      default: return <Navigation {...props} />;
    }
  };

  if (!steps.length) return null;

  return (
    <div className="space-y-3">
      {/* Compact Timeline */}
      <div className="relative border-l-2 border-primary/20 ml-2 space-y-4 py-2">
        {steps.map((step, index) => {
          const isSelected = !!selectedOptions[index];
          const selectedOption = selectedOptions[index];
          const isExpanded = expandedStepId === step.id;

          return (
            <div key={step.id} className="pl-6 relative">
              {/* Step Marker */}
              <div
                className={`absolute -left-[9px] top-3 w-4 h-4 rounded-full border-2 transition-colors ${isSelected ? 'bg-primary border-primary' : 'bg-background border-muted-foreground'
                  }`}
              />

              {/* Step Card */}
              <div className="bg-card rounded-lg border shadow-sm transition-all hover:shadow-md">
                {/* Header (Always Visible) */}
                <div
                  className="p-3 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm truncate">{step.title}</h4>
                      {isSelected ? (
                        <div className="flex items-center gap-2 text-xs text-primary font-medium">
                          {getStepIcon(selectedOption.type)}
                          <span>{selectedOption.provider}</span>
                          <span>•</span>
                          <span>{selectedOption.duration}</span>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground truncate">Select transport option...</p>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0 ml-2">
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>

                {/* Options (Collapsible) */}
                {isExpanded && (
                  <div className="p-3 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in slide-in-from-top-2 duration-200">
                    {step.options.map((option) => (
                      <div
                        key={option.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOptionSelect(index, option);
                        }}
                        className={`cursor-pointer p-2 rounded-md border flex items-center gap-3 transition-colors ${selectedOptions[index]?.id === option.id
                            ? 'bg-primary/5 border-primary ring-1 ring-primary/50'
                            : 'hover:bg-muted/50 border-input'
                          }`}
                      >
                        <div className="p-1.5 rounded bg-muted/50 text-foreground/70">
                          {getStepIcon(option.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-xs text-foreground/90">{option.description}</span>
                            <span className="font-bold text-xs">{option.cost}</span>
                          </div>
                          <div className="flex justify-between items-center mt-0.5">
                            <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{option.provider}</span>
                            <span className="text-[10px] text-muted-foreground bg-muted px-1 rounded">{option.duration}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Total Summary (Compact) */}
      {selectedOptions.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg text-sm border border-primary/20">
          <span className="font-medium">Total Estimated</span>
          <div className="flex gap-3">
            <span className="font-bold">{getTotalDuration()}</span>
            <span className="font-bold text-primary">₹{getTotalCost().toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default JourneyVisualization;
