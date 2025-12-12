import { TravelIntent, VisitorType } from '@/pages/JourneyPlanner';
import JourneyTypeCard from '@/components/JourneyTypeCard';
import { Zap, Palmtree, MapPin, RotateCcw } from 'lucide-react';

interface TravelIntentSelectorProps {
  travelIntent: TravelIntent;
  visitorType: VisitorType;
  onTravelIntentChange: (intent: TravelIntent) => void;
  onVisitorTypeChange: (type: VisitorType) => void;
}

const TravelIntentSelector = ({
  travelIntent,
  visitorType,
  onTravelIntentChange,
  onVisitorTypeChange,
}: TravelIntentSelectorProps) => {
  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Step 1: Travel Intent */}
      <div>
        <div className="text-center mb-6">
          <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-2">
            Step 1 of 2
          </span>
          <h2 className="text-2xl font-bold mb-2">What's your travel purpose?</h2>
          <p className="text-muted-foreground">
            This helps us optimize your journey for speed or experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <JourneyTypeCard
            icon={<Zap className="h-8 w-8" />}
            title="Urgent Travel"
            description="Time-critical trips with fastest routes and strategic rest stops"
            features={[
              'Fastest door-to-door routes',
              'Optimized layovers',
              'Quick meal & rest options',
              'Real-time route updates',
            ]}
            selected={travelIntent === 'urgent'}
            onClick={() => onTravelIntentChange('urgent')}
            gradient="from-orange-500 to-red-500"
          />

          <JourneyTypeCard
            icon={<Palmtree className="h-8 w-8" />}
            title="Leisure Travel"
            description="Comfortable journeys with exploration and cultural experiences"
            features={[
              'Scenic route options',
              'Cultural experiences',
              'Comfortable accommodations',
              'Local recommendations',
            ]}
            selected={travelIntent === 'leisure'}
            onClick={() => onTravelIntentChange('leisure')}
            gradient="from-blue-500 to-purple-500"
          />
        </div>
      </div>

      {/* Step 2: Visitor Type (shown after intent selection) */}
      {travelIntent && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center mb-6">
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-2">
              Step 2 of 2
            </span>
            <h2 className="text-2xl font-bold mb-2">Have you been there before?</h2>
            <p className="text-muted-foreground">
              {travelIntent === 'urgent'
                ? 'Returning visitors can reuse proven fast routes'
                : 'First-time visitors get curated experiences, returning visitors can explore more'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <JourneyTypeCard
              icon={<MapPin className="h-8 w-8" />}
              title="First-Time Visitor"
              description={
                travelIntent === 'urgent'
                  ? 'AI-optimized fastest route with essential services'
                  : 'Curated experiences: popular spots or hidden gems'
              }
              features={
                travelIntent === 'urgent'
                  ? [
                      'AI route optimization',
                      'Essential services only',
                      'Emergency support',
                      'Real-time navigation',
                    ]
                  : [
                      'Popular destinations',
                      'Hidden cultural gems',
                      'Local experiences',
                      'Complete planning',
                    ]
              }
              selected={visitorType === 'first-time'}
              onClick={() => onVisitorTypeChange('first-time')}
              gradient="from-green-500 to-emerald-500"
            />

            <JourneyTypeCard
              icon={<RotateCcw className="h-8 w-8" />}
              title="Returning Visitor"
              description={
                travelIntent === 'urgent'
                  ? 'Reuse your saved routes or community-proven paths'
                  : 'Customize your journey and share experiences'
              }
              features={
                travelIntent === 'urgent'
                  ? [
                      'Saved route templates',
                      'Community routes',
                      'One-click rebooking',
                      'Route improvements',
                    ]
                  : [
                      'Personalized suggestions',
                      'Share your reviews',
                      'Loyalty benefits',
                      'Custom itineraries',
                    ]
              }
              selected={visitorType === 'returning'}
              onClick={() => onVisitorTypeChange('returning')}
              gradient="from-purple-500 to-pink-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelIntentSelector;
