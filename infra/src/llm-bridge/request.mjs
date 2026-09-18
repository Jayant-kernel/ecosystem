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

function parseMultipart(buffer, contentType) {
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
      if (name !== 'audio' && name !== 'file') {
        stream.resume();
        return;
      }
      mimeType = info?.mimeType || mimeType;
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => {
        audio = Buffer.concat(chunks);
      });
      stream.on('error', reject);
    });

    parser.on('field', (name, value) => {
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

  if (buffer.length > maxBytes) {
    throw new BadRequestError(`Audio exceeds the ${Math.round(maxBytes / 1024 / 1024)}MB limit`);
  }

  if (contentType.includes('multipart/form-data')) {
    return parseMultipart(buffer, header(event, 'content-type'));
  }

  let json;
  try {
    json = buffer.length ? JSON.parse(buffer.toString('utf8')) : {};
  } catch {
    throw new BadRequestError('Request body is not valid JSON');
  }

  return {
    audio: typeof json.audio === 'string' ? Buffer.from(json.audio, 'base64') : null,
    mimeType: json.mimeType || 'audio/webm',
    fields: json,
  };
}
