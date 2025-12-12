/**
 * BookOnce AI Service
 * 
 * AI-powered travel advisor with SambaNova primary and Groq fallback
 * Provides intelligent recommendations for all aspects of travel
 */

import type { JourneyContext, AIRecommendations } from '../types/aiAdvisor';

// AI Provider Configuration
const SAMBANOVA_API_KEY = import.meta.env.VITE_SAMBANOVA_API_KEY;
const SAMBANOVA_MODEL = 'Meta-Llama-3.1-70B-Instruct';
const SAMBANOVA_API_URL = 'https://api.sambanova.ai/v1/chat/completions';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Debug: Log if API keys are loaded
console.log('🔑 AI Provider Status:');
if (SAMBANOVA_API_KEY) {
  console.log('  ✅ SambaNova API Key loaded:', SAMBANOVA_API_KEY.substring(0, 10) + '...');
} else {
  console.log('  ❌ SambaNova API Key NOT loaded');
}
if (GROQ_API_KEY) {
  console.log('  ✅ Groq API Key loaded:', GROQ_API_KEY.substring(0, 10) + '...');
} else {
  console.log('  ❌ Groq API Key NOT loaded');
}

const AI_PROVIDER = SAMBANOVA_API_KEY ? 'sambanova' : GROQ_API_KEY ? 'groq' : null;
console.log('  🤖 Primary Provider:', AI_PROVIDER || 'NONE');

type AIProvider = 'sambanova' | 'groq';

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

  /**
   * Call AI with automatic fallback
   */
  private async callAI(messages: AIMessage[]): Promise<string> {
    // Try SambaNova first
    if (this.currentProvider === 'sambanova' && SAMBANOVA_API_KEY) {
      try {
        return await this.callSambaNova(messages);
      } catch (error) {
        console.warn('⚠️ SambaNova failed, falling back to Groq:', error);
        this.currentProvider = 'groq';
      }
    }

    // Try Groq as fallback
    if (this.currentProvider === 'groq' && GROQ_API_KEY) {
      try {
        return await this.callGroq(messages);
      } catch (error) {
        console.error('❌ Groq also failed:', error);
        throw error;
      }
    }

    throw new Error('No AI provider configured. Please add VITE_SAMBANOVA_API_KEY or VITE_GROQ_API_KEY to your .env file');
  }

  /**
   * Call SambaNova API
   */
  private async callSambaNova(messages: AIMessage[]): Promise<string> {
    if (!SAMBANOVA_API_KEY) {
      throw new Error('SambaNova API key not configured');
    }

    try {
      console.log('🚀 Calling SambaNova API...');
      const response = await fetch(SAMBANOVA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SAMBANOVA_API_KEY}`,
        },
        body: JSON.stringify({
          model: SAMBANOVA_MODEL,
          messages,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('SambaNova API rate limit exceeded. Trying fallback...');
        }
        const errorText = await response.text();
        throw new Error(`SambaNova API error: ${response.statusText} - ${errorText}`);
      }

      const data: AIResponse = await response.json();
      console.log('✅ SambaNova response received');
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error calling SambaNova API:', error);
      throw error;
    }
  }

  /**
   * Call Groq API
   */
  private async callGroq(messages: AIMessage[]): Promise<string> {
    if (!GROQ_API_KEY) {
      throw new Error('Groq API key not configured');
    }

    try {
      console.log('🚀 Calling Groq API...');
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Groq API rate limit exceeded. Please wait a moment and try again.');
        }
        throw new Error(`Groq API error: ${response.statusText}`);
      }

      const data: AIResponse = await response.json();
      console.log('✅ Groq response received');
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error calling Groq API:', error);
      throw error;
    }
  }

  /**
   * Generate complete journey plan with timing calculations
   */
  async generateCompleteJourneyPlan(context: JourneyContext): Promise<string> {
    const systemPrompt = `You are BookOnce AI, an expert AI travel planner. Generate a complete door-to-door journey plan with precise timing calculations.

IMPORTANT: Calculate exact times for each segment based on the departure time: ${context.departureTime}

Your response must include:
1. OUTBOUND JOURNEY - Step-by-step route with exact times
2. RETURN JOURNEY - Complete return route (if round-trip)
3. STOPS & FOOD - Meal recommendations with timing
4. ACCOMMODATION - Hotel suggestions with check-in/out times

Format each segment clearly with:
- Mode of transport
- From → To locations
- Departure and arrival times
- Duration
- Distance
- Cost estimate
- Special notes

Be specific about timing - calculate when each segment starts and ends based on the ${context.departureTime} departure time.`;

    const userPrompt = `Create a complete journey plan:

FROM: ${context.origin}
TO: ${context.destination}
DATE: ${context.departureDate}
DEPARTURE TIME: ${context.departureTime}
${context.returnDate ? `RETURN DATE: ${context.returnDate}` : ''}
TRAVELERS: ${context.travelers}
STYLE: ${context.intent === 'urgent' ? 'Fast and efficient - minimize travel time' : 'Leisurely - comfortable and scenic'}
EXPERIENCE: ${context.visitor === 'first-time' ? 'First-time visitor - include must-see highlights' : 'Returning visitor - suggest new experiences'}

Generate a detailed plan with:

## OUTBOUND JOURNEY
[Calculate exact times starting from ${context.departureTime}]
- Walk from home to nearest transit
- Metro/Bus to major hub
- Flight/Train to destination (if needed)
- Local transport to final destination
- Walk to accommodation

## RETURN JOURNEY
${context.returnDate ? '[Calculate return journey with times]' : '[Not applicable - one-way trip]'}

## STOPS & FOOD
- Breakfast/Lunch/Dinner recommendations
- Timing based on journey schedule
- Local cuisine highlights
- Group-friendly options for ${context.travelers} people

## ACCOMMODATION
${context.returnDate ? `- Hotel recommendations
- Check-in time
- Number of rooms needed for ${context.travelers} travelers
- Cost estimates` : '[Not needed - day trip]'}

Be specific with times, costs, and practical details!`;

    try {
      const response = await this.callAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);

      return response;
    } catch (error) {
      console.error('Error generating journey plan:', error);
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
        { role: 'system', content: 'You are a transportation expert. Provide detailed, practical advice.' },
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
        { role: 'system', content: 'You are a local food expert. Recommend authentic dining experiences.' },
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
        { role: 'system', content: 'You are a travel safety expert. Provide helpful, non-alarmist advice.' },
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
        { role: 'system', content: 'You are a packing expert. Create comprehensive, practical checklists.' },
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
        { role: 'system', content: 'You are a budget travel expert. Provide realistic cost estimates.' },
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