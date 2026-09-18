import test from 'node:test';
import assert from 'node:assert/strict';
import { runTutor, buildSystemPrompt } from '../src/llm-bridge/tutor.mjs';

function mockClient(responses) {
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

test('returns model text and no tool calls for a plain answer', async () => {
  const client = mockClient([textResponse('A closure captures its scope.')]);
  const result = await runTutor({ client, transcript: 'what is a closure' });

  assert.equal(result.text, 'A closure captures its scope.');
  assert.deepEqual(result.toolCalls, []);
  assert.equal(client.calls.length, 1);
});

test('resolves a tool call then returns the following spoken text', async () => {
  const client = mockClient([
    toolResponse('writeCode', { code: 'const x = 1;' }),
    textResponse("I've written an example to your editor."),
  ]);

  const result = await runTutor({ client, transcript: 'show me a variable' });

  assert.equal(result.text, "I've written an example to your editor.");
  assert.equal(result.toolCalls.length, 1);
  assert.equal(result.toolCalls[0].name, 'writeCode');
  assert.deepEqual(result.toolCalls[0].args, { code: 'const x = 1;' });

  // Second call must include the assistant toolUse + the tool result turn.
  const secondMessages = client.calls[1].messages;
  assert.equal(secondMessages.at(-2).role, 'assistant');
  assert.equal(secondMessages.at(-1).role, 'user');
  assert.ok(secondMessages.at(-1).content[0].toolResult);
});

test('uses a fallback phrase when the model only emits a tool call', async () => {
  const client = mockClient([
    toolResponse('executeCode', {}),
    { output: { message: { content: [] } }, stopReason: 'end_turn' },
  ]);

  const result = await runTutor({ client, transcript: 'run it' });
  assert.match(result.text, /run your code/i);
  assert.equal(result.toolCalls[0].name, 'executeCode');
});

test('history is normalized: leading assistant turns dropped, same roles merged', async () => {
  const client = mockClient([textResponse('ok')]);
  await runTutor({
    client,
    transcript: 'latest question',
    history: [
      { role: 'assistant', content: 'stale leading reply' },
      { role: 'user', content: 'first' },
      { role: 'user', content: 'second' },
      { role: 'assistant', content: 'reply' },
    ],
  });

  const messages = client.calls[0].messages;
  assert.equal(messages[0].role, 'user');
  assert.equal(messages[0].content[0].text, 'first\nsecond');
  assert.equal(messages.at(-1).content[0].text, 'latest question');
});

test('system prompt carries lesson context and editor code', () => {
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

test('system prompt carries the teaching playbook and its hard bans', () => {
  const prompt = buildSystemPrompt({});

  // The 8-step loop and the hint ladder must survive prompt edits.
  assert.match(prompt, /TEACHING LOOP/);
  assert.match(prompt, /HINT LADDER — NEVER OPEN WITH THE ANSWER/);
  assert.match(prompt, /LEXICON — THIS IS A HARD RULE/);
  assert.match(prompt, /Define every technical term the FIRST time/);

  // The three hard bans.
  assert.match(prompt, /two sigma/);
  assert.match(prompt, /learning-style matching/);
  assert.match(prompt, /learning pyramid/);

  // Listening still outranks the curriculum script.
  assert.match(prompt, /ANSWER THE LEARNER'S ACTUAL QUESTION/);
});
