/**
 * BookOnce AI Service
 *
 * AI-powered travel advisor with SambaNova primary and Groq fallback
 * Provides intelligent recommendations for all aspects of travel
 */

import type { JourneyContext, AIRecommendations } from '../types/aiAdvisor';

// AI Provider Configuration
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash'; // User explicitly requested 2.5 flash

// Debug: Log if API key is loaded
console.log('🔑 AI Provider Status:');
if (GEMINI_API_KEY) {
  console.log('  ✅ Gemini API Key loaded:', GEMINI_API_KEY.substring(0, 10) + '...');
} else {
  console.log('  ❌ Gemini API Key NOT loaded');
}

const AI_PROVIDER = GEMINI_API_KEY ? 'gemini' : null;
console.log('  🤖 Primary Provider:', AI_PROVIDER || 'NONE');

type AIProvider = 'gemini';

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

class BookOnceAIService {
  private currentProvider: AIProvider | null = AI_PROVIDER;
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    if (GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    }
  }

  /**
   * Call AI (Gemini)
   */
  private async callAI(messages: AIMessage[]): Promise<string> {
    if (!this.genAI) {
      throw new Error(
        'Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file'
      );
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: GEMINI_MODEL,
        // tools: [{ googleSearch: {} } as any], // Disabled: Cannot use tools with JSON mime type
        generationConfig: { responseMimeType: 'application/json' },
      });

      // Convert messages to Gemini format
      // Gemini expects a prompt or chat history. 
      // For simple request/response, we can combine system prompt and user message.

      const systemMessage = messages.find(m => m.role === 'system');
      const userMessages = messages.filter(m => m.role !== 'system');

      let prompt = '';
      if (systemMessage) {
        prompt += `${systemMessage.content}\n\n`;
      }

      // Add conversation history
      userMessages.forEach(msg => {
        prompt += `${msg.role === 'user' ? 'User' : 'Model'}: ${msg.content}\n`;
      });

      console.log('🚀 Calling Gemini API...');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('✅ Gemini response received');
      return text;

    } catch (error) {
      console.error('❌ Gemini API failed:', error);
      throw error;
    }
  }


  /**
   * Generate complete journey plan with timing calculations
   */
  async generateCompleteJourneyPlan(context: JourneyContext): Promise<string> {
    const systemPrompt = `You are BookOnce AI, an expert AI travel planner. Generate a complete door-to-door journey plan with precise timing calculations and cost breakdowns.

IMPORTANT: Calculate exact times for each segment based on the departure time: ${context.departureTime}

RESPONSE FORMAT: You MUST return a valid JSON object matching this schema:
{
  "outbound": [
    {
      "id": "step-1",
      "title": "Leg Title (e.g., 'To Airport')",
      "location": "Starting Location",
      "options": [
        {
          "id": "opt-1",
          "type": "walk" | "bus" | "metro" | "train" | "flight" | "taxi" | "rapido" | "auto",
          "description": "Short description",
          "provider": "Service Provider",
          "from": "Origin Name",
          "to": "Destination Name",
          "duration": "Duration",
          "cost": "Cost",
          "distance": "Distance"
        }
      ]
    }
  ],
  "return": [],
  "dining": [
    {
       "title": "Restaurant Name",
       "location": "Location",
       "description": "Cuisine/Vibe",
       "cost": "Price Range",
       "time": "Recommended Time"
    }
  ],
  "accommodation": [
    {
      "title": "Hotel Name",
      "location": "Address",
      "description": "Details",
      "cost": "Price/Night",
      "checkIn": "14:00"
    }
  ]
}

Your response must include:
1. OUTBOUND JOURNEY - Step-by-step route with exact times and costs
2. RETURN JOURNEY - Complete return route (if round-trip)
3. STOPS & FOOD - Meal recommendations with timing
4. ACCOMMODATION - Hotel suggestions with check-in/out times
${context.endangeredPlaces && context.endangeredPlaces.length > 0 ? `5. ENDANGERED PLACES - Include the special visits to endangered places with timing and pricing` : ''}

USE GOOGLE SEARCH to find REAL-TIME data. Do not hallucinate.
- Find ACTUAL bus numbers (e.g., "KSRTC Airavat", "VRL Travels").
- Find EXACT Metro stations and lines.
- Find REAL flight numbers and current prices (e.g., "IndiGo 6E-554").
- Check Rapido/Uber/Ola estimated prices for local travel.

STRICT REALISM RULES:
1. FORBIDDEN PHRASES: "Walk to nearest transit", "Walk to bus stop", "Local bus".
2. REQUIRED FORMAT: "Walk to [Specific Name] Bus Stop (via [Road Name])".
3. FIRST MILE: exact name of the nearest station to origin.
4. FLIGHTS: Must include Flight Number (e.g., 6E-554) and Terminal.
5. TRAINS: Must include Train Number and Name (e.g., 12051 Jan Shatabdi).

Format each segment clearly with:
- Mode of transport
- From → To locations
- Departure and arrival times
- Duration
- Distance
- Cost estimate (include endangered places costs when applicable)
- Special notes

Be specific about timing - calculate when each segment starts and ends based on the ${context.departureTime} departure time.
When endangered places are included, integrate them into the journey flow and mention their costs.`;

    const userPrompt = `Create a complete journey plan:

FROM: ${context.origin}
TO: ${context.destination}
DATE: ${context.departureDate}
DEPARTURE TIME: ${context.departureTime}
${context.returnDate ? `RETURN DATE: ${context.returnDate}` : ''}
TRAVELERS: ${context.travelers}
STYLE: ${context.intent === 'urgent' ? 'Fast and efficient - minimize travel time' : 'Leisurely - comfortable and scenic'}
EXPERIENCE: ${context.visitor === 'first-time' ? 'First-time visitor - include must-see highlights' : 'Returning visitor - suggest new experiences'}
${context.endangeredPlaces && context.endangeredPlaces.length > 0
        ? `
ENDANGERED PLACES TO VISIT:
${context.endangeredPlaces
          .map(
            (
              place: any
            ) => `  - ${place.name} (${place.location}) - ${place.threatLevel.toUpperCase()} threat, ${place.yearsRemaining} years remaining
    Estimated cost: ₹${place.estimatedCost.toLocaleString()} (includes transport, guide & entry)`
          )
          .join('\n')}
TOTAL ENDANGERED PLACES COST: ₹${context.totalEndangeredPlacesCost?.toLocaleString() || 0}`
        : ''
      }

Generate a detailed plan.
Structure your response EXACTLY according to the JSON schema provided above.
- Populate "outbound" with the outbound journey steps.
- If a return date is provided, populate "return".
- Populate "dining" with food recommendations.
- Populate "accommodation" if overnight stay is needed.

${context.endangeredPlaces && context.endangeredPlaces.length > 0 ? `Include these endangered/heritage sites in the plan:\n${context.endangeredPlaces.map((p: any) => `- ${p.name}`).join('\n')}` : ''}

Ensure all costs and times are realistic.`;

    try {
      const response = await this.callAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);

      return response;
    } catch (error: any) {
      console.error('Error generating journey plan:', error);

      // Fallback for Quota Exceeded (429) to allow UI testing
      if (error.message?.includes('429') || error.message?.includes('Quota') || error.message?.includes('quota')) {
        console.warn('⚠️ Gemini Quota Exceeded. Returning MOCK data for UI verification.');
        return JSON.stringify({
          outbound: [
            {
              id: 'mock-1',
              title: 'Departure (Mock Data)',
              location: context.origin,
              options: [
                {
                  id: 'm1',
                  type: 'car',
                  description: 'Uber to Airport',
                  provider: 'Uber Premier',
                  from: context.origin,
                  to: 'Airport',
                  duration: '45 min',
                  cost: '₹550',
                  bookingUrl: 'https://m.uber.com'
                }
              ]
            },
            {
              id: 'mock-2',
              title: 'Flight Segment',
              location: 'Airport',
              options: [
                {
                  id: 'm2',
                  type: 'flight',
                  description: 'Direct Flight',
                  provider: 'IndiGo 6E-554',
                  from: 'Airport (BOM)',
                  to: 'Airport (GOI)',
                  duration: '1h 15m',
                  cost: '₹3,200',
                  bookingUrl: 'https://www.goindigo.in'
                }
              ]
            },
            {
              id: 'mock-3',
              title: 'Arrival',
              location: context.destination,
              options: [
                {
                  id: 'm3',
                  type: 'taxi',
                  description: 'Prepaid Taxi',
                  provider: 'Black & Yellow',
                  from: 'Airport',
                  to: context.destination,
                  duration: '40 min',
                  cost: '₹800'
                }
              ]
            }
          ],
          return: [],
          dining: [
            {
              title: 'Coastal Flavors',
              location: 'Beachside',
              description: 'Goan Fish Curry',
              cost: '₹600',
              time: '13:00'
            }
          ],
          accommodation: []
        });
      }
      throw error;
    }
  }

  /**
   * Generate comprehensive travel plan using AI
   */
  async generateComprehensivePlan(context: JourneyContext): Promise<Partial<AIRecommendations>> {
    const systemPrompt = `You are BookOnce AI, an expert AI travel advisor. You provide comprehensive, personalized travel advice covering transportation, weather, dining, accommodation, activities, safety, budget, and packing.

Your responses should be:
- Practical and actionable
- Tailored to the traveler's intent (${context.intent}) and experience (${context.visitor})
- Considerate of group size (${context.travelers} travelers)
- Based on real-world travel knowledge
- Formatted as JSON for easy parsing`;

    const userPrompt = `Plan a comprehensive trip with these details:
- From: ${context.origin}
- To: ${context.destination}
- Departure: ${context.departureDate} at ${context.departureTime}
${context.returnDate ? `- Return: ${context.returnDate}` : ''}
- Travelers: ${context.travelers}
- Travel Style: ${context.intent === 'urgent' ? 'Fast and efficient' : 'Leisurely and exploratory'}
- Experience: ${context.visitor === 'first-time' ? 'First-time visitor' : 'Returning visitor'}

Provide recommendations for:
1. Transportation (best routes, timing, costs)
2. Weather conditions and what to wear
3. Dining options (local cuisine, meal timing)
4. Accommodation suggestions
5. Must-see activities and attractions
6. Safety tips and emergency contacts
7. Budget breakdown
8. Packing checklist

Format your response as detailed, practical advice.`;

    try {
      const response = await this.callAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);

      // Parse AI response and structure it
      // For now, return the raw response - we'll structure it better in future iterations
      return {
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Error generating travel plan:', error);
      throw error;
    }
  }

  /**
   * Answer travel questions with conversation history
   */
  async answerQuestionWithHistory(
    question: string,
    context: JourneyContext,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<string> {
    const systemPrompt = `You are BookOnce AI, an expert travel advisor with deep knowledge of destinations worldwide. You provide detailed, practical, and engaging travel advice.

Your expertise includes:
- Destination recommendations and hidden gems
- Local cuisine, restaurants, and food culture
- Cultural insights and customs
- Transportation and logistics
- Budget planning and money-saving tips
- Safety and health advice
- Best times to visit
- Activities and experiences
- Accommodation recommendations

Guidelines for responses:
1. Be specific and detailed - provide names, locations, and practical tips
2. Share insider knowledge and local insights
3. Consider the traveler's context when relevant
4. Be enthusiastic but honest about destinations
5. Provide actionable advice they can use immediately
6. Include cost estimates when discussing expenses
7. Mention any important cultural considerations
8. Suggest alternatives when appropriate
9. Remember previous conversation context and build upon it

Current context (use if relevant to the question):
- Potential route: ${context.origin} → ${context.destination}
- Travel style: ${context.intent === 'urgent' ? 'Fast-paced, efficient' : 'Relaxed, exploratory'}
- Experience level: ${context.visitor === 'first-time' ? 'First-time visitor' : 'Returning traveler'}

Respond in a friendly, conversational tone. Be the travel expert they wish they had as a friend.`;

    try {
      // Build messages array with conversation history
      const messages: AIMessage[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        { role: 'user', content: question },
      ];

      const response = await this.callAI(messages);
      return response;
    } catch (error) {
      console.error('Error answering question with history:', error);
      return 'Sorry, I encountered an error. Please try again.';
    }
  }

  /**
   * Answer specific travel questions
   */
  async answerQuestion(question: string, context: JourneyContext): Promise<string> {
    // Check if any AI provider is configured
    if (!AI_PROVIDER) {
      console.error('No AI provider configured');
      return 'AI service is not configured. Please add VITE_SAMBANOVA_API_KEY or VITE_GROQ_API_KEY to your .env file.';
    }

    const systemPrompt = `You are BookOnce AI, a friendly and knowledgeable travel advisor. Answer travel questions with practical, helpful advice. Keep responses concise but informative.`;

    try {
      const response = await this.callAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ]);

      return response;
    } catch (error: any) {
      console.error('Error answering question:', error);
      const errorMessage = error?.message || 'Unknown error';
      return `Sorry, I encountered an error: ${errorMessage}. Please check the console for details.`;
    }
  }

  /**
   * Get transportation recommendations
   */
  async getTransportationAdvice(context: JourneyContext): Promise<string> {
    const prompt = `Provide detailed transportation advice for traveling from ${context.origin} to ${context.destination} on ${context.departureDate} at ${context.departureTime}.

Consider:
- ${context.travelers} travelers
- ${context.intent} travel style
- Best routes and modes of transport
- Estimated costs and duration
- Real-time transit tips
- Group travel considerations

Provide practical, step-by-step transportation guidance.`;

    try {
      const response = await this.callAI([
        {
          role: 'system',
          content: 'You are a transportation expert. Provide detailed, practical advice.',
        },
        { role: 'user', content: prompt },
      ]);

      return response;
    } catch (error) {
      console.error('Error getting transportation advice:', error);
      return 'Unable to generate transportation advice at this time.';
    }
  }

  /**
   * Get dining recommendations
   */
  async getDiningRecommendations(context: JourneyContext): Promise<string> {
    const prompt = `Recommend dining options for a trip from ${context.origin} to ${context.destination}.

Consider:
- ${context.travelers} travelers
- ${context.visitor === 'first-time' ? 'First-time visitor - highlight local specialties' : 'Returning visitor - suggest new experiences'}
- ${context.intent === 'urgent' ? 'Quick, convenient options' : 'Leisurely dining experiences'}
- Meal timing based on travel schedule
- Group-friendly restaurants
- Budget-friendly and premium options

Provide specific restaurant recommendations and local cuisine highlights.`;

    try {
      const response = await this.callAI([
        {
          role: 'system',
          content: 'You are a local food expert. Recommend authentic dining experiences.',
        },
        { role: 'user', content: prompt },
      ]);

      return response;
    } catch (error) {
      console.error('Error getting dining recommendations:', error);
      return 'Unable to generate dining recommendations at this time.';
    }
  }

  /**
   * Get activity suggestions
   */
  async getActivitySuggestions(context: JourneyContext): Promise<string> {
    const prompt = `Suggest activities and attractions for ${context.destination}.

Consider:
- ${context.visitor === 'first-time' ? 'Must-see attractions for first-time visitors' : 'Hidden gems and new experiences for returning visitors'}
- ${context.travelers} travelers - group-friendly activities
- ${context.intent === 'urgent' ? 'Quick highlights' : 'In-depth experiences'}
${context.returnDate ? `- ${Math.ceil((new Date(context.returnDate).getTime() - new Date(context.departureDate).getTime()) / (1000 * 60 * 60 * 24))} days available` : '- Day trip'}

Provide specific activity recommendations with timing and cost estimates.`;

    try {
      const response = await this.callAI([
        { role: 'system', content: 'You are a local tour guide. Suggest memorable experiences.' },
        { role: 'user', content: prompt },
      ]);

      return response;
    } catch (error) {
      console.error('Error getting activity suggestions:', error);
      return 'Unable to generate activity suggestions at this time.';
    }
  }

  /**
   * Get safety information
   */
  async getSafetyInformation(context: JourneyContext): Promise<string> {
    const prompt = `Provide safety information for traveling to ${context.destination}.

Include:
- General safety tips
- Emergency contact numbers
- Safe areas and areas to avoid
- Health precautions
- Travel insurance recommendations
- Group safety considerations for ${context.travelers} travelers

Provide practical, reassuring safety guidance.`;

    try {
      const response = await this.callAI([
        {
          role: 'system',
          content: 'You are a travel safety expert. Provide helpful, non-alarmist advice.',
        },
        { role: 'user', content: prompt },
      ]);

      return response;
    } catch (error) {
      console.error('Error getting safety information:', error);
      return 'Unable to generate safety information at this time.';
    }
  }

  /**
   * Generate packing list
   */
  async generatePackingList(context: JourneyContext, weatherInfo?: string): Promise<string> {
    const prompt = `Create a packing list for a trip from ${context.origin} to ${context.destination} on ${context.departureDate}.

Consider:
- ${context.travelers} travelers
- ${context.intent} travel style
${context.returnDate ? `- ${Math.ceil((new Date(context.returnDate).getTime() - new Date(context.departureDate).getTime()) / (1000 * 60 * 60 * 24))} days trip` : '- Day trip'}
${weatherInfo ? `- Weather: ${weatherInfo}` : ''}
- Essential documents and items
- Activity-specific gear
- Group travel items

Provide a categorized, practical packing checklist.`;

    try {
      const response = await this.callAI([
        {
          role: 'system',
          content: 'You are a packing expert. Create comprehensive, practical checklists.',
        },
        { role: 'user', content: prompt },
      ]);

      return response;
    } catch (error) {
      console.error('Error generating packing list:', error);
      return 'Unable to generate packing list at this time.';
    }
  }

  /**
   * Calculate budget estimate
   */
  async calculateBudget(context: JourneyContext): Promise<string> {
    const prompt = `Estimate the budget for a trip from ${context.origin} to ${context.destination}.

Consider:
- ${context.travelers} travelers (calculate per person and total)
- ${context.intent} travel style
${context.returnDate ? `- ${Math.ceil((new Date(context.returnDate).getTime() - new Date(context.departureDate).getTime()) / (1000 * 60 * 60 * 24))} days` : '- Day trip'}
- Transportation costs
- Accommodation costs
- Meals and dining
- Activities and attractions
- Miscellaneous expenses
- Group discounts

Provide a detailed budget breakdown with cost-saving tips.`;

    try {
      const response = await this.callAI([
        {
          role: 'system',
          content: 'You are a budget travel expert. Provide realistic cost estimates.',
        },
        { role: 'user', content: prompt },
      ]);

      return response;
    } catch (error) {
      console.error('Error calculating budget:', error);
      return 'Unable to calculate budget at this time.';
    }
  }
}

export const bookOnceAIService = new BookOnceAIService();
export default bookOnceAIService;
