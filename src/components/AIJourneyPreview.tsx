import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Route, 
  Clock, 
  MapPin, 
  ArrowRight,
  Plane,
  Bus,
  Footprints
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AIJourneyPreview: React.FC = () => {
  return (
    <Card className="w-full max-w-4xl mx-auto bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-3 text-2xl">
          <Sparkles className="h-8 w-8 text-blue-600" />
          AI Journey Planner
        </CardTitle>
        <p className="text-gray-600">
          Get personalized, step-by-step journey plans with beautiful visual cards
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Demo Journey Steps */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800 mb-3">✨ Sample Journey: Mumbai → Goa</h3>
          
          {/* Step 1 */}
          <div className="flex items-center gap-4 p-3 bg-white rounded-lg border border-green-200">
            <div className="p-2 rounded-full bg-green-100 text-green-800">
              <Footprints className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">Walking</span>
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  09:00 AM
                </Badge>
              </div>
              <p className="text-sm text-gray-600">Walk to Andheri Metro Station</p>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <MapPin className="h-3 w-3" />
                Home <ArrowRight className="h-3 w-3" /> Andheri Station
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-center gap-4 p-3 bg-white rounded-lg border border-blue-200">
            <div className="p-2 rounded-full bg-blue-100 text-blue-800">
              <Bus className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">Metro Journey</span>
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  09:15 AM
                </Badge>
              </div>
              <p className="text-sm text-gray-600">Take Western Line to Mumbai Central</p>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <MapPin className="h-3 w-3" />
                45 minutes • ₹60
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-center gap-4 p-3 bg-white rounded-lg border border-sky-200">
            <div className="p-2 rounded-full bg-sky-100 text-sky-800">
              <Plane className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">Flight</span>
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  12:30 PM
                </Badge>
              </div>
              <p className="text-sm text-gray-600">Mumbai to Goa - IndiGo 6E 334</p>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <MapPin className="h-3 w-3" />
                1h 30m • ₹5,500
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="text-center p-4 bg-white rounded-lg">
            <Route className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <h4 className="font-semibold text-sm">Visual Journey Cards</h4>
            <p className="text-xs text-gray-600 mt-1">Step-by-step visual representation</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg">
            <Clock className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <h4 className="font-semibold text-sm">Real-time Scheduling</h4>
            <p className="text-xs text-gray-600 mt-1">Precise timing calculations</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg">
            <Sparkles className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <h4 className="font-semibold text-sm">AI Powered</h4>
            <p className="text-xs text-gray-600 mt-1">Personalized recommendations</p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-4">
          <Link to="/ai-journey">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Try AI Journey Planner
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIJourneyPreview;