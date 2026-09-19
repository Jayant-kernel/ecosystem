import { Readable } from 'node:stream';
import Busboy from 'busboy';
import { BadRequestError } from './errors.mjs';

export const DEFAULT_MAX_BYTES = 8 * 1024 * 1024; // API Gateway caps requests at 10 MB.

export function header(event, name) {
  const headers = event?.headers || {};
  const lower = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lower) return value;
  }
  return undefined;
}

export function toBuffer(event) {
  const raw = event?.body || '';
  return event?.isBase64Encoded
    ? Buffer.from(raw, 'base64')
    : Buffer.from(raw, 'utf8');
}

function parseMultipart(buffer, contentType, meta) {
  return new Promise((resolve, reject) => {
    let parser;
    try {
      parser = Busboy({ headers: { 'content-type': contentType } });
    } catch (error) {
      reject(new BadRequestError(`Invalid multipart body: ${error.message}`));
      return;
    }

    let audio = null;
    let mimeType = 'audio/webm';
    const fields = {};

    parser.on('file', (name, stream, info) => {
      // TEMPORARY diagnostics: field name, MIME type and byte counts only.
      // Never the file contents.
      if (meta?.files) {
        meta.files.push({ name, mimeType: info?.mimeType || null });
      }
      if (name !== 'audio' && name !== 'file') {
        stream.resume();
        return;
      }
      mimeType = info?.mimeType || mimeType;
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => {
        audio = Buffer.concat(chunks);
        if (meta) meta.audioBytes = audio.length;
      });
      stream.on('error', reject);
    });

    parser.on('field', (name, value) => {
      if (meta?.fieldNames) meta.fieldNames.push(name);
      fields[name] = value;
    });

    parser.on('error', (error) => reject(new BadRequestError(error.message)));
    parser.on('close', () => resolve({ audio, mimeType, fields }));

    Readable.from(buffer).pipe(parser);
  });
}

/**
 * Accepts multipart/form-data (preferred) or an application/json fallback with
 * a base64 `audio` field. Returns a normalized { audio, mimeType, fields }.
 */
export async function parseRequestBody(event, options = {}) {
  const { maxBytes = DEFAULT_MAX_BYTES } = options;
  const contentType = (header(event, 'content-type') || '').toLowerCase();
  const buffer = toBuffer(event);

  // TEMPORARY diagnostics for the voice-upload incident. Safe by construction:
  // content type, booleans and byte COUNTS only. This object never carries the
  // request body, audio bytes, headers or credentials.
  const meta = {
    contentType: contentType || '(none)',
    isBase64Encoded: Boolean(event?.isBase64Encoded),
    rawBodyChars: typeof event?.body === 'string' ? event.body.length : 0,
    decodedBytes: buffer.length,
    transport: contentType.includes('multipart/form-data') ? 'multipart' : 'json',
    files: [],
    fieldNames: [],
    audioBytes: 0,
  };

  if (buffer.length > maxBytes) {
    throw new BadRequestError(`Audio exceeds the ${Math.round(maxBytes / 1024 / 1024)}MB limit`);
  }

  if (contentType.includes('multipart/form-data')) {
    const parsed = await parseMultipart(buffer, header(event, 'content-type'), meta);
    if (parsed.audio) meta.audioBytes = parsed.audio.length;
    return { ...parsed, meta };
  }

  let json;
  try {
    json = buffer.length ? JSON.parse(buffer.toString('utf8')) : {};
  } catch {
    throw new BadRequestError('Request body is not valid JSON');
  }

  const audio = typeof json.audio === 'string' ? Buffer.from(json.audio, 'base64') : null;
  meta.fieldNames = Object.keys(json);
  meta.audioBytes = audio ? audio.length : 0;

  return {
    audio,
    mimeType: json.mimeType || 'audio/webm',
    fields: json,
    meta,
  };
}
