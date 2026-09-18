import test from 'node:test';
import assert from 'node:assert/strict';
import { createGeminiProvider } from '../src/llm-bridge/providers/gemini.mjs';
import { ConfigError, UpstreamError } from '../src/llm-bridge/errors.mjs';

function fakeClient(responses) {
  const calls = [];
  return {
    calls,
    models: {
      async generateContent(params) {
        calls.push(params);
        const next = responses.shift();
        return typeof next === 'function' ? next(params) : next;
      },
    },
  };
}

const textResponse = (text) => ({
  text,
  functionCalls: [],
  candidates: [{ content: { parts: [{ text }] } }],
});

const toolResponse = (name, args) => ({
  functionCalls: [{ name, args }],
  candidates: [{ content: { parts: [{ functionCall: { name, args } }] } }],
});

test('gemini: returns model text and no tool calls', async () => {
  const client = fakeClient([textResponse('A closure captures its scope.')]);
  const provider = createGeminiProvider({ GEMINI_MODEL_ID: 'gemini-2.5-flash' }, { client });

  const result = await provider.generateTutorResponse({
    system: 'be helpful',
    transcript: 'what is a closure',
  });

  assert.equal(result.text, 'A closure captures its scope.');
  assert.deepEqual(result.toolCalls, []);
  assert.equal(client.calls.length, 1);
  assert.equal(client.calls[0].model, 'gemini-2.5-flash');
  assert.equal(client.calls[0].config.systemInstruction, 'be helpful');
});

test('gemini: resolves a tool call then returns the following text', async () => {
  const client = fakeClient([
    toolResponse('writeCode', { code: 'const x = 1;' }),
    textResponse("I've written an example to your editor."),
  ]);
  const provider = createGeminiProvider({}, { client });

  const result = await provider.generateTutorResponse({
    system: 's',
    transcript: 'show me a variable',
  });

  assert.equal(result.text, "I've written an example to your editor.");
  assert.equal(result.toolCalls.length, 1);
  assert.equal(result.toolCalls[0].name, 'writeCode');

  const secondContents = client.calls[1].contents;
  const last = secondContents.at(-1);
  assert.equal(last.role, 'user');
  assert.ok(last.parts[0].functionResponse);
});

test('gemini: falls back to a phrase when only a tool call is emitted', async () => {
  const client = fakeClient([
    toolResponse('executeCode', {}),
    { text: '', functionCalls: [], candidates: [{ content: { parts: [] } }] },
  ]);
  const provider = createGeminiProvider({}, { client });

  const result = await provider.generateTutorResponse({ system: 's', transcript: 'run it' });
  assert.match(result.text, /run your code/i);
});

test('gemini: requires GEMINI_API_KEY when no client is injected', async () => {
  const provider = createGeminiProvider({}, {});
  await assert.rejects(
    () => provider.generateTutorResponse({ system: 's', transcript: 'hi' }),
    ConfigError,
  );
});

test('gemini: maps SDK failures to UpstreamError', async () => {
  const client = fakeClient([
    () => {
      const error = new Error('quota exceeded');
      error.status = 429;
      throw error;
    },
  ]);
  const provider = createGeminiProvider({}, { client });

  await assert.rejects(
    () => provider.generateTutorResponse({ system: 's', transcript: 'hi' }),
    UpstreamError,
  );
});
