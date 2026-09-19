import test from 'node:test';
import assert from 'node:assert/strict';
import { createGrokProvider, GROK_CHAT_URL } from '../src/llm-bridge/providers/grok.mjs';
import { ConfigError, UpstreamError } from '../src/llm-bridge/errors.mjs';

const ENV = { GROK_API_KEY: 'xai-test', GROK_MODEL_ID: 'grok-4-fast' };

const reply = (message, status = 200) => ({
  ok: true,
  status,
  json: async () => ({ choices: [{ message }] }),
  text: async () => '',
});

test('grok: posts to the xAI endpoint with bearer auth, the model and the tool schemas', async () => {
  let captured;
  const fetchImpl = async (url, options) => {
    captured = { url, options };
    return reply({ content: 'Hello there.' });
  };

  const provider = createGrokProvider(ENV, { fetchImpl });
  const result = await provider.generateTutorResponse({ system: 'SYS', transcript: 'hi', context: {} });

  assert.equal(result.text, 'Hello there.');
  assert.equal(captured.url, GROK_CHAT_URL);
  assert.equal(captured.options.headers.authorization, 'Bearer xai-test');

  const body = JSON.parse(captured.options.body);
  assert.equal(body.model, 'grok-4-fast');
  assert.equal(body.messages[0].role, 'system');
  assert.equal(body.max_tokens, 220, 'replies stay short: they are spoken aloud');
  assert.equal(body.tools[0].type, 'function');
  assert.ok(body.tools.some((tool) => tool.function.name === 'writeCode'));
});

test('grok: executes a tool call and feeds the result back in OpenAI tool format', async () => {
  const bodies = [];
  const fetchImpl = async (url, options) => {
    bodies.push(JSON.parse(options.body));
    if (bodies.length === 1) {
      return reply({
        content: '',
        tool_calls: [
          {
            id: 'c1',
            type: 'function',
            function: { name: 'writeCode', arguments: JSON.stringify({ code: 'const a = 1;' }) },
          },
        ],
      });
    }
    return reply({ content: 'I wrote that for you.' });
  };

  const provider = createGrokProvider(ENV, { fetchImpl });
  const result = await provider.generateTutorResponse({ system: 'SYS', transcript: 'show me', context: {} });

  assert.equal(result.toolCalls.length, 1);
  assert.equal(result.toolCalls[0].name, 'writeCode');
  assert.deepEqual(result.toolCalls[0].args, { code: 'const a = 1;' });
  assert.equal(result.text, 'I wrote that for you.');

  const second = bodies[1].messages;
  assert.ok(second.some((m) => m.role === 'assistant' && Array.isArray(m.tool_calls)));
  assert.ok(second.some((m) => m.role === 'tool' && m.tool_call_id === 'c1'));
});

test('grok: speaks a phrase when the model emits only a tool call', async () => {
  const fetchImpl = async () =>
    reply({
      content: '',
      tool_calls: [{ id: 'c1', type: 'function', function: { name: 'executeCode', arguments: '{}' } }],
    });

  const provider = createGrokProvider(ENV, { fetchImpl });
  const result = await provider.generateTutorResponse({ system: 'S', transcript: 't', context: {} });
  assert.match(result.text, /run your code/i);
});

test('grok: requires an API key', async () => {
  const provider = createGrokProvider({}, { fetchImpl: async () => reply({ content: 'x' }) });
  await assert.rejects(
    () => provider.generateTutorResponse({ system: 's', transcript: 't' }),
    ConfigError,
  );
});

test('grok: maps upstream failures to UpstreamError without leaking detail', async () => {
  const fetchImpl = async () => ({ ok: false, status: 429, text: async () => 'rate limited sk_secret' });
  const provider = createGrokProvider(ENV, { fetchImpl });
  await assert.rejects(
    () => provider.generateTutorResponse({ system: 's', transcript: 't' }),
    UpstreamError,
  );
});
