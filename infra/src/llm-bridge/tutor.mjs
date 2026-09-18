import { converse, DEFAULT_MODEL_ID } from './bedrock.mjs';

const MAX_TOOL_ITERATIONS = 3;
const MAX_HISTORY_TURNS = 8;

/**
 * Tool declarations exposed to Claude. These mirror the client tools the
 * frontend already handles (writeCode / readCode / executeCode / controlApp).
 */
export const TOOL_SPECS = [
  {
    toolSpec: {
      name: 'writeCode',
      description:
        'Writes code into the learner editor. Use this to demonstrate concepts "live" as you explain them.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'The complete JavaScript code to write.' },
            explanation: {
              type: 'string',
              description: 'A brief spoken explanation synchronized with the code.',
            },
          },
          required: ['code'],
        },
      },
    },
  },
  {
    toolSpec: {
      name: 'readCode',
      description:
        "Reads the current content of the editor. Use before answering questions about the learner's code.",
      inputSchema: { json: { type: 'object', properties: {} } },
    },
  },
  {
    toolSpec: {
      name: 'executeCode',
      description: 'Runs the editor code and shows output in the console.',
      inputSchema: { json: { type: 'object', properties: {} } },
    },
  },
  {
    toolSpec: {
      name: 'controlApp',
      description: 'Triggers an interface action when explicitly requested by the learner.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['run_code', 'reset_code', 'next_lesson'],
              description: 'The interface action to trigger.',
            },
          },
          required: ['action'],
        },
      },
    },
  },
];

export function buildSystemPrompt(context = {}) {
  const { lessonTitle, objectives, aiMemory, editorCode } = context;

  return `You are VoiceCode AI, a friendly and patient conversational coding mentor. Your answers are spoken aloud, so keep them concise and natural.

CRITICAL PRIORITY — RESPOND TO THE LEARNER:
- Answer the learner's actual question directly and first.
- Never redirect their question to a lesson script.
- Keep replies to roughly 1-3 short sentences unless asked for detail.

TEACHING TOOLS:
- Use writeCode to show code in the editor as you explain.
- Use readCode before answering questions about their code or debugging.
- Use executeCode when they want to run their code or see output.
- Use controlApp for "run the code", "reset this", or "next lesson" voice commands.

SESSION CONTEXT:
- Current lesson: ${lessonTitle || 'None selected'}
- Learning objectives: ${objectives || 'N/A'}
- Learner memory: ${aiMemory || 'New learner, be welcoming.'}

CURRENT EDITOR CODE:
\`\`\`javascript
${editorCode || '// editor is empty'}
\`\`\``;
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  const cleaned = [];
  for (const turn of history.slice(-MAX_HISTORY_TURNS * 2)) {
    const role = turn?.role === 'assistant' ? 'assistant' : 'user';
    const text = typeof turn?.content === 'string' ? turn.content.trim() : '';
    if (!text) continue;
    const last = cleaned[cleaned.length - 1];
    if (last && last.role === role) {
      last.content[0].text += `\n${text}`;
    } else {
      cleaned.push({ role, content: [{ text }] });
    }
  }
  // Converse requires the conversation to start with a user turn.
  while (cleaned.length && cleaned[0].role !== 'user') cleaned.shift();
  return cleaned;
}

function toolResultText(name, input, context) {
  switch (name) {
    case 'readCode':
      return context.editorCode || '// The editor is empty.';
    case 'writeCode':
      return 'Code written to the learner editor.';
    case 'executeCode':
      return 'Code execution requested; output will appear in the console.';
    case 'controlApp':
      return `Action "${input?.action || 'unknown'}" triggered.`;
    default:
      return 'Done.';
  }
}

function fallbackText(toolCalls) {
  if (toolCalls.some((c) => c.name === 'writeCode')) {
    return "I've written that code into your editor.";
  }
  if (toolCalls.some((c) => c.name === 'executeCode')) {
    return "I've run your code — check the console for the output.";
  }
  return 'Done.';
}

/**
 * Runs the tutor turn: transcript -> Claude, resolving any tool calls in a
 * bounded loop so the final message is text suitable for TTS.
 */
export async function runTutor({
  client,
  modelId = process.env.BEDROCK_MODEL_ID || DEFAULT_MODEL_ID,
  transcript,
  history = [],
  context = {},
  maxTokens = 512,
  temperature = 0.4,
} = {}) {
  const messages = [
    ...normalizeHistory(history),
    { role: 'user', content: [{ text: transcript }] },
  ];

  const toolCalls = [];
  let text = '';

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const response = await converse(client, {
      modelId,
      system: [{ text: buildSystemPrompt(context) }],
      messages,
      toolConfig: { tools: TOOL_SPECS },
      inferenceConfig: { maxTokens, temperature },
    });

    const content = response?.output?.message?.content || [];
    const turnText = content
      .filter((block) => typeof block.text === 'string')
      .map((block) => block.text)
      .join('');
    if (turnText) text += text ? `\n${turnText}` : turnText;

    const toolUses = content.filter((block) => block.toolUse);
    if (response?.stopReason !== 'tool_use' || toolUses.length === 0) {
      break;
    }

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

  const finalText = text.trim() || fallbackText(toolCalls);
  return { text: finalText, toolCalls };
}
