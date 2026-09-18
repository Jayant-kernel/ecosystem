import vm from 'node:vm';

const TIMEOUT_MS = Number(process.env.EXEC_TIMEOUT_MS || 2000);

function format(args) {
  return args
    .map((arg) => {
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg);
        } catch {
          return '[Circular]';
        }
      }
      return String(arg);
    })
    .join(' ');
}

/**
 * Executes learner JavaScript in an isolated V8 context with a hard timeout.
 * NOTE: node:vm is not a security boundary. Put this behind auth + low
 * concurrency (or move to Firecracker/gVisor) before any real exposure.
 */
export const handler = async (event) => {
  const origin = process.env.ALLOWED_ORIGIN || '*';
  const headers = {
    'content-type': 'application/json',
    'access-control-allow-origin': origin,
  };

  const method = event.requestContext?.http?.method || event.httpMethod;
  if (method === 'OPTIONS') return { statusCode: 204, headers, body: '' };

  let body;
  try {
    body = JSON.parse(
      event.isBase64Encoded
        ? Buffer.from(event.body || '', 'base64').toString('utf8')
        : event.body || '{}',
    );
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'invalid json' }) };
  }

  const code = typeof body.code === 'string' ? body.code : '';
  if (!code.trim()) {
    return { statusCode: 200, headers, body: JSON.stringify({ output: [] }) };
  }

  const output = [];
  const sandboxConsole = {
    log: (...args) => output.push({ type: 'log', message: format(args) }),
    error: (...args) => output.push({ type: 'error', message: format(args) }),
    warn: (...args) => output.push({ type: 'warn', message: format(args) }),
    info: (...args) => output.push({ type: 'info', message: format(args) }),
  };

  const context = vm.createContext({
    console: sandboxConsole,
    Math,
    JSON,
    Date,
    String,
    Number,
    Boolean,
    Array,
    Object,
    RegExp,
    Map,
    Set,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
  });

  try {
    new vm.Script(code, { filename: 'learner.js' }).runInContext(context, {
      timeout: TIMEOUT_MS,
    });
  } catch (error) {
    output.push({ type: 'error', message: String(error?.message || error) });
  }

  let results;
  if (Array.isArray(body.tests) && body.tests.length) {
    results = body.tests.map((test) => {
      try {
        const value = new vm.Script(`(${test})`).runInContext(context, { timeout: TIMEOUT_MS });
        return { test, passed: Boolean(value) };
      } catch (error) {
        return { test, passed: false, error: String(error?.message || error) };
      }
    });
  }

  return { statusCode: 200, headers, body: JSON.stringify({ output, results }) };
};
