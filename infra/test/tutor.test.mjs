import test from 'node:test';
import assert from 'node:assert/strict';
import { createProvider, generateTutorResponse, buildSystemPrompt } from '../src/llm-bridge/tutor.mjs';
import { normalizeHistory } from '../src/llm-bridge/tools.mjs';

test('createProvider defaults to gemini and honours LLM_PROVIDER=bedrock', () => {
  assert.equal(createProvider({}).name, 'gemini');
  assert.equal(createProvider({ LLM_PROVIDER: 'gemini' }).name, 'gemini');
  assert.equal(createProvider({ LLM_PROVIDER: 'bedrock' }).name, 'bedrock');
});

test('generateTutorResponse builds the system prompt and delegates to the provider', async () => {
  const provider = {
    name: 'fake',
    calls: [],
    async generateTutorResponse(request) {
      this.calls.push(request);
      return { text: 'ok', toolCalls: [] };
    },
  };

  const result = await generateTutorResponse({
    provider,
    transcript: 'what is an array',
    history: [{ role: 'user', content: 'hi' }],
    context: { lessonTitle: 'Arrays', editorCode: 'const a = []' },
  });

  assert.equal(result.text, 'ok');
  assert.equal(provider.calls.length, 1);
  assert.equal(provider.calls[0].transcript, 'what is an array');
  assert.match(provider.calls[0].system, /Arrays/);
  assert.match(provider.calls[0].system, /const a = \[\]/);
  assert.deepEqual(provider.calls[0].history, [{ role: 'user', content: 'hi' }]);
});

test('generateTutorResponse requires a provider', async () => {
  await assert.rejects(() => generateTutorResponse({ transcript: 'hi' }), /provider is required/i);
});

test('buildSystemPrompt carries lesson context and editor code', () => {
  const prompt = buildSystemPrompt({
    lessonTitle: 'Arrays',
    objectives: 'map, filter',
    aiMemory: 'beginner',
    editorCode: 'console.log(1)',
  });

  assert.match(prompt, /Arrays/);
  assert.match(prompt, /map, filter/);
  assert.match(prompt, /console\.log\(1\)/);
});

test('normalizeHistory drops leading assistant turns and merges same roles', () => {
  const history = normalizeHistory([
    { role: 'assistant', content: 'stale leading reply' },
    { role: 'user', content: 'first' },
    { role: 'user', content: 'second' },
    { role: 'assistant', content: 'reply' },
  ]);

  assert.deepEqual(history, [
    { role: 'user', text: 'first\nsecond' },
    { role: 'assistant', text: 'reply' },
  ]);
});
