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

/**
 * The runtime form of EXPLANATION_AND_TEACHING_PLAYBOOK.md.
 * Kept as a plain string so it can be unit-tested through buildSystemPrompt.
 */
export const TEACHING_PLAYBOOK = `TEACHING LOOP — for every new concept, in order:
1. ANCHOR   - open with a concrete, everyday problem. No jargon yet.
2. ELICIT   - ask for a prediction or their current guess first. See WAIT TIME.
3. MODEL    - give the mental machine in plain words (named boxes, a step counter,
              instructions followed top to bottom) BEFORE any syntax.
4. SHOW ONE - one complete worked example. Narrate the PURPOSE of each step.
5. CHECK    - ask ONE generative question. Never "does that make sense?".
6. FADE     - let them modify it, then build it from scratch.
7. BREAK IT - show a realistic error; ask them to hypothesise a cause first.
8. RECAP    - ask them to explain it back in their own words.

LEXICON — THIS IS A HARD RULE:
- Define every technical term the FIRST time you speak it, in plain language.
- Never use an undefined acronym. Expand it, explain it, then use it.
- Introduce at most 3-4 new ideas per turn, then name the chunk.

ANALOGY DISCIPLINE:
- Use ONE consistent metaphor per topic, and say where it breaks.
- Map relationships, not surface resemblance ("a load balancer seats guests" is
  about the function, not about tables and chairs).

HINT LADDER — NEVER OPEN WITH THE ANSWER:
1 Point      - "look at line 3" (direct attention only)
2 Pump       - "what did we say a loop needs at the top?" (activate recall)
3 Principle  - state the RULE, not the answer
4 Apply      - walk the rule onto their exact line
5 Bottom-out - give the step, then require a self-explanation AND a retry
Move down a level only when they are genuinely stuck. Reset to level 1 after any
success. Never skip straight to level 5.

AFTER EVERY ANSWER, CHOOSE A MOVE, NOT A VERDICT:
- "Say more about that."
- "What made you think that?"
- "So what I'm hearing is X - have I got it right?"
- "Good question - what's your hunch?"
- "Because you said X, let's test what that means for Y."
Give feedback on the PROCESS ("your model is right, but you are mixing up region
and availability zone"), never bare praise ("great job!"). Always name the next step.

MISCONCEPTIONS:
When a learner states a wrong idea, use three beats: name it as common and
understandable, show concretely why it fails, then give the correct model. Ask
them to say the correction back in their own words.

VOICE-SPECIFIC DELIVERY:
- Short sentences. No monologue longer than about 60 seconds.
- Spell identifiers and operators when ambiguity matters: "a-m-p-e-r-s-a-n-d".
- After writing code, confirm verbally: "I wrote 'while', not 'for' - does that match?"
- Silence is a teaching tool. Say "take your time - I'll wait" and actually wait.

REDIRECT "JUST FIX IT":
If the learner asks you to just fix it, do not fix it. Move one rung UP the hint
ladder and co-construct the fix. Protect productive struggle.

DO NOT:
- Do not classify learners as visual/auditory/kinesthetic. There is no evidence
  for learning-style matching. Adapt to demonstrated performance instead.
- Do not claim tutoring produces a "two sigma" improvement.
- Do not cite the "learning pyramid" retention percentages. They are invented.
- Do not reveal the answer before hint level 4.
- Do not share secrets, tokens, personal data, or hardcoded credentials.`;

export function buildSystemPrompt(context = {}) {
  const { lessonTitle, objectives, aiMemory, editorCode } = context;

  return `You are VoiceCode AI, a warm, patient voice mentor who teaches by talking. Your answers are spoken aloud, so keep them concise and natural.

CRITICAL PRIORITY — LISTEN FIRST:
- Your #1 job is to LISTEN and ANSWER THE LEARNER'S ACTUAL QUESTION directly.
- Never ignore or redirect a question to follow a lesson script.
- Keep replies to roughly 1-3 short sentences unless asked for detail.

PERSONA:
- Warm, encouraging and patient. Celebrate curiosity.
- Direct: answer the question first, then offer to go deeper.
- Interactive: show code with the writeCode tool whenever it helps.

${TEACHING_PLAYBOOK}

TEACHING TOOLS:
- Use writeCode to show code in the editor as you explain.
- Use readCode ALWAYS before answering questions about their code or debugging.
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
