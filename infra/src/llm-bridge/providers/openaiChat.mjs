import { ConfigError, TimeoutError, UpstreamError } from '../errors.mjs';
import {
  TOOLS,
  MAX_TOOL_ITERATIONS,
  normalizeHistory,
  toolResultText,
  fallbackText,
} from '../tools.mjs';

const toolSpecsFor = (tools) =>
  tools.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));

const messagesFor = (system, history, transcript) => [
  { role: 'system', content: system },
  ...normalizeHistory(history).map((turn) => ({ role: turn.role, content: turn.text })),
  { role: 'user', content: transcript },
];

async function readDetail(response) {
  try {
    return (await response.text()).slice(0, 500);
  } catch {
    return '';
  }
}

async function postJson(fetchImpl, url, options, timeoutMs, vendor) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError') throw new TimeoutError(`${vendor} request timed out`);
    throw new UpstreamError(vendor, 0, error?.message);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Shared engine for OpenAI-compatible chat APIs (xAI Grok, Groq, and anything
 * else speaking /chat/completions). Tool calling is identical everywhere, so
 * each vendor is a thin wrapper: base URL + key + model + extras.
 */
export function createOpenAIChatProvider({
  vendor,
  baseUrl,
  apiKey,
  model,
  keyError,
  timeoutMs = 30000,
  extraBody = {},
  fetchImpl = fetch,
}) {
  return {
    name: vendor.toLowerCase(),

    async generateTutorResponse({ system, transcript, history = [], context = {}, modelId, tools = TOOLS } = {}) {
      if (!apiKey) throw new ConfigError(keyError);

      const chatUrl = `${String(baseUrl).replace(/\/$/, '')}/chat/completions`;
      const messages = messagesFor(system, history, transcript);
      const toolCalls = [];
      let text = '';

      for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
        const payload = {
          model: modelId || model,
          messages,
          temperature: 0.4,
          // Short by design: this is spoken back, and long text costs latency.
          max_tokens: 220,
          ...extraBody,
        };
        if (tools.length) {
          payload.tools = toolSpecsFor(tools);
          payload.tool_choice = 'auto';
        }

        const response = await postJson(
          fetchImpl,
          chatUrl,
          {
            method: 'POST',
            headers: {
              authorization: `Bearer ${apiKey}`,
              'content-type': 'application/json',
            },
            body: JSON.stringify(payload),
          },
          timeoutMs,
          vendor,
        );

        if (!response.ok) {
          throw new UpstreamError(vendor, response.status, await readDetail(response));
        }

        let data;
        try {
          data = await response.json();
        } catch {
          throw new UpstreamError(vendor, response.status, 'malformed JSON response');
        }

        const message = data?.choices?.[0]?.message || {};
        if (typeof message.content === 'string' && message.content.trim()) {
          const turn = message.content.trim();
          text += text ? `\n${turn}` : turn;
        }

        const calls = Array.isArray(message.tool_calls) ? message.tool_calls : [];
        if (!calls.length) break;

        // Echo the assistant's tool_calls back, then answer each with a tool message.
        messages.push({ role: 'assistant', content: message.content || '', tool_calls: calls });
        for (const call of calls) {
          const name = call?.function?.name || 'unknown';
          let args = {};
          try {
            args = call?.function?.arguments ? JSON.parse(call.function.arguments) : {};
          } catch {
            args = {};
          }
          toolCalls.push({ name, args });
          messages.push({
            role: 'tool',
            tool_call_id: call?.id,
            content: toolResultText(name, args, context),
          });
        }

        // The model already said its piece in the same turn as the tool call
        // ("Let me write that for you"). Speaking that now saves a whole extra
        // LLM round trip, which is both latency and rate-limit budget.
        if (text) break;
      }

      return { text: text.trim() || fallbackText(toolCalls), toolCalls };
    },
  };
}
