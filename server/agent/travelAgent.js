import { randomUUID } from 'node:crypto';
import { geminiTools, getRegisteredTool } from './toolRegistry.js';
import { executeTool } from './toolExecutor.js';

export const MAX_TOOL_ROUNDS = 6;
export const MAX_TOOL_CALLS = 12;

export async function runTravelAgent(message, { model, executor = executeTool, requestId = randomUUID() }) {
  const chat = model.startChat({
    tools: geminiTools,
    systemInstruction: 'You are the BookOnce tool-assisted travel agent. Use only declared BookOnce tools for route, coordinate, weather, cost, optimization, compatibility, or replanning facts. Never invent missing facts. Explain tool results concisely.',
  });
  let next = message;
  const toolTrace = [];
  const data = {};
  let callCount = 0;
  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const result = await chat.sendMessage(next);
    const calls = result.response.functionCalls?.() ?? [];
    if (calls.length === 0) return { success: true, reply: result.response.text() || 'I could not produce a verified response.', toolTrace, data };
    if (callCount + calls.length > MAX_TOOL_CALLS) break;
    callCount += calls.length;
    const responses = [];
    for (const call of calls) {
      const registered = getRegisteredTool(call.name);
      const output = await executor(call.name, call.args, requestId);
      toolTrace.push({ tool: call.name, label: registered?.label ?? 'Unsupported action', status: output.success ? 'success' : 'failed' });
      if (output.success) data[call.name] = output.data;
      responses.push({ functionResponse: { name: call.name, response: output } });
    }
    next = responses;
  }
  return { success: false, error: 'The travel agent reached its tool limit.', toolTrace, data };
}
