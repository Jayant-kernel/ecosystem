import test from 'node:test';
import assert from 'node:assert/strict';
import { createGroqProvider, GROQ_CHAT_URL, DEFAULT_GROQ_MODEL } from '../src/llm-bridge/providers/groq.mjs';
import { ConfigError, UpstreamError } from '../src/llm-bridge/errors.mjs';

const ENV = { GROQ_API_KEY: 'gsk-test' };

const reply = (message, status = 200) => ({
  ok: true,
  status,
  json: async () => ({ choices: [{ message }] }),
  text: async () => '',
});

test('groq: posts to the Groq endpoint with bearer auth, the model and low reasoning effort', async () => {
  let captured;
  const fetchImpl = async (url, options) => {
    captured = { url, options };
    return reply({ content: 'Hello there.' });
  };

  const provider = createGroqProvider(ENV, { fetchImpl });
  const result = await provider.generateTutorResponse({ system: 'SYS', transcript: 'hi', context: {} });

  assert.equal(result.text, 'Hello there.');
  assert.equal(captured.url, GROQ_CHAT_URL);
  assert.equal(captured.options.headers.authorization, 'Bearer gsk-test');

  const body = JSON.parse(captured.options.body);
  assert.equal(body.model, DEFAULT_GROQ_MODEL);
  assert.equal(body.model, 'openai/gpt-oss-20b');
  assert.equal(body.reasoning_effort, 'low', 'low effort keeps spoken replies fast');
  assert.equal(body.max_tokens, 220);
  assert.ok(body.tools.some((tool) => tool.function.name === 'highlightLines'));
});

test('groq: speaks the text from the same turn instead of spending a second call', async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return reply({
      content: 'Let me write that for you.',
      tool_calls: [
        {
          id: 'c1',
          type: 'function',
          function: { name: 'writeCode', arguments: JSON.stringify({ code: 'const a = 1;' }) },
        },
      ],
    });
  };

  const provider = createGroqProvider(ENV, { fetchImpl });
  const result = await provider.generateTutorResponse({ system: 's', transcript: 't', context: {} });

  assert.equal(calls, 1, 'one LLM call per turn keeps us inside the rate limit');
  assert.equal(result.text, 'Let me write that for you.');
  assert.equal(result.toolCalls.length, 1);
  assert.equal(result.toolCalls[0].name, 'writeCode');
});

test('groq: fetches a follow-up only when the model emitted no speech', async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    if (calls === 1) {
      return reply({
        content: '',
        tool_calls: [
          { id: 'c1', type: 'function', function: { name: 'executeCode', arguments: '{}' } },
        ],
      });
    }
    return reply({ content: 'It printed 42.' });
  };

  const provider = createGroqProvider(ENV, { fetchImpl });
  const result = await provider.generateTutorResponse({ system: 's', transcript: 't', context: {} });

  assert.equal(calls, 2);
  assert.equal(result.text, 'It printed 42.');
});

test('groq: requires an API key', async () => {
  const provider = createGroqProvider({}, { fetchImpl: async () => reply({ content: 'x' }) });
  await assert.rejects(
    () => provider.generateTutorResponse({ system: 's', transcript: 't' }),
    ConfigError,
  );
});

test('groq: maps a rate limit to UpstreamError without leaking detail', async () => {
  const fetchImpl = async () => ({ ok: false, status: 429, text: async () => 'rate limited gsk_secret' });
  const provider = createGroqProvider(ENV, { fetchImpl });
  await assert.rejects(
    () => provider.generateTutorResponse({ system: 's', transcript: 't' }),
    UpstreamError,
  );
});
