import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRequestBody } from '../src/llm-bridge/request.mjs';
import { createHandler, resetSessions } from '../src/llm-bridge/index.mjs';

/**
 * Regression coverage for the voice-upload incident.
 *
 * The deployed API was rejecting turns with:
 *   Missing audio file (expected multipart field "audio")
 * even though the browser sent a multipart body. These tests pin the parser to
 * the EXACT shape API Gateway delivers, and prove the failure signature is
 * visible in the safe diagnostics.
 */

const BOUNDARY = '----WebKitFormBoundary7MA4YWxkTrZu0gW';

const ENV = {
  ELEVENLABS_API_KEY: 'sk_test',
  ELEVENLABS_VOICE_ID: 'voice-123',
  LLM_PROVIDER: 'gemini',
  GEMINI_API_KEY: 'test-key',
  ALLOWED_ORIGIN: '*',
};

/** Build a browser-style multipart body (CRLF framing, quoted filenames). */
function browserMultipartBody({
  audio = null,
  boundary = BOUNDARY,
  filename = 'audio.webm',
  mimeType = 'audio/webm;codecs=opus',
  fields = {},
} = {}) {
  const parts = [];
  for (const [name, value] of Object.entries(fields)) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`,
      ),
    );
  }
  if (audio) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="audio"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`,
      ),
    );
    parts.push(Buffer.from(audio));
    parts.push(Buffer.from('\r\n'));
  }
  parts.push(Buffer.from(`--${boundary}--\r\n`));
  return Buffer.concat(parts);
}

/**
 * What API Gateway sends when BinaryMediaTypes matches multipart/form-data:
 * base64-encoded body plus isBase64Encoded: true.
 */
function apiGatewayMultipartEvent(body, boundary = BOUNDARY) {
  return {
    httpMethod: 'POST',
    path: '/voice',
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
    isBase64Encoded: true,
    body: body.toString('base64'),
  };
}

/** Real OPUS-in-WebM payloads are binary; make sure nothing assumes UTF-8. */
function fakeOpusBytes(n = 4096) {
  const buf = Buffer.alloc(n);
  for (let i = 0; i < n; i++) buf[i] = (i * 131 + 17) & 0xff;
  return buf;
}

test('parseRequestBody returns non-empty audio for a realistic API Gateway multipart event', async () => {
  const audio = fakeOpusBytes();
  const event = apiGatewayMultipartEvent(
    browserMultipartBody({ audio, fields: { sessionId: 's-real', lessonTitle: 'S3 keys' } }),
  );

  const parsed = await parseRequestBody(event);

  assert.ok(parsed.audio, 'audio must be present');
  assert.equal(parsed.audio.length, audio.length);
  assert.ok(parsed.audio.equals(audio), 'binary bytes must survive base64 transport intact');
  assert.equal(parsed.fields.sessionId, 's-real');
  assert.equal(parsed.fields.lessonTitle, 'S3 keys');

  assert.equal(parsed.meta.transport, 'multipart');
  assert.equal(parsed.meta.isBase64Encoded, true);
  assert.ok(parsed.meta.rawBodyChars > audio.length, 'raw body carries base64 + framing');
  assert.ok(parsed.meta.decodedBytes > audio.length, 'decoded buffer includes multipart framing');
  assert.equal(parsed.meta.audioBytes, audio.length);
  assert.equal(parsed.meta.files.length, 1);
  assert.equal(parsed.meta.files[0].name, 'audio');
  assert.match(parsed.meta.files[0].mimeType, /^audio\/webm/);
  assert.ok(parsed.meta.fieldNames.includes('sessionId'));
});

test('diagnostics object is metadata-only (never the payload)', async () => {
  const event = apiGatewayMultipartEvent(
    browserMultipartBody({ audio: fakeOpusBytes(64), fields: { sessionId: 's' } }),
  );
  const { meta } = await parseRequestBody(event);

  assert.deepEqual(Object.keys(meta).sort(), [
    'audioBytes',
    'contentType',
    'decodedBytes',
    'fieldNames',
    'files',
    'isBase64Encoded',
    'rawBodyChars',
    'transport',
  ]);
  const serialized = JSON.stringify(meta);
  assert.doesNotMatch(serialized, /audio\.webm|Content-Disposition|WebKitFormBoundary/);
});

test('an intro-shaped multipart turn (no audio) shows the exact failure signature', async () => {
  const event = apiGatewayMultipartEvent(
    browserMultipartBody({ fields: { intro: 'true', lessonTitle: 'Probe' } }),
  );

  const parsed = await parseRequestBody(event);

  assert.equal(parsed.audio, null, 'no audio part -> no audio buffer');
  assert.equal(parsed.meta.audioBytes, 0);
  assert.deepEqual(parsed.meta.files, [], 'busboy saw no file field at all');
  assert.deepEqual(parsed.meta.fieldNames.sort(), ['intro', 'lessonTitle']);
});

