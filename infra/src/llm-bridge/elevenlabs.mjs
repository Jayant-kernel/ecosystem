import { ConfigError, TimeoutError, UpstreamError, BadRequestError } from './errors.mjs';

const STT_URL = 'https://api.elevenlabs.io/v1/speech-to-text';
const TTS_BASE_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

const MIME_EXTENSIONS = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/mp4': 'm4a',
  'audio/m4a': 'm4a',
  'audio/flac': 'flac',
};

const SUPPORTED_MIME_PREFIXES = ['audio/'];
const SUPPORTED_MIME_EXACT = ['video/webm', 'application/octet-stream'];

export function assertSupportedAudio(mimeType, byteLength) {
  if (!byteLength) throw new BadRequestError('Audio payload is empty');
  const type = (mimeType || '').split(';')[0].trim().toLowerCase();
  const supported =
    SUPPORTED_MIME_PREFIXES.some((p) => type.startsWith(p)) ||
    SUPPORTED_MIME_EXACT.includes(type);
  if (type && !supported) {
    throw new BadRequestError(`Unsupported audio format: ${type}`);
  }
}

export function extensionFor(mimeType) {
  const type = (mimeType || '').split(';')[0].trim().toLowerCase();
  return MIME_EXTENSIONS[type] || 'webm';
}

async function fetchWithTimeout(fetchImpl, url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new TimeoutError('ElevenLabs request timed out');
    }
    throw new UpstreamError('ElevenLabs', 0, error?.message);
  } finally {
    clearTimeout(timer);
  }
}

async function readErrorDetail(response) {
  try {
    const body = await response.text();
    return body.slice(0, 500);
  } catch {
    return '';
  }
}

/**
 * audio bytes -> transcript text.
 * Returns '' for silent/unintelligible audio (caller decides how to respond).
 */
export async function speechToText(audioBuffer, mimeType, options = {}) {
  const {
    apiKey = process.env.ELEVENLABS_API_KEY,
    modelId = process.env.STT_MODEL_ID || 'scribe_v2',
    fetchImpl = fetch,
    timeoutMs = 30000,
  } = options;

  if (!apiKey) throw new ConfigError('ELEVENLABS_API_KEY is not set');
  assertSupportedAudio(mimeType, audioBuffer?.length);

  const form = new FormData();
  const blob = new Blob([audioBuffer], { type: mimeType || 'audio/webm' });
  form.append('file', blob, `audio.${extensionFor(mimeType)}`);
  form.append('model_id', modelId);

  const response = await fetchWithTimeout(
    fetchImpl,
    STT_URL,
    { method: 'POST', headers: { 'xi-api-key': apiKey }, body: form },
    timeoutMs,
  );

  if (!response.ok) {
    throw new UpstreamError('ElevenLabs STT', response.status, await readErrorDetail(response));
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new UpstreamError('ElevenLabs STT', response.status, 'malformed JSON response');
  }

  if (typeof data?.text !== 'string') {
    throw new UpstreamError('ElevenLabs STT', response.status, 'missing text field');
  }

  return data.text.trim();
}

/**
 * response text -> audio bytes.
 */
export async function textToSpeech(text, options = {}) {
  const {
    apiKey = process.env.ELEVENLABS_API_KEY,
    voiceId = process.env.ELEVENLABS_VOICE_ID,
    modelId = process.env.TTS_MODEL_ID || 'eleven_flash_v2_5',
    fetchImpl = fetch,
    timeoutMs = 30000,
  } = options;

  if (!apiKey) throw new ConfigError('ELEVENLABS_API_KEY is not set');
  if (!voiceId) throw new ConfigError('ELEVENLABS_VOICE_ID is not set');
  if (!text || !text.trim()) throw new BadRequestError('Cannot synthesize empty text');

  const url = `${TTS_BASE_URL}/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`;
  const response = await fetchWithTimeout(
    fetchImpl,
    url,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'content-type': 'application/json',
        accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    },
    timeoutMs,
  );

  if (!response.ok) {
    throw new UpstreamError('ElevenLabs TTS', response.status, await readErrorDetail(response));
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length) {
    throw new UpstreamError('ElevenLabs TTS', response.status, 'empty audio response');
  }

  return {
    buffer,
    mimeType: response.headers?.get?.('content-type') || 'audio/mpeg',
  };
}
