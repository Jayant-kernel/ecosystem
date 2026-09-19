import { createOpenAIChatProvider } from './openaiChat.mjs';

/** xAI's Chat Completions endpoint (OpenAI-compatible). */
export const GROK_CHAT_URL = 'https://api.x.ai/v1/chat/completions';
export const DEFAULT_GROK_MODEL = 'grok-4-fast';

/**
 * Grok provider (xAI). A thin wrapper: same engine, tool schemas and tool loop
 * as every other OpenAI-compatible vendor.
 */
export function createGrokProvider(env = process.env, deps = {}) {
  return createOpenAIChatProvider({
    vendor: 'Grok',
    baseUrl: 'https://api.x.ai/v1',
    apiKey: env.GROK_API_KEY || env.XAI_API_KEY,
    model: env.GROK_MODEL_ID || DEFAULT_GROK_MODEL,
    keyError: 'GROK_API_KEY is not set',
    timeoutMs: Number(env.GROK_TIMEOUT_MS || 30000),
    fetchImpl: deps.fetchImpl,
  });
}
