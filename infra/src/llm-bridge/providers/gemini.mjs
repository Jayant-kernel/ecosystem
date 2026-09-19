import { GoogleGenAI } from '@google/genai';
import { ConfigError, UpstreamError } from '../errors.mjs';
import {
  TOOLS,
  MAX_TOOL_ITERATIONS,
  normalizeHistory,
  toolResultText,
  fallbackText,
} from '../tools.mjs';

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

const toGeminiContents = (history, transcript) => [
  ...normalizeHistory(history).map((turn) => ({
    role: turn.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: turn.text }],
  })),
  { role: 'user', parts: [{ text: transcript }] },
];

const functionDeclarationsFor = (tools) =>
  tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  }));

function textOf(response) {
  try {
    if (typeof response?.text === 'string' && response.text) return response.text;
  } catch {
    /* ignore */
  }
  const parts = response?.candidates?.[0]?.content?.parts || [];
  return parts
    .filter((part) => typeof part.text === 'string')
    .map((part) => part.text)
    .join('');
}

function callsOf(response) {
  if (Array.isArray(response?.functionCalls) && response.functionCalls.length) {
    return response.functionCalls;
  }
  const parts = response?.candidates?.[0]?.content?.parts || [];
  return parts.filter((part) => part.functionCall).map((part) => part.functionCall);
}

async function callGemini(ai, { model, contents, system, functionDeclarations }) {
  try {
    return await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: system,
        temperature: 0.4,
        maxOutputTokens: 512,
        tools: [{ functionDeclarations }],
      },
    });
  } catch (error) {
    const status = error?.status || error?.code || 0;
    throw new UpstreamError('Gemini', status, error?.message || error?.name);
  }
}

/**
 * Gemini LLM provider (temporary). Called only from the Lambda backend using
 * GEMINI_API_KEY — the key is never sent to the browser.
 */
export function createGeminiProvider(env = process.env, deps = {}) {
  const defaultModelId = env.GEMINI_MODEL_ID || DEFAULT_GEMINI_MODEL;
  let client = deps.client;

  const getClient = () => {
    if (!client) {
      const apiKey = env.GEMINI_API_KEY;
      if (!apiKey) throw new ConfigError('GEMINI_API_KEY is not set');
      client = new GoogleGenAI({ apiKey });
    }
    return client;
  };

  return {
    name: 'gemini',

    async generateTutorResponse({ system, transcript, history = [], context = {}, modelId, tools = TOOLS } = {}) {
      const model = modelId || defaultModelId;
      const functionDeclarations = functionDeclarationsFor(tools);
      const contents = toGeminiContents(history, transcript);
      const toolCalls = [];
      let text = '';

      for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
        const response = await callGemini(getClient(), { model, contents, system, functionDeclarations });

        const turnText = textOf(response);
        if (turnText) text += text ? `\n${turnText}` : turnText;

        const calls = callsOf(response);
        if (!calls.length) break;

        contents.push({
          role: 'model',
          parts: calls.map((call) => ({
            functionCall: { name: call.name, args: call.args || {} },
          })),
        });
        contents.push({
          role: 'user',
          parts: calls.map((call) => {
            toolCalls.push({ name: call.name, args: call.args || {} });
            return {
              functionResponse: {
                name: call.name,
                response: { result: toolResultText(call.name, call.args, context) },
              },
            };
          }),
        });
      }

      return { text: text.trim() || fallbackText(toolCalls), toolCalls };
    },
  };
}
