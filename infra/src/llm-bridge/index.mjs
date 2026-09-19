import { randomUUID } from 'node:crypto';
import { speechToText, textToSpeech } from './elevenlabs.mjs';
import { createProvider, generateTutorResponse } from './tutor.mjs';
import { parseRequestBody, header } from './request.mjs';
import { AppError, BadRequestError, redact } from './errors.mjs';

const EMPTY_TRANSCRIPT_REPLY = "Sorry, I didn't catch that. Could you say it again?";
const DEFAULT_SESSION_TTL_MS = 30 * 60 * 1000;
const MAX_SESSION_TURNS = 16;

// In-memory conversation context, scoped to a warm Lambda container.
// Swap for DynamoDB/ElastiCache for durable, multi-container sessions.
const sessions = new Map();

export function resetSessions() {
  sessions.clear();
}

function getSessionHistory(sessionId, ttlMs) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  if (Date.now() - session.updatedAt > ttlMs) {
    sessions.delete(sessionId);
    return null;
  }
  return session.turns;
}

function appendSessionTurn(sessionId, role, content, ttlMs) {
  const session = sessions.get(sessionId) || { turns: [], updatedAt: Date.now() };
  session.turns.push({ role, content });
  if (session.turns.length > MAX_SESSION_TURNS) {
    session.turns = session.turns.slice(-MAX_SESSION_TURNS);
  }
  session.updatedAt = Date.now();
  sessions.set(sessionId, session);
  // Opportunistic eviction so idle sessions do not accumulate.
  for (const [id, value] of sessions) {
    if (Date.now() - value.updatedAt > ttlMs) sessions.delete(id);
  }
}

function parseClientHistory(value) {
  if (!value) return [];
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function corsHeaders(origin) {
  return {
    'content-type': 'application/json',
    'access-control-allow-origin': origin,
    'access-control-allow-headers': 'Content-Type,Authorization',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
  };
}

function json(statusCode, body, origin) {
  return { statusCode, headers: corsHeaders(origin), body: JSON.stringify(body) };
}

function routeOf(event) {
  return {
    method: (event?.httpMethod || event?.requestContext?.http?.method || 'GET').toUpperCase(),
    path: event?.path || event?.requestContext?.http?.path || event?.resource || '',
  };
}

/**
 * The tutor's opening turn. It offers a choice instead of waiting for the learner
 * to work out what to ask. Built from a template rather than the LLM so it is
 * instant, free, and always on-brand.
 */
export function buildIntro(context = {}) {
  const title = context.lessonTitle || 'this lesson';
  const options =
    context.lessonMode === 'theory'
      ? 'Want me to explain the idea in plain words, or walk you through how the pieces fit together?'
      : 'Want a plain-English explanation, a walk through how it flows, or a live code demo I can run for you?';
  return `You're on ${title}. ${options} Just say which.`;
}

export function createHandler(deps = {}) {
  const {
    fetchImpl = fetch,
    provider,
    env = process.env,
    logger = console,
    uuid = () => randomUUID(),
  } = deps;

  let llmProvider = provider;
  const getProvider = () => llmProvider || (llmProvider = createProvider(env));

  async function handleVoice(event) {
    const origin = env.ALLOWED_ORIGIN || '*';
    const ttlMs = Number(env.SESSION_TTL_MS || DEFAULT_SESSION_TTL_MS);

    const { audio, mimeType, fields } = await parseRequestBody(event, {
      maxBytes: Number(env.MAX_AUDIO_BYTES) || undefined,
    });

    const sessionId = (typeof fields.sessionId === 'string' && fields.sessionId) || uuid();

    const context = {
      courseTitle: fields.courseTitle,
      lessonTitle: fields.lessonTitle,
      objectives: fields.objectives,
      aiMemory: fields.aiMemory,
      editorCode: fields.editorCode,
      lessonMode: fields.lessonMode,
      lessonGuide: fields.lessonGuide,
      lessonFlows: fields.lessonFlows,
      lessonTask: fields.lessonTask,
    };

    let transcript = '';
    let responseText = '';
    let toolCalls = [];

    // multipart sends "true" as a string; the JSON fallback sends a boolean.
    const isIntro = fields.intro === true || fields.intro === 'true';

    if (isIntro) {
      // The tutor opens the conversation; no audio from the learner yet.
      responseText = buildIntro(context);
    } else {
      if (!audio || !audio.length) {
        throw new BadRequestError('Missing audio file (expected multipart field "audio")');
      }

      transcript = await speechToText(audio, mimeType, {
        apiKey: env.ELEVENLABS_API_KEY,
        modelId: env.STT_MODEL_ID || 'scribe_v2',
        fetchImpl,
      });

      if (!transcript) {
        responseText = EMPTY_TRANSCRIPT_REPLY;
      } else {
        const history = getSessionHistory(sessionId, ttlMs) || parseClientHistory(fields.history);

        const result = await generateTutorResponse({
          provider: getProvider(),
          transcript,
          history,
          context,
        });

        responseText = result.text;
        toolCalls = result.toolCalls;
        appendSessionTurn(sessionId, 'user', transcript, ttlMs);
        appendSessionTurn(sessionId, 'assistant', responseText, ttlMs);
      }
    }

    const audioOut = await textToSpeech(responseText, {
      apiKey: env.ELEVENLABS_API_KEY,
      voiceId: env.ELEVENLABS_VOICE_ID,
      modelId: env.TTS_MODEL_ID || 'eleven_flash_v2_5',
      fetchImpl,
    });

    return json(
      200,
      {
        sessionId,
        transcript,
        response: responseText,
        audio: audioOut.buffer.toString('base64'),
        audioMimeType: audioOut.mimeType,
        audioEncoding: 'base64',
        toolCalls,
      },
      origin,
    );
  }

  return async function handler(event) {
    const origin = env.ALLOWED_ORIGIN || '*';
    const { method, path } = routeOf(event);

    if (method === 'OPTIONS') {
      return { statusCode: 204, headers: corsHeaders(origin), body: '' };
    }

    try {
      if (method === 'GET' && path.endsWith('/session')) {
        return json(200, { sessionId: uuid() }, origin);
      }
      if (method === 'POST' && path.endsWith('/voice')) {
        return await handleVoice(event);
      }
      return json(404, { error: { code: 'not_found', message: 'Not found' } }, origin);
    } catch (error) {
      if (error instanceof AppError) {
        logger.error?.('[voice] request failed', {
          code: error.code,
          status: error.status,
          message: redact(error.message),
          service: error.service,
          upstreamStatus: error.upstreamStatus,
          detail: redact(error.detail),
          requestId: header(event, 'x-amzn-trace-id') || undefined,
        });
        return json(
          error.status,
          { error: { code: error.code, message: error.message } },
          origin,
        );
      }

      logger.error?.('[voice] unhandled error', { message: redact(error?.message) });
      return json(
        500,
        { error: { code: 'internal_error', message: 'Internal server error' } },
        origin,
      );
    }
  };
}

export const handler = createHandler();
