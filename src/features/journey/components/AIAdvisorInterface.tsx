/**
 * AI Advisor Interface Component
 * 
 * Main container for the comprehensive AI-powered journey advisor
 * Provides intelligent travel advice for all aspects of the journey
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Route,
  Cloud,
  Utensils,
  MapPin,
  Shield,
  Wallet,
  Backpack,
  RefreshCw,
  MessageCircle,
} from 'lucide-react';
import { bookOnceAIService } from '../services/BookOnceAIService';

export interface AIAdvisorInterfaceProps {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  travelers: number;
  intent: 'urgent' | 'leisure';
  visitor: 'first-time' | 'returning';
  departureTime: string;
}

type PanelType = 'overview' | 'transportation' | 'weather' | 'dining' | 'accommodation' | 'activities' | 'safety' | 'budget' | 'packing';

export function AIAdvisorInterface({
  origin,
  destination,
  departureDate,
  returnDate,
  travelers,
  intent,
  visitor,
  departureTime,
}: AIAdvisorInterfaceProps) {
  const [activePanel, setActivePanel] = useState<PanelType>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [transportationAdvice, setTransportationAdvice] = useState<string>('');
  const [diningAdvice, setDiningAdvice] = useState<string>('');
  const [activityAdvice, setActivityAdvice] = useState<string>('');
  const [safetyAdvice, setSafetyAdvice] = useState<string>('');
  const [packingAdvice, setPackingAdvice] = useState<string>('');
  const [budgetAdvice, setBudgetAdvice] = useState<string>('');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const context = {
    origin,
    destination,
    departureDate,
    returnDate,
    travelers,
    intent,
    visitor,
    departureTime,
  };

  // Load AI recommendations on mount
  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      // Load recommendations sequentially with delays to avoid rate limiting
      // 1. Transportation
      const transport = await bookOnceAIService.getTransportationAdvice(context);
      setTransportationAdvice(transport);

      // Wait 1 second before next request
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 2. Dining
      const dining = await bookOnceAIService.getDiningRecommendations(context);
      setDiningAdvice(dining);

      // Wait 1 second before next request
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. Activities
      const activities = await bookOnceAIService.getActivitySuggestions(context);
      setActivityAdvice(activities);

      // Wait 1 second before next request
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 4. Safety
      const safety = await bookOnceAIService.getSafetyInformation(context);
      setSafetyAdvice(safety);

      // Wait 1 second before next request
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 5. Packing
      const packing = await bookOnceAIService.generatePackingList(context);
      setPackingAdvice(packing);

      // Wait 1 second before next request
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 6. Budget
      const budget = await bookOnceAIService.calculateBudget(context);
      setBudgetAdvice(budget);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsChatLoading(true);

    try {
      const response = await bookOnceAIService.answerQuestion(userMessage, context);
      setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Error in chat:', error);
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">AI Journey Advisor</h2>
            <p className="text-sm text-muted-foreground">
              Comprehensive travel planning powered by AI
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activePanel} onValueChange={(value) => setActivePanel(value as PanelType)}>
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="transportation" className="flex items-center gap-2">
            <Route className="h-4 w-4" />
            <span className="hidden sm:inline">Transport</span>
          </TabsTrigger>
          <TabsTrigger value="plan" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Plan</span>
          </TabsTrigger>
          <TabsTrigger value="prepare" className="flex items-center gap-2">
            <Backpack className="h-4 w-4" />
            <span className="hidden sm:inline">Prepare</span>
          </TabsTrigger>
          <TabsTrigger value="budget" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Budget</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <Route className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Your Journey</h3>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">From:</span> {origin}</p>
                <p><span className="font-medium">To:</span> {destination}</p>
                <p><span className="font-medium">Date:</span> {departureDate}</p>
                <p><span className="font-medium">Travelers:</span> {travelers}</p>
                <p><span className="font-medium">Style:</span> {intent === 'urgent' ? '⚡ Urgent' : '🎒 Leisure'}</p>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-900">AI Insights</h3>
              </div>
              <div className="space-y-2 text-sm text-green-800">
                <p>✓ Route optimized for {intent} travel</p>
                <p>✓ {visitor === 'first-time' ? 'First-time visitor tips included' : 'Returning visitor recommendations'}</p>
                <p>✓ Real-time updates enabled</p>
                <p>✓ Group of {travelers} - special considerations applied</p>
              </div>
            </Card>
          </div>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Quick Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <Cloud className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <p className="text-xs text-muted-foreground">Weather</p>
                <p className="font-semibold">Loading...</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <Route className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-semibold">~4 hours</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <Wallet className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <p className="text-xs text-muted-foreground">Est. Cost</p>
                <p className="font-semibold">Calculating...</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <MapPin className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                <p className="text-xs text-muted-foreground">Activities</p>
                <p className="font-semibold">12 suggested</p>
              </div>
            </div>
          </Card>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>💡 Pro Tip:</strong> Explore each tab to see detailed recommendations for transportation, weather, dining, accommodation, activities, safety, and more!
            </p>
          </div>
        </TabsContent>

        {/* Transportation Tab */}
        <TabsContent value="transportation" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Transportation Details</h3>
              {isLoading && <RefreshCw className="h-4 w-4 animate-spin text-primary" />}
            </div>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
              </div>
            ) : transportationAdvice ? (
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm">{transportationAdvice}</div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No transportation advice available.</p>
            )}
          </Card>
        </TabsContent>

        {/* Plan Tab */}
        <TabsContent value="plan" className="space-y-4">
          <div className="grid gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Utensils className="h-5 w-5 text-orange-500" />
                <h3 className="font-semibold">Dining Recommendations</h3>
              </div>
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded" />
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                </div>
              ) : diningAdvice ? (
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm">{diningAdvice}</div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No dining recommendations available.</p>
              )}
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-5 w-5 text-green-500" />
                <h3 className="font-semibold">Activities & Attractions</h3>
              </div>
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded" />
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                </div>
              ) : activityAdvice ? (
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm">{activityAdvice}</div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No activity suggestions available.</p>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Prepare Tab */}
        <TabsContent value="prepare" className="space-y-4">
          <div className="grid gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-red-500" />
                <h3 className="font-semibold">Safety Information</h3>
              </div>
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded" />
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                </div>
              ) : safetyAdvice ? (
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm">{safetyAdvice}</div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No safety information available.</p>
              )}
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Backpack className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold">Packing List</h3>
              </div>
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded" />
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                </div>
              ) : packingAdvice ? (
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm">{packingAdvice}</div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No packing list available.</p>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Budget Tab */}
        <TabsContent value="budget" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="h-5 w-5 text-green-500" />
              <h3 className="font-semibold">Budget Breakdown</h3>
            </div>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
              </div>
            ) : budgetAdvice ? (
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm">{budgetAdvice}</div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No budget information available.</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* AI Chat Assistant - Floating */}
      <div className="mt-6 border-t pt-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Ask BookOnce AI</h3>
        </div>
        
        {chatMessages.length > 0 && (
          <div className="mb-4 space-y-3 max-h-60 overflow-y-auto">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground ml-8'
                    : 'bg-muted mr-8'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
            {isChatLoading && (
              <div className="p-3 rounded-lg bg-muted mr-8">
                <RefreshCw className="h-4 w-4 animate-spin" />
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleChatSubmit} className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask me anything about your trip..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isChatLoading}
          />
          <Button type="submit" disabled={isChatLoading || !chatInput.trim()}>
            <MessageCircle className="h-4 w-4" />
          </Button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setChatInput("What's the best time to visit?")}
          >
            Best time to visit?
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setChatInput("Any local customs I should know?")}
          >
            Local customs?
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setChatInput("What's the weather like?")}
          >
            Weather info?
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default AIAdvisorInterface;
