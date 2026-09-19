import test from 'node:test';
import assert from 'node:assert/strict';
import { createOpenAIProvider, OPENAI_CHAT_URL, DEFAULT_OPENAI_MODEL } from '../src/llm-bridge/providers/openai.mjs';

test('openai posts to the OpenAI endpoint with the configured model', async () => {
  let captured;
  const provider = createOpenAIProvider(
    { OPENAI_API_KEY: 'sk-test', OPENAI_MODEL_ID: 'gpt-test' },
    { fetchImpl: async (url, options) => { captured = { url, options }; return { ok: true, json: async () => ({ choices: [{ message: { content: 'hello' } }] }) }; } },
  );
  const result = await provider.generateTutorResponse({ system: 's', transcript: 't', context: {}, tools: [] });
  assert.equal(result.text, 'hello');
  assert.equal(captured.url, OPENAI_CHAT_URL);
  assert.equal(JSON.parse(captured.options.body).model, 'gpt-test');
  assert.equal(DEFAULT_OPENAI_MODEL, 'gpt-4o-mini');
});

test('openai requires an API key', async () => {
  const provider = createOpenAIProvider({}, { fetchImpl: async () => { throw new Error('should not fetch'); } });
  await assert.rejects(() => provider.generateTutorResponse({ system: 's', transcript: 't', context: {}, tools: [] }), /OPENAI_API_KEY is not set/);
});
