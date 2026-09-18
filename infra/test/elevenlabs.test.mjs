import test from 'node:test';
import assert from 'node:assert/strict';
import { speechToText, textToSpeech, extensionFor } from '../src/llm-bridge/elevenlabs.mjs';
import { BadRequestError, ConfigError, UpstreamError } from '../src/llm-bridge/errors.mjs';

const AUDIO = Buffer.from([1, 2, 3, 4]);

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
    headers: { get: () => 'application/json' },
  };
}

test('STT sends the audio and model_id, and returns trimmed text', async () => {
  let captured;
  const fetchImpl = async (url, options) => {
    captured = { url, options };
    return jsonResponse({ text: '  hello world  ' });
  };

  const text = await speechToText(AUDIO, 'audio/webm', { apiKey: 'sk_test', fetchImpl });

  assert.equal(text, 'hello world');
  assert.equal(captured.url, 'https://api.elevenlabs.io/v1/speech-to-text');
  assert.equal(captured.options.headers['xi-api-key'], 'sk_test');
  assert.equal(captured.options.body.get('model_id'), 'scribe_v2');
  assert.ok(captured.options.body.get('file'));
});

test('STT returns empty string for silent audio (no throw)', async () => {
  const fetchImpl = async () => jsonResponse({ text: '' });
  const text = await speechToText(AUDIO, 'audio/webm', { apiKey: 'sk_test', fetchImpl });
  assert.equal(text, '');
});

test('STT rejects empty audio', async () => {
  await assert.rejects(
    () => speechToText(Buffer.alloc(0), 'audio/webm', { apiKey: 'sk_test', fetchImpl: async () => {} }),
    BadRequestError,
  );
});

test('STT rejects unsupported formats', async () => {
  await assert.rejects(
    () => speechToText(AUDIO, 'text/plain', { apiKey: 'sk_test', fetchImpl: async () => {} }),
    BadRequestError,
  );
});

test('STT requires an API key', async () => {
  await assert.rejects(
    () => speechToText(AUDIO, 'audio/webm', { apiKey: '', fetchImpl: async () => {} }),
    ConfigError,
  );
});

test('STT surfaces upstream failures', async () => {
  const fetchImpl = async () => jsonResponse({ detail: 'nope' }, 422);
  await assert.rejects(
    () => speechToText(AUDIO, 'audio/webm', { apiKey: 'sk_test', fetchImpl }),
    UpstreamError,
  );
});

test('STT surfaces malformed responses', async () => {
  const fetchImpl = async () => ({
    ok: true,
    status: 200,
    json: async () => { throw new Error('bad json'); },
    text: async () => 'not json',
    headers: { get: () => 'application/json' },
  });
  await assert.rejects(
    () => speechToText(AUDIO, 'audio/webm', { apiKey: 'sk_test', fetchImpl }),
    UpstreamError,
  );
});

test('TTS posts text and returns audio bytes', async () => {
  let captured;
  const audioBytes = new Uint8Array([9, 8, 7]).buffer;
  const fetchImpl = async (url, options) => {
    captured = { url, options };
    return {
      ok: true,
      status: 200,
      arrayBuffer: async () => audioBytes,
      headers: { get: () => 'audio/mpeg' },
    };
  };

  const result = await textToSpeech('hi there', {
    apiKey: 'sk_test',
    voiceId: 'voice123',
    fetchImpl,
  });

  assert.equal(result.buffer.length, 3);
  assert.equal(result.mimeType, 'audio/mpeg');
  assert.match(captured.url, /\/text-to-speech\/voice123/);
  assert.equal(JSON.parse(captured.options.body).model_id, 'eleven_flash_v2_5');
});

test('TTS requires a voice id', async () => {
  await assert.rejects(
    () => textToSpeech('hi', { apiKey: 'sk_test', voiceId: '', fetchImpl: async () => {} }),
    ConfigError,
  );
});

test('TTS rejects upstream errors and empty audio', async () => {
  await assert.rejects(
    () => textToSpeech('hi', {
      apiKey: 'sk_test',
      voiceId: 'v',
      fetchImpl: async () => ({ ok: false, status: 500, text: async () => 'boom' }),
    }),
    UpstreamError,
  );

  await assert.rejects(
    () => textToSpeech('hi', {
      apiKey: 'sk_test',
      voiceId: 'v',
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        arrayBuffer: async () => new ArrayBuffer(0),
        headers: { get: () => 'audio/mpeg' },
      }),
    }),
    UpstreamError,
  );
});

test('extensionFor maps common mime types', () => {
  assert.equal(extensionFor('audio/webm;codecs=opus'), 'webm');
  assert.equal(extensionFor('audio/mpeg'), 'mp3');
  assert.equal(extensionFor('audio/wav'), 'wav');
  assert.equal(extensionFor('weird/type'), 'webm');
});
