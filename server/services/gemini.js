import { GoogleGenerativeAI } from '@google/generative-ai';

let client;
let model;

function getModel() {
  if (model) {
    return model;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini is not configured');
  }

  client = new GoogleGenerativeAI(apiKey);
  model = client.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' },
  });

  return model;
}

export async function generateGeminiReply(message) {
  const result = await getModel().generateContent(message);
  const reply = result.response.text();

  if (!reply) {
    throw new Error('Gemini returned an empty response');
  }

  return reply;
}