test('non-base64 multipart bodies still parse ASCII-safe payloads', async () => {
  const audio = Buffer.from('plain-ascii-audio-bytes');
  const body = browserMultipartBody({ audio });
  const event = {
    ...apiGatewayMultipartEvent(body),
    isBase64Encoded: false,
    body: body.toString('latin1'),
  };

  const parsed = await parseRequestBody(event);
  assert.ok(parsed.audio && parsed.audio.equals(audio));
  assert.equal(parsed.meta.isBase64Encoded, false);
});

/**
 * Canary: if API Gateway ever stops base64-encoding multipart bodies, binary
 * audio is mangled by the UTF-8 round trip. This test documents that the
 * transport flag in the diagnostics is what distinguishes the two cases.
 */
test('binary audio does not survive a non-base64 UTF-8 transport (canary)', async () => {
  const audio = fakeOpusBytes();
  const body = browserMultipartBody({ audio });
  const event = {
    ...apiGatewayMultipartEvent(body),
    isBase64Encoded: false,
    body: body.toString('utf8'),
  };

  let parsed = null;
  let rejected = null;
  try {
    parsed = await parseRequestBody(event);
  } catch (error) {
    rejected = error;
  }

  if (parsed) {
    assert.ok(
      !parsed.audio || !parsed.audio.equals(audio),
      'mangled transport must not silently produce intact audio',
    );
  } else {
    assert.ok(rejected, 'must either corrupt or reject, never round-trip intact');
  }
});

function fakeProvider(text = 'ok') {
  return {
    name: 'fake',
    async generateTutorResponse() {
      return { text, toolCalls: [] };
    },
  };
}

function capturingLogger() {
  const lines = [];
  return {
    lines,
    log: (...args) => lines.push(args),
    error: (...args) => lines.push(args),
  };
}

/** STT + TTS stubs so no network is touched. */
function fakeFetch() {
  return async (url) => {
    if (String(url).includes('speech-to-text')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ text: 'hello' }),
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

test.beforeEach(() => resetSessions());

test('handler accepts a realistic multipart upload (non-empty audio reaches STT)', async () => {
  const handler = createHandler({
    fetchImpl: fakeFetch(),
    provider: fakeProvider('hi'),
    env: ENV,
    logger: { error() {}, log() {} },
  });

  const res = await handler(
    apiGatewayMultipartEvent(browserMultipartBody({ audio: fakeOpusBytes(256) })),
  );

  assert.equal(res.statusCode, 200);
  assert.equal(JSON.parse(res.body).transcript, 'hello');
});

test('handler never routes an intro-shaped multipart turn into the audio branch', async () => {
  let llmCalls = 0;
  const handler = createHandler({
    fetchImpl: fakeFetch(),
    provider: {
      name: 'fake',
      async generateTutorResponse() {
        llmCalls += 1;
        return { text: 'unused', toolCalls: [] };
      },
    },
    env: ENV,
    logger: { error() {}, log() {} },
  });

  const res = await handler(
    apiGatewayMultipartEvent(
      browserMultipartBody({ fields: { intro: 'true', lessonTitle: 'S3 keys' } }),
    ),
  );

  assert.equal(res.statusCode, 200, 'intro must not be a 400');
  assert.equal(llmCalls, 0, 'the templated intro never calls the LLM');
  assert.match(JSON.parse(res.body).response, /S3 keys/);
});

test('handler logs safe upload diagnostics when multipart carries no audio', async () => {
  const logger = capturingLogger();
  const handler = createHandler({
    fetchImpl: fakeFetch(),
    provider: fakeProvider(),
    env: ENV,
    logger,
  });

  const res = await handler(
    apiGatewayMultipartEvent(browserMultipartBody({ fields: { sessionId: 's-no-audio' } })),
  );

  assert.equal(res.statusCode, 400);
  assert.equal(JSON.parse(res.body).error.code, 'bad_request');

  const entry = logger.lines.find(([tag]) => String(tag).includes('no usable audio'));
  assert.ok(entry, 'the diagnosis must be logged');
  const meta = entry[1];
  assert.equal(meta.transport, 'multipart');
  assert.equal(meta.isBase64Encoded, true);
  assert.ok(meta.decodedBytes > 0, 'body arrived');
  assert.equal(meta.audioBytes, 0, 'but no audio was parsed');
  assert.deepEqual(meta.files, []);
  assert.equal('body' in meta, false, 'payload must never be logged');
});
