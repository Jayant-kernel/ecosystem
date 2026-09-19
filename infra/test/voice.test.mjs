import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler, resetSessions } from '../src/llm-bridge/index.mjs';

const ENV = {
  ELEVENLABS_API_KEY: 'sk_test',
  ELEVENLABS_VOICE_ID: 'voice-123',
  LLM_PROVIDER: 'gemini',
  GEMINI_API_KEY: 'test-key',
  GEMINI_MODEL_ID: 'gemini-2.5-flash',
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

function fakeProvider(text = 'A closure captures its surrounding scope.') {
  return {
    name: 'fake',
    calls: [],
    async generateTutorResponse(request) {
      this.calls.push(request);
      return { text, toolCalls: [] };
    },
  };
}

test.beforeEach(() => resetSessions());

test('full pipeline: audio in -> transcript + response + audio out', async () => {
  const provider = fakeProvider();
  const handler = createHandler({
    fetchImpl: sttFetch('What is a closure?'),
    provider,
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
  assert.equal(provider.calls.length, 1);
  assert.equal(provider.calls[0].transcript, 'What is a closure?');
});

test('accepts multipart/form-data uploads', async () => {
  const handler = createHandler({
    fetchImpl: sttFetch('hello from multipart'),
    provider: fakeProvider('hi!'),
    env: ENV,
    logger: silentLogger,
  });

  const res = await handler(multipartEvent({ audio: Buffer.from([1, 2, 3, 4]), sessionId: 'm1' }));
  const body = JSON.parse(res.body);
  assert.equal(res.statusCode, 200);
  assert.equal(body.transcript, 'hello from multipart');
});

test('empty transcript short-circuits before the LLM', async () => {
  const provider = fakeProvider();
  const handler = createHandler({
    fetchImpl: sttFetch(''),
    provider,
    env: ENV,
    logger: silentLogger,
  });

  const res = await handler(jsonEvent({ audio: Buffer.from('a').toString('base64') }));
  const body = JSON.parse(res.body);
  assert.equal(res.statusCode, 200);
  assert.equal(body.transcript, '');
  assert.match(body.response, /didn't catch that/i);
  assert.equal(provider.calls.length, 0);
});

test('missing audio is a 400', async () => {
  const handler = createHandler({ fetchImpl: sttFetch('x'), provider: fakeProvider(), env: ENV, logger: silentLogger });
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
  const handler = createHandler({ fetchImpl, provider: fakeProvider(), env: ENV, logger: silentLogger });

  const res = await handler(jsonEvent({ audio: Buffer.from('a').toString('base64') }));
  assert.equal(res.statusCode, 502);
  assert.doesNotMatch(res.body, /internal detail|sk_secret/);
});

test('missing voice id is a config error surfaced as 500', async () => {
  const handler = createHandler({
    fetchImpl: sttFetch('hi'),
    provider: fakeProvider(),
    env: { ...ENV, ELEVENLABS_VOICE_ID: '' },
    logger: silentLogger,
  });
  const res = await handler(jsonEvent({ audio: Buffer.from('a').toString('base64') }));
  assert.equal(res.statusCode, 500);
  assert.equal(JSON.parse(res.body).error.code, 'config_error');
});

test('session context is reused across turns', async () => {
  const provider = fakeProvider('ok');
  const handler = createHandler({
    fetchImpl: sttFetch('first question'),
    provider,
    env: ENV,
    logger: silentLogger,
  });

  await handler(jsonEvent({ audio: Buffer.from('a').toString('base64'), sessionId: 'ctx' }));
  await handler(jsonEvent({ audio: Buffer.from('a').toString('base64'), sessionId: 'ctx' }));

  const secondHistory = provider.calls[1].history;
  assert.ok(secondHistory.some((turn) => turn.content === 'first question'));
});

function introEvent(body) {
  return {
    httpMethod: 'POST',
    path: '/intro',
    headers: { 'content-type': 'application/json' },
    isBase64Encoded: false,
    body: JSON.stringify(body),
  };
}

test('POST /intro greets the chapter without audio', async () => {
  const provider = fakeProvider('Welcome to Variables! Want to understand it?');
  const handler = createHandler({
    fetchImpl: sttFetch('unused'),
    provider,
    env: ENV,
    logger: silentLogger,
  });

  const res = await handler(introEvent({ lessonTitle: 'Variables', moduleTitle: 'Basics', sessionId: 'intro-1' }));
  const body = JSON.parse(res.body);

  assert.equal(res.statusCode, 200);
  assert.equal(body.sessionId, 'intro-1');
  assert.equal(body.response, 'Welcome to Variables! Want to understand it?');
  assert.equal(body.audio, Buffer.from([1, 2, 3]).toString('base64'));
  assert.deepEqual(body.toolCalls, []);
  assert.equal(provider.calls.length, 1);
  assert.match(provider.calls[0].transcript, /Variables/);
  assert.match(provider.calls[0].transcript, /Basics/);
});

test('POST /intro requires a lesson title', async () => {
  const handler = createHandler({
    fetchImpl: sttFetch('unused'),
    provider: fakeProvider(),
    env: ENV,
    logger: silentLogger,
  });

  const res = await handler(introEvent({}));
  assert.equal(res.statusCode, 400);
  assert.equal(JSON.parse(res.body).error.code, 'bad_request');
});

test('POST /intro appends the chapter exchange to session history', async () => {
  const provider = fakeProvider('Hi there.');
  const handler = createHandler({
    fetchImpl: sttFetch('unused'),
    provider,
    env: ENV,
    logger: silentLogger,
  });

  await handler(introEvent({ lessonTitle: 'Loops', sessionId: 'intro-ctx' }));
  await handler(jsonEvent({ audio: Buffer.from('a').toString('base64'), sessionId: 'intro-ctx' }));

  const secondHistory = provider.calls[1].history;
  assert.ok(secondHistory.some((turn) => turn.content === '[Opened chapter: Loops]'));
  assert.ok(secondHistory.some((turn) => turn.content === 'Hi there.'));
});

test('GET /session issues an id, unknown routes 404, OPTIONS 204', async () => {
  const handler = createHandler({ fetchImpl: sttFetch('x'), provider: fakeProvider(), env: ENV, logger: silentLogger, uuid: () => 'fixed-id' });

  const session = await handler({ httpMethod: 'GET', path: '/session', headers: {} });
  assert.equal(session.statusCode, 200);
  assert.equal(JSON.parse(session.body).sessionId, 'fixed-id');

  const missing = await handler({ httpMethod: 'GET', path: '/nope', headers: {} });
  assert.equal(missing.statusCode, 404);

  const preflight = await handler({ httpMethod: 'OPTIONS', path: '/voice', headers: {} });
  assert.equal(preflight.statusCode, 204);
});
