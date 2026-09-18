/**
 * Typed errors so the handler can map failures to consistent HTTP responses
 * without ever leaking secrets or upstream payloads to the client.
 */
export class AppError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400, 'bad_request');
  }
}

export class ConfigError extends AppError {
  constructor(message = 'Server is not configured correctly') {
    super(message, 500, 'config_error');
  }
}

export class UpstreamError extends AppError {
  constructor(service, upstreamStatus, detail) {
    super(`Upstream ${service} request failed`, 502, 'upstream_error');
    this.service = service;
    this.upstreamStatus = upstreamStatus;
    // Kept server-side only; never returned to the client.
    this.detail = detail;
  }
}

export class TimeoutError extends AppError {
  constructor(message = 'Upstream request timed out') {
    super(message, 504, 'timeout');
  }
}

/** Strip anything resembling a secret before it reaches a log line. */
export function redact(value) {
  if (value === undefined || value === null) return value;
  return String(value)
    .replace(/sk_[A-Za-z0-9]+/g, 'sk_***')
    .replace(/(xi-api-key["':\s]+)[^\s",}]+/gi, '$1***');
}
