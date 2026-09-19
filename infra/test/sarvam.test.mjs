import test from 'node:test';
import assert from 'node:assert/strict';
import { textToSpeech } from '../src/llm-bridge/sarvam.mjs';
import { ConfigError, UpstreamError } from '../src/llm-bridge/errors.mjs';

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
    headers: { get: () => 'application/json' },
  };
}

test('Sarvam TTS posts male voice settings and decodes base64 audio', async () => {
  let captured;
  const audio = Buffer.from([4, 5, 6]).toString('base64');
  const fetchImpl = async (url, options) => {
    captured = { url, options };
    return jsonResponse({ request_id: 'req-1', audios: [audio] });
  };

  const result = await textToSpeech('hello learner', {
    apiKey: 'sarvam_test',
    fetchImpl,
    env: {
      SARVAM_TTS_MODEL: 'bulbul:v3',
      SARVAM_TTS_SPEAKER: 'shubh',
      SARVAM_TTS_LANGUAGE_CODE: 'en-IN',
      SARVAM_TTS_OUTPUT_AUDIO_CODEC: 'mp3',
      SARVAM_TTS_SAMPLE_RATE: '24000',
      SARVAM_TTS_PACE: '0.98',
      SARVAM_TTS_TEMPERATURE: '0.6',
    },
  });

  assert.equal(captured.url, 'https://api.sarvam.ai/text-to-speech');
  assert.equal(captured.options.headers['api-subscription-key'], 'sarvam_test');
  const sent = JSON.parse(captured.options.body);
  assert.equal(sent.model, 'bulbul:v3');
  assert.equal(sent.speaker, 'shubh');
  assert.equal(sent.language_code, 'en-IN');
  assert.equal(sent.output_audio_codec, 'mp3');
  assert.equal(sent.pace, 0.98);
  assert.equal(result.mimeType, 'audio/mpeg');
  assert.deepEqual([...result.buffer], [4, 5, 6]);
});

test('Sarvam TTS requires an API key', async () => {
  await assert.rejects(
    () => textToSpeech('hi', { apiKey: '', fetchImpl: async () => {}, env: {} }),
    ConfigError,
  );
});

test('Sarvam TTS surfaces upstream and malformed responses', async () => {
  await assert.rejects(
    () => textToSpeech('hi', {
      apiKey: 'sarvam_test',
      fetchImpl: async () => jsonResponse({ error: { message: 'bad speaker' } }, 422),
      env: {},
    }),
    UpstreamError,
  );

  await assert.rejects(
    () => textToSpeech('hi', {
      apiKey: 'sarvam_test',
      fetchImpl: async () => jsonResponse({ audio: 'not-the-field' }),
      env: {},
    }),
    UpstreamError,
  );
});
