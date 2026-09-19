import { createOpenAIChatProvider } from './openaiChat.mjs';

/** Groq's OpenAI-compatible endpoint. */
export const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-20b';
export const DEFAULT_GROQ_FALLBACK_MODEL = 'openai/gpt-oss-20b';

/** Groq replies are spoken aloud, so they stay short even when visual tools are present. */
const MAX_TOKENS = 220;

/**
 * Groq provider. Same engine as every other OpenAI-compatible vendor, plus a
 * low reasoning effort so the tutor answers fast enough to speak.
 */
export function createGroqProvider(env = process.env, deps = {}) {
  return createOpenAIChatProvider({
    vendor: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKey: env.GROQ_API_KEY,
    model: env.GROQ_MODEL_ID || DEFAULT_GROQ_MODEL,
    keyError: 'GROQ_API_KEY is not set',
    timeoutMs: Number(env.GROQ_TIMEOUT_MS || 30000),
    extraBody: { reasoning_effort: env.GROQ_REASONING_EFFORT || 'low', max_tokens: MAX_TOKENS },
    fetchImpl: deps.fetchImpl,
  });
}
