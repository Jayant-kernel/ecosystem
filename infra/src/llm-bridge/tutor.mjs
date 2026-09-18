import { buildSystemPrompt } from './tools.mjs';
import { createGeminiProvider } from './providers/gemini.mjs';
import { createBedrockProvider } from './providers/bedrock.mjs';

export { buildSystemPrompt, TOOLS } from './tools.mjs';

/**
 * Provider factory. Switching the LLM is a single env var:
 *   LLM_PROVIDER=gemini  (default, temporary)
 *   LLM_PROVIDER=bedrock (Claude via Amazon Bedrock)
 *
 * Nothing outside this module knows which provider is in use.
 */
export function createProvider(env = process.env, deps = {}) {
  const name = String(env.LLM_PROVIDER || 'gemini').toLowerCase();
  if (name === 'bedrock') return createBedrockProvider(env, deps.bedrock || {});
  return createGeminiProvider(env, deps.gemini || {});
}

/**
 * Provider-agnostic entry point used by the /voice pipeline.
 * Returns `{ text, toolCalls }` where `text` is suitable for TTS.
 */
export async function generateTutorResponse({
  provider,
  transcript,
  history = [],
  context = {},
} = {}) {
  if (!provider) throw new Error('An LLM provider is required');
  return provider.generateTutorResponse({
    system: buildSystemPrompt(context),
    transcript,
    history,
    context,
  });
}
