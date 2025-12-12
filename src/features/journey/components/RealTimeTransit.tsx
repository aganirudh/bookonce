/**
 * Real-Time Transit Component
 * 
 * Shows transit steps with real-time links (100% FREE!)
 */

import { ExternalLink, Clock, Navigation, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TransitStep {
  mode: 'walk' | 'metro' | 'bus' | 'train';
  from: string;
  to: string;
  line?: string;
  direction?: string;
  stops?: number;
  duration: number;
  distance: number;
  instructions: string;
  realTimeLink?: string;
}

interface RealTimeTransitProps {
  steps: TransitStep[];
  googleMapsLink: string;
  realTimeApps: Array<{
    name: string;
    url: string;
    description: string;
    free: boolean;
  }>;
}

export function RealTimeTransit({ steps, googleMapsLink, realTimeApps }: RealTimeTransitProps) {
  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'walk':
        return '🚶';
      case 'metro':
        return '🚇';
      case 'bus':
        return '🚌';
      case 'train':
        return '🚂';
      default:
        return '🚶';
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'walk':
        return 'bg-green-50 border-green-200';
      case 'metro':
        return 'bg-blue-50 border-blue-200';
      case 'bus':
        return 'bg-orange-50 border-orange-200';
      case 'train':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Google Maps Link */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">
              🗺️ Get Real-Time Directions
            </h3>
            <p className="text-sm text-blue-700">
              Open in Google Maps for live transit updates
            </p>
          </div>
          <Button
            onClick={() => window.open(googleMapsLink, '_blank')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Open Maps
            <ExternalLink className="w-3 h-3 ml-2" />
          </Button>
        </div>
      </Card>

      {/* Transit Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <Card
            key={index}
            className={`p-4 border-2 ${getModeColor(step.mode)}`}
          >
            <div className="flex items-start gap-3">
              {/* Step Number & Icon */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-white border-2 border-current flex items-center justify-center text-xl">
                  {getModeIcon(step.mode)}
                </div>
              </div>

              {/* Step Details */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold capitalize">{step.mode}</h4>
                  {step.line && (
                    <Badge variant="secondary">{step.line}</Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {step.duration} min • {(step.distance / 1000).toFixed(1)} km
                  </span>
                </div>

                <p className="text-sm mb-2">{step.instructions}</p>

                {step.direction && (
                  <p className="text-xs text-muted-foreground mb-2">
                    Direction: {step.direction}
                    {step.stops && ` • ${step.stops} stops`}
                  </p>
                )}

                {/* Real-Time Link */}
                {step.realTimeLink && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(step.realTimeLink, '_blank')}
                    className="mt-2"
                  >
                    <Clock className="w-3 h-3 mr-2" />
                    Check Real-Time
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                )}

                {/* Metro-specific info */}
                {step.mode === 'metro' && (
                  <div className="mt-3 p-3 bg-white rounded-lg border">
                    <p className="text-xs font-semibold text-blue-900 mb-2">
                      💡 Real-Time Metro Info:
                    </p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Next train: Check app (usually 3-5 min)</li>
                      <li>• Frequency: Every 5-10 minutes</li>
                      <li>• Fare: ₹10-30 (distance-based)</li>
                      <li>• Buy token or use metro card</li>
                    </ul>
                  </div>
                )}

                {/* Bus-specific info */}
                {step.mode === 'bus' && (
                  <div className="mt-3 p-3 bg-white rounded-lg border">
                    <p className="text-xs font-semibold text-orange-900 mb-2">
                      💡 Real-Time Bus Info:
                    </p>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li>• Track bus: Use city transit app</li>
                      <li>• Frequency: Every 10-20 minutes</li>
                      <li>• Fare: ₹5-40 (distance-based)</li>
                      <li>• Have exact change ready</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Real-Time Apps */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Info className="w-4 h-4" />
          Free Real-Time Transit Apps
        </h3>
        <div className="grid gap-2">
          {realTimeApps.map((app, index) => (
            <button
              key={index}
              onClick={() => window.open(app.url, '_blank')}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors text-left"
            >
              <div>
                <p className="font-medium text-sm">{app.name}</p>
                <p className="text-xs text-muted-foreground">
                  {app.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {app.free && (
                  <Badge variant="secondary" className="text-xs">
                    FREE
                  </Badge>
                )}
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Tips */}
      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <h4 className="font-semibold text-yellow-900 mb-2">
          💡 Pro Tips for Real-Time Transit
        </h4>
        <ul className="text-sm space-y-1 text-yellow-800">
          <li>• Download city metro/bus app before traveling</li>
          <li>• Google Maps shows live bus/metro locations</li>
          <li>• Check station boards for real-time updates</li>
          <li>• Metro cards give 5-10% discount</li>
          <li>• Peak hours: 8-10 AM, 5-8 PM (more frequent)</li>
        </ul>
      </Card>
    </div>
  );
}

export default RealTimeTransit;
