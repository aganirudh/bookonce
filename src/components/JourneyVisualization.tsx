import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plane, 
  Train, 
  Bus, 
  Car, 
  MapPin, 
  Clock, 
  DollarSign, 
  Navigation,
  Footprints,
  Coffee,
  Utensils,
  Bed,
  ArrowRight,
  CheckCircle,
  Info,
  ExternalLink,
  Smartphone,
  CreditCard,
  X,
  ChevronRight,
  RotateCcw
} from 'lucide-react';

interface TransportOption {
  id: string;
  type: 'walk' | 'bus' | 'metro' | 'train' | 'flight' | 'car' | 'taxi' | 'rapido' | 'auto';
  from: string;
  to: string;
  duration: string;
  cost?: string;
  distance?: string;
  provider: string;
  description: string;
  nextOptions?: TransportOption[];
  bookingUrl?: string;
}

interface JourneyStep {
  id: string;
  title: string;
  location: string;
  options: TransportOption[];
}

interface JourneyVisualizationProps {
  aiResponse: string;
  journeyType: 'outbound' | 'return';
  userName?: string;
}

const JourneyVisualization: React.FC<JourneyVisualizationProps> = ({ 
  aiResponse, 
  journeyType,
  userName = 'Traveler'
}) => {
  const [selectedOptions, setSelectedOptions] = useState<TransportOption[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Parse AI response and create intelligent decision tree
  const createJourneyTree = (): JourneyStep[] => {
    const steps: JourneyStep[] = [];
    const lines = aiResponse.split('\n').filter(line => line.trim());
    
    let currentLocation = 'Home';
    let stepCounter = 1;
    
    // Parse AI response to extract journey segments
    const segments = [];
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.includes('Walk') || trimmedLine.includes('Metro') || 
          trimmedLine.includes('Bus') || trimmedLine.includes('Train') || 
          trimmedLine.includes('Flight') || trimmedLine.includes('Taxi') ||
          trimmedLine.includes('Auto') || trimmedLine.includes('Cab')) {
        segments.push(trimmedLine);
      }
    }

    // Create decision tree based on parsed segments
    if (segments.length > 0) {
      // Step 1: From Home - Always start with local transport options
      const homeOptions: TransportOption[] = [];
      
      // Check if AI mentions walking
      if (segments.some(s => s.toLowerCase().includes('walk'))) {
        homeOptions.push({
          id: 'walk-local',
          type: 'walk',
          from: 'Home',
          to: 'Nearest Transit',
          duration: '10-15 min',
          distance: '1 km',
          cost: 'Free',
          provider: 'Walking',
          description: 'Walk to nearest transit point',
          bookingUrl: undefined
        });
      }

      // Always add local transport options
      homeOptions.push(
        {
          id: 'rapido-transit',
          type: 'rapido',
          from: 'Home',
          to: 'Transit Point',
          duration: '5-8 min',
          distance: '1-2 km',
          cost: '₹30-60',
          provider: 'Rapido',
          description: 'Bike ride to transit',
          bookingUrl: 'https://rapido.bike'
        },
        {
          id: 'auto-transit',
          type: 'auto',
          from: 'Home',
          to: 'Transit Point',
          duration: '8-12 min',
          distance: '1-2 km',
          cost: '₹50-100',
          provider: 'Auto Rickshaw',
          description: 'Auto to transit point',
          bookingUrl: undefined
        }
      );

      // Add direct options based on distance (inferred from AI response)
      const hasLongDistance = segments.some(s => 
        s.toLowerCase().includes('flight') || 
        s.toLowerCase().includes('train') ||
        s.toLowerCase().includes('airport')
      );

      if (hasLongDistance) {
        homeOptions.push({
          id: 'cab-direct',
          type: 'taxi',
          from: 'Home',
          to: 'Airport/Station',
          duration: '30-60 min',
          distance: '15-30 km',
          cost: '₹400-800',
          provider: 'Uber/Ola',
          description: 'Direct cab to airport/station',
          bookingUrl: 'https://uber.com'
        });
      } else {
        homeOptions.push({
          id: 'cab-destination',
          type: 'taxi',
          from: 'Home',
          to: 'Final Destination',
          duration: '45-90 min',
          distance: '20-50 km',
          cost: '₹600-1500',
          provider: 'Uber/Ola',
          description: 'Direct cab to destination',
          bookingUrl: 'https://uber.com'
        });
      }

      steps.push({
        id: 'step-1',
        title: 'From Your Home',
        location: 'Starting Point',
        options: homeOptions
      });

      // Step 2: From Transit Point (if not direct)
      if (hasLongDistance) {
        const transitOptions: TransportOption[] = [];

        if (segments.some(s => s.toLowerCase().includes('metro'))) {
          transitOptions.push({
            id: 'metro-main',
            type: 'metro',
            from: 'Metro Station',
            to: 'Airport/Main Station',
            duration: '20-40 min',
            distance: '10-25 km',
            cost: '₹40-80',
            provider: 'Metro Rail',
            description: 'Metro to airport/main station',
            bookingUrl: 'https://paytm.com/metro-card-recharge'
          });
        }

        if (segments.some(s => s.toLowerCase().includes('bus'))) {
          transitOptions.push({
            id: 'bus-main',
            type: 'bus',
            from: 'Bus Stop',
            to: 'Airport/Station',
            duration: '30-60 min',
            distance: '15-30 km',
            cost: '₹30-60',
            provider: 'City Bus',
            description: 'Bus to airport/station',
            bookingUrl: 'https://redbus.in'
          });
        }

        transitOptions.push({
          id: 'cab-main',
          type: 'taxi',
          from: 'Transit Point',
          to: 'Airport/Station',
          duration: '25-45 min',
          distance: '15-25 km',
          cost: '₹300-600',
          provider: 'Uber/Ola',
          description: 'Cab to airport/station',
          bookingUrl: 'https://uber.com'
        });

        steps.push({
          id: 'step-2',
          title: 'From Transit Point',
          location: 'Metro/Bus Station',
          options: transitOptions
        });

        // Step 3: Long Distance Transport
        const longDistanceOptions: TransportOption[] = [];

        if (segments.some(s => s.toLowerCase().includes('flight'))) {
          longDistanceOptions.push({
            id: 'flight-dest',
            type: 'flight',
            from: 'Origin Airport',
            to: 'Destination Airport',
            duration: '1-3 hours',
            distance: '500-2000 km',
            cost: '₹3000-8000',
            provider: 'Airlines',
            description: 'Flight to destination',
            bookingUrl: 'https://makemytrip.com'
          });
        }

        if (segments.some(s => s.toLowerCase().includes('train'))) {
          longDistanceOptions.push({
            id: 'train-dest',
            type: 'train',
            from: 'Origin Station',
            to: 'Destination Station',
            duration: '4-15 hours',
            distance: '200-1500 km',
            cost: '₹500-2000',
            provider: 'Indian Railways',
            description: 'Train to destination',
            bookingUrl: 'https://irctc.co.in'
          });
        }

        if (longDistanceOptions.length > 0) {
          steps.push({
            id: 'step-3',
            title: 'Long Distance Travel',
            location: 'Airport/Railway Station',
            options: longDistanceOptions
          });
        }

        // Step 4: At Destination
        steps.push({
          id: 'step-4',
          title: 'At Your Destination',
          location: 'Destination Airport/Station',
          options: [
            {
              id: 'walk-final',
              type: 'walk',
              from: 'Airport/Station',
              to: 'Final Destination',
              duration: '5-15 min',
              distance: '0.5-1 km',
              cost: 'Free',
              provider: 'Walking',
              description: 'Walk to final destination',
              bookingUrl: undefined
            },
            {
              id: 'taxi-final',
              type: 'taxi',
              from: 'Airport/Station',
              to: 'Final Destination',
              duration: '15-30 min',
              distance: '5-20 km',
              cost: '₹200-500',
              provider: 'Local Taxi/Uber',
              description: 'Cab to final destination',
              bookingUrl: 'https://uber.com'
            },
            {
              id: 'bus-final',
              type: 'bus',
              from: 'Airport/Station',
              to: 'City Center',
              duration: '20-45 min',
              distance: '10-25 km',
              cost: '₹30-80',
              provider: 'Local Bus',
              description: 'Local bus to city',
              bookingUrl: undefined
            }
          ]
        });
      } else {
        // Short distance journey - no flights/trains needed
        steps.push({
          id: 'step-2',
          title: 'Local Transport Options',
          location: 'Within City',
          options: [
            {
              id: 'metro-dest',
              type: 'metro',
              from: 'Metro Station',
              to: 'Destination Station',
              duration: '20-45 min',
              distance: '10-30 km',
              cost: '₹40-80',
              provider: 'Metro Rail',
              description: 'Metro to destination area',
              bookingUrl: 'https://paytm.com/metro-card-recharge'
            },
            {
              id: 'bus-dest',
              type: 'bus',
              from: 'Bus Stop',
              to: 'Destination',
              duration: '30-60 min',
              distance: '15-40 km',
              cost: '₹25-60',
              provider: 'City Bus',
              description: 'Bus to destination',
              bookingUrl: 'https://redbus.in'
            },
            {
              id: 'cab-dest',
              type: 'taxi',
              from: 'Current Location',
              to: 'Final Destination',
              duration: '25-50 min',
              distance: '15-40 km',
              cost: '₹300-800',
              provider: 'Uber/Ola',
              description: 'Direct cab to destination',
              bookingUrl: 'https://uber.com'
            }
          ]
        });
      }
    }

    return steps;
  };

  const getStepIcon = (type: TransportOption['type']) => {
    const iconProps = { className: "h-4 w-4" };
    
    switch (type) {
      case 'walk':
        return <Footprints {...iconProps} />;
      case 'bus':
        return <Bus {...iconProps} />;
      case 'metro':
        return <Train {...iconProps} />;
      case 'train':
        return <Train {...iconProps} />;
      case 'flight':
        return <Plane {...iconProps} />;
      case 'car':
        return <Car {...iconProps} />;
      case 'taxi':
        return <Car {...iconProps} />;
      case 'rapido':
        return <Car {...iconProps} />;
      case 'auto':
        return <Car {...iconProps} />;
      default:
        return <Navigation {...iconProps} />;
    }
  };

  const getStepColor = (type: TransportOption['type']) => {
    switch (type) {
      case 'walk':
        return 'bg-success/10 text-success border-success/20';
      case 'bus':
        return 'bg-info/10 text-info border-info/20';
      case 'metro':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'train':
        return 'bg-primary/15 text-primary border-primary/25';
      case 'flight':
        return 'bg-info/15 text-info border-info/25';
      case 'car':
      case 'taxi':
      case 'rapido':
      case 'auto':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-secondary text-secondary-foreground border-border';
    }
  };

  const journeySteps = createJourneyTree();
  const currentStep = journeySteps[currentStepIndex];

  const handleOptionSelect = (option: TransportOption) => {
    const newSelectedOptions = [...selectedOptions, option];
    setSelectedOptions(newSelectedOptions);
    
    // Move to next step if available
    if (currentStepIndex < journeySteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleReset = () => {
    setSelectedOptions([]);
    setCurrentStepIndex(0);
  };

  const getTotalCost = () => {
    return selectedOptions.reduce((total, option) => {
      const cost = option.cost?.replace(/[₹$€£,]/g, '') || '0';
      return total + (cost === 'Free' ? 0 : parseInt(cost));
    }, 0);
  };

  const getTotalDuration = () => {
    let totalMinutes = 0;
    selectedOptions.forEach(option => {
      const duration = option.duration;
      if (duration.includes('hour')) {
        const hours = parseInt(duration.match(/(\d+)h/)?.[1] || '0');
        const minutes = parseInt(duration.match(/(\d+)min/)?.[1] || '0');
        totalMinutes += hours * 60 + minutes;
      } else if (duration.includes('min')) {
        totalMinutes += parseInt(duration.match(/(\d+)/)?.[1] || '0');
      }
    });
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
  };

  return (
    <div className="w-full space-y-6">
      {/* Progress Header */}
      <Card className="bg-gradient-accent text-primary-foreground">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">
                {journeyType === 'outbound' ? '🚀 Plan Your Journey' : '🏠 Plan Return Journey'}
              </h3>
              <p className="text-primary-foreground/80 text-sm">
                Choose your preferred transport at each step
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-primary-foreground/80">Step {currentStepIndex + 1} of {journeySteps.length}</p>
              <div className="flex gap-1 mt-1">
                {journeySteps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-8 rounded ${
                      index <= currentStepIndex ? 'bg-primary-foreground' : 'bg-primary-foreground/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Current Step Options */}
        <div className="lg:col-span-2">
          {currentStep && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  {currentStep.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Choose how you want to travel from {currentStep.location}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentStep.options.map((option) => (
                  <Card
                    key={option.id}
                    className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 border-2 interactive-hover"
                    onClick={() => handleOptionSelect(option)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${getStepColor(option.type)}`}>
                            {getStepIcon(option.type)}
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{option.description}</h4>
                            <p className="text-xs text-muted-foreground">{option.provider}</p>
                            <p className="text-xs text-muted-foreground/70">
                              {option.from} → {option.to}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {option.duration}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {option.cost}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{option.distance}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Journey Complete */}
          {currentStepIndex >= journeySteps.length && (
            <Card className="bg-success/10 border-success/20">
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success" />
                <h3 className="text-lg font-semibold text-success mb-2">Journey Planned!</h3>
                <p className="text-sm text-success/80 mb-4">
                  Your complete door-to-door journey is ready to book
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleReset} variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Plan Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Selected Journey Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg">Your Journey</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selected Options */}
              <div className="space-y-2">
                {selectedOptions.map((option, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                    <div className={`p-1 rounded ${getStepColor(option.type)}`}>
                      {getStepIcon(option.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{option.description}</p>
                      <p className="text-xs text-muted-foreground">{option.duration} • {option.cost}</p>
                    </div>
                  </div>
                ))}
                
                {selectedOptions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Select transport options to build your journey
                  </p>
                )}
              </div>

              {/* Journey Summary */}
              {selectedOptions.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-sm mb-2">Journey Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Duration:</span>
                      <span className="font-medium">{getTotalDuration()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Cost:</span>
                      <span className="font-medium">₹{getTotalCost().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transport Modes:</span>
                      <span className="font-medium">{selectedOptions.length}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Booking Actions */}
              {selectedOptions.length > 0 && (
                <div className="border-t pt-4 space-y-2">
                  <h4 className="font-medium text-sm mb-2">Quick Actions</h4>
                  {selectedOptions.map((option, index) => (
                    option.bookingUrl && (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        asChild
                      >
                        <a href={option.bookingUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 mr-2" />
                          Book {option.provider}
                        </a>
                      </Button>
                    )
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JourneyVisualization;