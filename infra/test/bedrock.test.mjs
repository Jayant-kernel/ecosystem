import test from 'node:test';
import assert from 'node:assert/strict';
import { createBedrockProvider } from '../src/llm-bridge/providers/bedrock.mjs';

function fakeClient(responses) {
  const calls = [];
  return {
    calls,
    async send(command) {
      calls.push(command.input);
      const next = responses.shift();
      return typeof next === 'function' ? next(command.input) : next;
    },
  };
}

const textResponse = (text) => ({
  output: { message: { content: [{ text }] } },
  stopReason: 'end_turn',
});

const toolResponse = (name, input, id = 'tu-1') => ({
  output: { message: { content: [{ toolUse: { toolUseId: id, name, input } }] } },
  stopReason: 'tool_use',
});

test('bedrock: returns model text and no tool calls', async () => {
  const client = fakeClient([textResponse('Hello learner.')]);
  const provider = createBedrockProvider({}, { client });

  const result = await provider.generateTutorResponse({ system: 's', transcript: 'hi' });

  assert.equal(result.text, 'Hello learner.');
  assert.deepEqual(result.toolCalls, []);
  assert.equal(client.calls.length, 1);
});

test('bedrock: resolves a tool call then returns the following text', async () => {
  const client = fakeClient([
    toolResponse('writeCode', { code: 'const x = 1;' }),
    textResponse('Done.'),
  ]);
  const provider = createBedrockProvider({}, { client });

  const result = await provider.generateTutorResponse({ system: 's', transcript: 'show me' });

  assert.equal(result.text, 'Done.');
  assert.equal(result.toolCalls[0].name, 'writeCode');
  const secondMessages = client.calls[1].messages;
  assert.equal(secondMessages.at(-1).role, 'user');
  assert.ok(secondMessages.at(-1).content[0].toolResult);
});

test('bedrock: falls back to a phrase when only a tool call is emitted', async () => {
  const client = fakeClient([
    toolResponse('executeCode', {}),
    { output: { message: { content: [] } }, stopReason: 'end_turn' },
  ]);
  const provider = createBedrockProvider({}, { client });

  const result = await provider.generateTutorResponse({ system: 's', transcript: 'run it' });
  assert.match(result.text, /run your code/i);
});
