import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TimeSelector } from '@/components/ui/time-selector';
import {
  ArrowLeft,
  Zap,
  Palmtree,
  ArrowRight,
  Info,
  Clock,
  Route,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type TravelIntent = 'urgent' | 'leisure' | null;

const JourneyPlanner = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [travelIntent, setTravelIntent] = useState<TravelIntent>(null);
  const [departureTime, setDepartureTime] = useState('09:00');

  const handleContinue = () => {
    if (travelIntent) {
      // Pass all search params from home page + new intent params + departure time
      const params = new URLSearchParams(searchParams);
      params.set('intent', travelIntent);
      params.set('departureTime', departureTime);
      navigate(`/journey/plan?${params.toString()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="text-center mb-6 relative">
          <h1 className="text-2xl font-bold mb-2">Plan Your Journey</h1>
          <p className="text-sm text-muted-foreground">
            Quick setup • Optimized routes • Door-to-door planning
          </p>

          {/* About Button - Top Right */}
          {travelIntent && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="absolute top-0 right-0 gap-2">
                  <Info className="h-4 w-4" />
                  What You'll Get
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Your Journey Features</DialogTitle>
                  <DialogDescription>
                    Based on: {travelIntent === 'urgent' ? 'Urgent Travel' : 'Leisure Travel'}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  {/* Feature 1 */}
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <Route className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium mb-1">
                        {travelIntent === 'urgent'
                          ? 'Fastest Multi-Modal Route'
                          : 'Scenic Multi-Modal Route'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {travelIntent === 'urgent'
                          ? 'AI-optimized door-to-door path combining walk, metro, bus, train, and flight for minimum travel time'
                          : 'Comfortable journey with scenic routes, combining various transport modes for best experience'}
                      </p>
                    </div>
                  </div>

                  {/* Feature 2 */}
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <Clock className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium mb-1">
                        {travelIntent === 'urgent' ? 'Strategic Rest Stops' : 'Curated Experiences'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {travelIntent === 'urgent'
                          ? 'Quick meal breaks and essential rest points optimized for speed without compromising your energy'
                          : 'Local restaurants, cultural sites, and experiences along your route for memorable journey'}
                      </p>
                    </div>
                  </div>

                  {/* Feature 3 */}
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <Sparkles className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium mb-1">AI-Powered Recommendations</p>
                      <p className="text-sm text-muted-foreground">
                        Smart suggestions for accommodations, activities, and services based on your
                        travel style and preferences
                      </p>
                    </div>
                  </div>

                  {/* Feature 4 */}
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <BookOpen className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium mb-1">Complete Travel Guide</p>
                      <p className="text-sm text-muted-foreground">
                        Essential info: local customs, safety tips, emergency contacts, and
                        must-know travel advice
                      </p>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Compact Selection */}
        <div className="space-y-6">
          {/* Travel Intent */}
          <div>
            <label className="text-sm font-medium mb-2 block">Travel Purpose</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTravelIntent('urgent')}
                className={cn(
                  'p-4 rounded-lg border-2 transition-all text-left hover:border-primary/50',
                  travelIntent === 'urgent' ? 'border-primary bg-primary/5' : 'border-border'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-4 w-4 text-orange-500" />
                  <span className="font-semibold text-sm">Urgent Travel</span>
                </div>
                <p className="text-xs text-muted-foreground">Fastest routes & quick stops</p>
              </button>

              <button
                onClick={() => setTravelIntent('leisure')}
                className={cn(
                  'p-4 rounded-lg border-2 transition-all text-left hover:border-primary/50',
                  travelIntent === 'leisure' ? 'border-primary bg-primary/5' : 'border-border'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Palmtree className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold text-sm">Leisure Travel</span>
                </div>
                <p className="text-xs text-muted-foreground">Comfortable & scenic routes</p>
              </button>
            </div>
          </div>

          {/* Departure Time */}
          {travelIntent && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <label className="text-sm font-medium mb-2 block">What time are you leaving?</label>
              <TimeSelector value={departureTime} onChange={setDepartureTime} />
            </div>
          )}

          {/* Start Planning Button */}
          {travelIntent && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 mt-6">
              <Button onClick={handleContinue} className="w-full" size="lg">
                Start Planning My Route
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JourneyPlanner;
