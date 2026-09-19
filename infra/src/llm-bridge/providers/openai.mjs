import { createOpenAIChatProvider } from './openaiChat.mjs';

/** OpenAI's Chat Completions-compatible endpoint. */
export const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';
export const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';

export function createOpenAIProvider(env = process.env, deps = {}) {
  return createOpenAIChatProvider({
    vendor: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL_ID || DEFAULT_OPENAI_MODEL,
    keyError: 'OPENAI_API_KEY is not set',
    timeoutMs: Number(env.OPENAI_TIMEOUT_MS || 30000),
    fetchImpl: deps.fetchImpl,
  });
}
