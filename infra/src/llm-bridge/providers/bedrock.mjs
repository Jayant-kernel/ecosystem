import { converse, createBedrockClient, DEFAULT_MODEL_ID } from '../bedrock.mjs';
import {
  TOOLS,
  MAX_TOOL_ITERATIONS,
  normalizeHistory,
  toolResultText,
  fallbackText,
} from '../tools.mjs';

const toolConfigFor = (tools) => ({
  tools: tools.map((tool) => ({
    toolSpec: {
      name: tool.name,
      description: tool.description,
      inputSchema: { json: tool.parameters },
    },
  })),
});

/**
 * Bedrock Claude provider. Kept behind the same interface as Gemini so the
 * stack can switch back with LLM_PROVIDER=bedrock without touching the API,
 * STT, TTS, session or frontend layers.
 */
export function createBedrockProvider(env = process.env, deps = {}) {
  const defaultModelId = env.BEDROCK_MODEL_ID || DEFAULT_MODEL_ID;
  let client = deps.client;

  const getClient = () =>
    client || (client = createBedrockClient(env.BEDROCK_REGION || 'ap-south-1'));

  return {
    name: 'bedrock',

    async generateTutorResponse({ system, transcript, history = [], context = {}, modelId, tools = TOOLS } = {}) {
      const toolConfig = toolConfigFor(tools);
      const messages = [
        ...normalizeHistory(history).map((turn) => ({
          role: turn.role,
          content: [{ text: turn.text }],
        })),
        { role: 'user', content: [{ text: transcript }] },
      ];

      const toolCalls = [];
      let text = '';

      for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
        const response = await converse(getClient(), {
          modelId: modelId || defaultModelId,
          system: [{ text: system }],
          messages,
          toolConfig,
          // Short by design: this is spoken back, and long text costs latency.
          inferenceConfig: { maxTokens: 220, temperature: 0.4 },
        });

        const content = response?.output?.message?.content || [];
        const turnText = content
          .filter((block) => typeof block.text === 'string')
          .map((block) => block.text)
          .join('');
        if (turnText) text += text ? `\n${turnText}` : turnText;

        const toolUses = content.filter((block) => block.toolUse);
        if (response?.stopReason !== 'tool_use' || toolUses.length === 0) break;

        messages.push({ role: 'assistant', content });
        messages.push({
          role: 'user',
          content: toolUses.map((block) => {
            toolCalls.push({ name: block.toolUse.name, args: block.toolUse.input || {} });
            return {
              toolResult: {
                toolUseId: block.toolUse.toolUseId,
                content: [{ text: toolResultText(block.toolUse.name, block.toolUse.input, context) }],
              },
            };
          }),
        });
      }

      return { text: text.trim() || fallbackText(toolCalls), toolCalls };
    },
  };
}
