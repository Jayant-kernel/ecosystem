import test from 'node:test';
import assert from 'node:assert/strict';
import { textToSpeech } from '../src/llm-bridge/tts.mjs';
import { ConfigError } from '../src/llm-bridge/errors.mjs';

test('TTS router uses Sarvam when TTS_PROVIDER=sarvam', async () => {
  let capturedUrl = '';
  const result = await textToSpeech('hi', {
    env: {
      TTS_PROVIDER: 'sarvam',
      SARVAM_API_KEY: 'sarvam_test',
      SARVAM_TTS_SPEAKER: 'shubh',
    },
    fetchImpl: async (url) => {
      capturedUrl = String(url);
      return {
        ok: true,
        status: 200,
        json: async () => ({ audios: [Buffer.from([8, 8]).toString('base64')] }),
        text: async () => '',
        headers: { get: () => 'application/json' },
      };
    },
  });

  assert.equal(capturedUrl, 'https://api.sarvam.ai/text-to-speech');
  assert.equal(result.mimeType, 'audio/mpeg');
  assert.deepEqual([...result.buffer], [8, 8]);
});

test('TTS router rejects unknown providers', async () => {
  await assert.rejects(
    () => textToSpeech('hi', { env: { TTS_PROVIDER: 'unknown' }, fetchImpl: async () => {} }),
    ConfigError,
  );
});
