import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler, resetSessions } from '../src/llm-bridge/index.mjs';

const ENV = {
  ELEVENLABS_API_KEY: 'sk_test',
  ELEVENLABS_VOICE_ID: 'voice-123',
  BEDROCK_MODEL_ID: 'anthropic.claude-3-haiku-20240307-v1:0',
  BEDROCK_REGION: 'ap-south-1',
  ALLOWED_ORIGIN: '*',
  SESSION_TTL_MS: '600000',
};

const silentLogger = { error() {} };

function jsonEvent(body) {
  return {
    httpMethod: 'POST',
    path: '/voice',
    headers: { 'content-type': 'application/json' },
    isBase64Encoded: false,
    body: JSON.stringify(body),
  };
}

function multipartEvent({ audio, sessionId, boundary = '----voiceboundary' }) {
  const parts = [
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="sessionId"\r\n\r\n${sessionId}\r\n`),
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="audio"; filename="a.webm"\r\nContent-Type: audio/webm\r\n\r\n`,
    ),
    Buffer.from(audio),
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ];
  return {
    httpMethod: 'POST',
    path: '/voice',
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
    isBase64Encoded: true,
    body: Buffer.concat(parts).toString('base64'),
  };
}

function sttFetch(text) {
  return async (url) => {
    if (url.includes('speech-to-text')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ text }),
        text: async () => '',
        headers: { get: () => 'application/json' },
      };
    }
    return {
      ok: true,
      status: 200,
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      headers: { get: () => 'audio/mpeg' },
    };
  };
}

function fakeBedrock(text = 'A closure captures its surrounding scope.') {
  return {
    calls: [],
    async send(command) {
      this.calls.push(command.input);
      return { output: { message: { content: [{ text }] } }, stopReason: 'end_turn' };
    },
  };
}

test.beforeEach(() => resetSessions());

test('full pipeline: audio in -> transcript + response + audio out', async () => {
  const bedrockClient = fakeBedrock();
  const handler = createHandler({
    fetchImpl: sttFetch('What is a closure?'),
    bedrockClient,
    env: ENV,
    logger: silentLogger,
  });

  const res = await handler(jsonEvent({ audio: Buffer.from('xyz').toString('base64'), sessionId: 's1' }));
  const body = JSON.parse(res.body);

  assert.equal(res.statusCode, 200);
  assert.equal(body.transcript, 'What is a closure?');
  assert.equal(body.response, 'A closure captures its surrounding scope.');
  assert.equal(body.audio, Buffer.from([1, 2, 3]).toString('base64'));
  assert.equal(body.audioMimeType, 'audio/mpeg');
  assert.equal(body.sessionId, 's1');
  assert.deepEqual(body.toolCalls, []);
});

test('accepts multipart/form-data uploads', async () => {
  const handler = createHandler({
    fetchImpl: sttFetch('hello from multipart'),
    bedrockClient: fakeBedrock('hi!'),
    env: ENV,
    logger: silentLogger,
  });

  const res = await handler(multipartEvent({ audio: Buffer.from([1, 2, 3, 4]), sessionId: 'm1' }));
  const body = JSON.parse(res.body);
  assert.equal(res.statusCode, 200);
  assert.equal(body.transcript, 'hello from multipart');
});

test('empty transcript short-circuits before Bedrock', async () => {
  const bedrockClient = fakeBedrock();
  const handler = createHandler({
    fetchImpl: sttFetch(''),
    bedrockClient,
    env: ENV,
    logger: silentLogger,
  });

  const res = await handler(jsonEvent({ audio: Buffer.from('a').toString('base64') }));
  const body = JSON.parse(res.body);
  assert.equal(res.statusCode, 200);
  assert.equal(body.transcript, '');
  assert.match(body.response, /didn't catch that/i);
  assert.equal(bedrockClient.calls.length, 0);
});

test('missing audio is a 400', async () => {
  const handler = createHandler({ fetchImpl: sttFetch('x'), bedrockClient: fakeBedrock(), env: ENV, logger: silentLogger });
  const res = await handler(jsonEvent({ sessionId: 's' }));
  assert.equal(res.statusCode, 400);
  assert.equal(JSON.parse(res.body).error.code, 'bad_request');
});

test('STT upstream failure maps to 502 without leaking detail', async () => {
  const fetchImpl = async (url) => {
    if (url.includes('speech-to-text')) {
      return { ok: false, status: 422, text: async () => 'internal detail sk_secret' };
    }
    return { ok: true, status: 200, arrayBuffer: async () => new ArrayBuffer(1), headers: { get: () => 'audio/mpeg' } };
  };
  const handler = createHandler({ fetchImpl, bedrockClient: fakeBedrock(), env: ENV, logger: silentLogger });

  const res = await handler(jsonEvent({ audio: Buffer.from('a').toString('base64') }));
  assert.equal(res.statusCode, 502);
  assert.doesNotMatch(res.body, /internal detail|sk_secret/);
});

test('missing voice id is a config error surfaced as 500', async () => {
  const handler = createHandler({
    fetchImpl: sttFetch('hi'),
    bedrockClient: fakeBedrock(),
    env: { ...ENV, ELEVENLABS_VOICE_ID: '' },
    logger: silentLogger,
  });
  const res = await handler(jsonEvent({ audio: Buffer.from('a').toString('base64') }));
  assert.equal(res.statusCode, 500);
  assert.equal(JSON.parse(res.body).error.code, 'config_error');
});

test('session context is reused across turns', async () => {
  const bedrockClient = fakeBedrock('ok');
  const handler = createHandler({
    fetchImpl: sttFetch('first question'),
    bedrockClient,
    env: ENV,
    logger: silentLogger,
  });

  await handler(jsonEvent({ audio: Buffer.from('a').toString('base64'), sessionId: 'ctx' }));
  await handler(jsonEvent({ audio: Buffer.from('a').toString('base64'), sessionId: 'ctx' }));

  const secondCallMessages = bedrockClient.calls[1].messages;
  assert.ok(secondCallMessages.some((m) => m.content?.[0]?.text === 'first question'));
});

test('GET /session issues an id, unknown routes 404, OPTIONS 204', async () => {
  const handler = createHandler({ fetchImpl: sttFetch('x'), bedrockClient: fakeBedrock(), env: ENV, logger: silentLogger, uuid: () => 'fixed-id' });

  const session = await handler({ httpMethod: 'GET', path: '/session', headers: {} });
  assert.equal(session.statusCode, 200);
  assert.equal(JSON.parse(session.body).sessionId, 'fixed-id');

  const missing = await handler({ httpMethod: 'GET', path: '/nope', headers: {} });
  assert.equal(missing.statusCode, 404);

  const preflight = await handler({ httpMethod: 'OPTIONS', path: '/voice', headers: {} });
  assert.equal(preflight.statusCode, 204);
});
