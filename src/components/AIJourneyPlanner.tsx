import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Calendar, 
  Users, 
  Clock, 
  Sparkles, 
  Loader2,
  Route,
  MessageSquare
} from 'lucide-react';
import { bookOnceAIService } from '@/features/journey/services/BookOnceAIService';
import JourneyVisualization from './JourneyVisualization';
import type { JourneyContext } from '@/features/journey/types/aiAdvisor';
import vagabondAIService from '@/features/journey/services/VagabondAIService';

const AIJourneyPlanner: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [journeyPlan, setJourneyPlan] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState('form');
  
  // Form state
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    departureDate: '',
    departureTime: '09:00',
    returnDate: '',
    travelers: '1',
    intent: 'leisure' as 'urgent' | 'leisure',

    userName: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateJourneyPlan = async () => {
    if (!formData.origin || !formData.destination || !formData.departureDate) {
      setError('Please fill in origin, destination, and departure date');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const context: JourneyContext = {
        origin: formData.origin,
        destination: formData.destination,
        departureDate: formData.departureDate,
        departureTime: formData.departureTime,
        returnDate: formData.returnDate || undefined,
        travelers: parseInt(formData.travelers),
        intent: formData.intent
      };

      const plan = await vagabondAIService.generateCompleteJourneyPlan(context);
      setJourneyPlan(plan);
      setActiveTab('visualization');
    } catch (err: any) {
      setError(err.message || 'Failed to generate journey plan');
    } finally {
      setIsLoading(false);
    }
  };

  const extractOutboundJourney = (fullPlan: string): string => {
    const sections = fullPlan.split(/##\s*(?:RETURN|Return)/i);
    return sections[0] || fullPlan;
  };

  const extractReturnJourney = (fullPlan: string): string => {
    const sections = fullPlan.split(/##\s*(?:RETURN|Return)/i);
    return sections[1] || '';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className="bg-gradient-accent text-primary-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Sparkles className="h-8 w-8" />
            AI Journey Planner
          </CardTitle>
          <p className="text-primary-foreground/80">
            Get personalized, step-by-step journey plans powered by AI
          </p>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="form" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Plan Journey
          </TabsTrigger>
          <TabsTrigger value="visualization" className="flex items-center gap-2">
            <Route className="h-4 w-4" />
            Visual Journey
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            AI Response
          </TabsTrigger>
        </TabsList>

        {/* Journey Planning Form */}
        <TabsContent value="form" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Journey Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Personal Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="userName">Your Name (Optional)</Label>
                  <Input
                    id="userName"
                    placeholder="e.g., Alex"
                    value={formData.userName}
                    onChange={(e) => handleInputChange('userName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="travelers">Number of Travelers</Label>
                  <Input
                    id="travelers"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.travelers}
                    onChange={(e) => handleInputChange('travelers', e.target.value)}
                  />
                </div>
              </div>

              {/* Route Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="origin">From</Label>
                  <Input
                    id="origin"
                    placeholder="e.g., Mumbai, India"
                    value={formData.origin}
                    onChange={(e) => handleInputChange('origin', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="destination">To</Label>
                  <Input
                    id="destination"
                    placeholder="e.g., Goa, India"
                    value={formData.destination}
                    onChange={(e) => handleInputChange('destination', e.target.value)}
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="departureDate">Departure Date</Label>
                  <Input
                    id="departureDate"
                    type="date"
                    value={formData.departureDate}
                    onChange={(e) => handleInputChange('departureDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="departureTime">Departure Time</Label>
                  <Input
                    id="departureTime"
                    type="time"
                    value={formData.departureTime}
                    onChange={(e) => handleInputChange('departureTime', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="returnDate">Return Date (Optional)</Label>
                  <Input
                    id="returnDate"
                    type="date"
                    value={formData.returnDate}
                    onChange={(e) => handleInputChange('returnDate', e.target.value)}
                  />
                </div>
              </div>

              {/* Preferences */}
              <div>
                <Label>Travel Style</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={formData.intent === 'urgent' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleInputChange('intent', 'urgent')}
                  >
                    🚀 Fast & Efficient
                  </Button>
                  <Button
                    variant={formData.intent === 'leisure' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleInputChange('intent', 'leisure')}
                  >
                    🌟 Leisurely & Scenic
                  </Button>
                </div>
              </div>

              {/* Generate Button */}
              <Button 
                onClick={generateJourneyPlan} 
                disabled={isLoading}
                className="w-full bg-gradient-accent hover:opacity-90"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating Your Journey...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate AI Journey Plan
                  </>
                )}
              </Button>

              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Visual Journey */}
        <TabsContent value="visualization" className="space-y-6">
          {journeyPlan ? (
            <div className="space-y-6">
              {/* Outbound Journey */}
              <JourneyVisualization 
                aiResponse={extractOutboundJourney(journeyPlan)}
                journeyType="outbound"
                userName={formData.userName || 'Traveler'}
              />

              {/* Return Journey */}
              {formData.returnDate && extractReturnJourney(journeyPlan) && (
                <JourneyVisualization 
                  aiResponse={extractReturnJourney(journeyPlan)}
                  journeyType="return"
                  userName={formData.userName || 'Traveler'}
                />
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Route className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Journey Plan Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Fill out the journey details and generate your AI-powered plan to see the visual journey cards.
                </p>
                <Button onClick={() => setActiveTab('form')} variant="outline">
                  <MapPin className="h-4 w-4 mr-2" />
                  Plan Your Journey
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AI Response */}
        <TabsContent value="chat" className="space-y-6">
          {journeyPlan ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  AI Generated Journey Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-foreground font-mono">
                    {journeyPlan}
                  </pre>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No AI Response Yet</h3>
                <p className="text-muted-foreground">
                  Generate a journey plan to see the detailed AI response.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIJourneyPlanner;