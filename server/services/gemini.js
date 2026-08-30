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
