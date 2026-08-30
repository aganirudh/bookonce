import { GoogleGenerativeAI } from '@google/generative-ai';

let client;

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini is not configured');
  }

  client ??= new GoogleGenerativeAI(apiKey);
  return client.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' });
}

export async function generateGeminiReply(message) {
  const result = await getModel().generateContent(message);
  const reply = result.response.text();

  if (!reply) {
    throw new Error('Gemini returned an empty response');
  }

  return reply;
}

export async function generateGeminiItinerary(message) {
  const structuredModel = getModel();
  const result = await structuredModel.generateContent({
    contents: [{ role: 'user', parts: [{ text: message }] }],
    generationConfig: { responseMimeType: 'application/json' },
  });
  const reply = result.response.text();

  if (!reply) {
    throw new Error('Gemini returned an empty response');
  }

  return reply;
}

export async function generateGeminiPreferences(text) {
  const prompt = `Interpret only the user's route optimization preferences. Return JSON only with this exact shape:
{"preset":"FASTEST"|"CHEAPEST"|"BALANCED"|"COMFORT"|null,"weights":{"timeWeight":number,"costWeight":number,"walkingWeight":number,"transfersWeight":number,"comfortWeight"?:number} optional,"constraints":{"maxCost"?:number,"maxDurationSeconds"?:number,"maxWalkingDistanceMeters"?:number,"maxTransfers"?:integer} optional}
Use a preset for a clear simple intent and custom non-negative weights for nuanced priorities. At least one weight must be positive. Only extract explicitly stated supported constraints. Never convert walking time to distance. Do not include routes, route facts, scores, recommendations, explanations, or any other keys.
User preference: ${JSON.stringify(text)}`;
  const result = await getModel().generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' },
  });
  const reply = result.response.text();
  if (!reply) throw new Error('Gemini returned an empty response');
  return reply;
}
