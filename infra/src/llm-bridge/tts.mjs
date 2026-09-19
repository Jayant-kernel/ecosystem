import { textToSpeech as elevenLabsTextToSpeech } from './elevenlabs.mjs';
import { textToSpeech as sarvamTextToSpeech } from './sarvam.mjs';
import { ConfigError } from './errors.mjs';

function normalizedProvider(value) {
  return String(value || 'elevenlabs').trim().toLowerCase();
}

export async function textToSpeech(text, options = {}) {
  const env = options.env || process.env;
  const provider = normalizedProvider(options.provider || env.TTS_PROVIDER);

  if (provider === 'elevenlabs' || provider === 'eleven_labs') {
    return elevenLabsTextToSpeech(text, {
      apiKey: options.apiKey || env.ELEVENLABS_API_KEY,
      voiceId: options.voiceId || env.ELEVENLABS_VOICE_ID,
      modelId: options.modelId || env.TTS_MODEL_ID || 'eleven_flash_v2_5',
      outputFormat: options.outputFormat || env.TTS_OUTPUT_FORMAT,
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs,
    });
  }

  if (provider === 'sarvam') {
    return sarvamTextToSpeech(text, {
      apiKey: options.apiKey || env.SARVAM_API_KEY,
      env,
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs,
    });
  }

  throw new ConfigError(`Unsupported TTS_PROVIDER: ${provider}`);
}
