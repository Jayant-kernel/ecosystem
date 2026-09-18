export const MAX_TOOL_ITERATIONS = 3;
export const MAX_HISTORY_TURNS = 8;

/**
 * Provider-neutral tool declarations. Each LLM provider translates `parameters`
 * (JSON Schema) into its own function-calling format.
 */
export const TOOLS = [
  {
    name: 'writeCode',
    description:
      'Writes code into the learner editor. Use this to demonstrate concepts "live" as you explain them.',
    parameters: {
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
  {
    name: 'readCode',
    description:
      "Reads the current content of the editor. Use before answering questions about the learner's code.",
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'executeCode',
    description: 'Runs the editor code and shows output in the console.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'controlApp',
    description: 'Triggers an interface action when explicitly requested by the learner.',
    parameters: {
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
];

export function buildSystemPrompt(context = {}) {
  const { lessonTitle, objectives, aiMemory, editorCode } = context;

  return `You are Ecosystem, a friendly and patient conversational coding mentor. Your answers are spoken aloud, so keep them concise and natural.

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

/**
 * Normalizes stored/client history into a provider-neutral list of
 * `{ role: 'user' | 'assistant', text }` turns, alternating and starting with user.
 */
export function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  const cleaned = [];
  for (const turn of history.slice(-MAX_HISTORY_TURNS * 2)) {
    const role = turn?.role === 'assistant' ? 'assistant' : 'user';
    const text = typeof turn?.content === 'string' ? turn.content.trim() : '';
    if (!text) continue;
    const last = cleaned[cleaned.length - 1];
    if (last && last.role === role) {
      last.text += `\n${text}`;
    } else {
      cleaned.push({ role, text });
    }
  }
  while (cleaned.length && cleaned[0].role !== 'user') cleaned.shift();
  return cleaned;
}

export function toolResultText(name, input, context = {}) {
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

export function fallbackText(toolCalls) {
  if (toolCalls.some((c) => c.name === 'writeCode')) {
    return "I've written that code into your editor.";
  }
  if (toolCalls.some((c) => c.name === 'executeCode')) {
    return "I've run your code — check the console for the output.";
  }
  return 'Done.';
}
