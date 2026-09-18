
import { GoogleGenAI, LiveServerMessage, Modality, Blob, FunctionDeclaration, Type } from "@google/genai";
import { Progress, Lesson } from "../types";

// Initialize strictly according to guidelines, but lazily to prevent top-level browser crashes
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
    if (!aiClient) {
        const apiKey = process.env.API_KEY;
        if (!apiKey || apiKey.trim() === '') {
            console.error("FATAL: API_KEY is missing from environment.");
            throw new Error("API_KEY is missing. Please set it in your environment variables.");
        }
        aiClient = new GoogleGenAI({ apiKey });
    }
    return aiClient;
}

const writeCodeTool: FunctionDeclaration = {
    name: 'writeCode',
    parameters: {
        type: Type.OBJECT,
        description: 'Writes code into the user\'s editor. Use this to demonstrate concepts "live" as you explain them.',
        properties: {
            code: {
                type: Type.STRING,
                description: 'The complete JavaScript code to write to the editor.',
            },
            explanation: {
                type: Type.STRING,
                description: 'A brief, friendly, spoken explanation that synchronizes with the code appearing. E.g., "First, we declare the function..."',
            }
        },
        required: ['code', 'explanation'],
    },
};

const executeCodeTool: FunctionDeclaration = {
    name: 'executeCode',
    parameters: {
        type: Type.OBJECT,
        description: 'Executes the current code in the editor and displays the output in the console. Use this when the user wants to run their code or when you want to demonstrate an output.',
        properties: {},
        required: [],
    },
};

const readCodeTool: FunctionDeclaration = {
    name: 'readCode',
    parameters: {
        type: Type.OBJECT,
        description: 'Reads the current content of the code editor. ALWAYS use this before answering questions about the user\'s code or providing debugging help.',
        properties: {},
        required: [],
    },
};

const controlAppTool: FunctionDeclaration = {
    name: 'controlApp',
    parameters: {
        type: Type.OBJECT,
        description: 'Triggers a specific action in the application interface when explicitly requested by the user via voice.',
        properties: {
            action: {
                type: Type.STRING,
                description: 'The specific interface action to trigger.',
                enum: ['run_code', 'reset_code', 'next_lesson']
            }
        },
        required: ['action'],
    },
};

// Helper type to get the return type of connect, handling the lazy client
type LiveSessionType = Awaited<ReturnType<GoogleGenAI['live']['connect']>>;
export type LiveSession = LiveSessionType;

export const startLiveSession = (
    progress: Progress,
    currentLesson: Lesson | null,
    callbacks: {
        onopen: () => void;
        onmessage: (message: LiveServerMessage) => void;
        onerror: (e: ErrorEvent) => void;
        onclose: (e: CloseEvent) => void;
    }
): Promise<LiveSession> => {
    const { aiMemory } = progress;

    // Inject lesson context as reference (not strict protocol)
    const lessonContext = currentLesson ? `
**CURRENT LESSON REFERENCE (${currentLesson.title}):**
- Learning objectives: ${currentLesson.objectives.join(', ')}.
- You may use these examples if relevant: ${JSON.stringify(currentLesson.content.demos?.slice(0, 2))}.
NOTE: This is reference context only. ALWAYS prioritize answering the user's actual question first.
` : 'No specific lesson active. Help user with any coding questions they have.';

    // Teaching method is governed by EXPLANATION_AND_TEACHING_PLAYBOOK.md.
    // The protocol below is the compressed, runtime version of that playbook.
    const systemInstruction = `
You are VoiceCode AI, a warm, patient voice mentor who teaches by talking.

**PRIME DIRECTIVE - LISTEN FIRST:**
- Your #1 job is to LISTEN and ANSWER THE USER'S ACTUAL QUESTION directly.
- NEVER ignore or redirect a question to follow a lesson script.
- Be conversational, like a real human mentor sitting beside the learner.

**YOUR PERSONA:**
- Warm, encouraging and patient. Celebrate curiosity.
- Direct: answer the question first, then offer to go deeper.
- Interactive: show code with the 'writeCode' tool whenever it helps.

**THE TEACHING LOOP (for each new concept, in order):**
1. ANCHOR - open with a concrete, everyday problem. No jargon yet.
2. ELICIT - ask for a prediction or their current guess first. See WAIT TIME below.
3. MODEL - give the mental machine in plain words (named boxes, a step counter,
   instructions followed top to bottom) BEFORE any syntax.
4. SHOW ONE - one complete worked example. Narrate the PURPOSE of each step.
5. CHECK - ask ONE generative question. Never "does that make sense?".
6. FADE - let them modify it, then build it from scratch.
7. BREAK IT - show a realistic error; ask them to hypothesise a cause first.
8. RECAP - ask them to explain it back in their own words.

**LEXICON - THIS IS A HARD RULE:**
- Define every technical term the FIRST time you speak it, in plain language.
- Never use an undefined acronym. Expand it, explain it, then use it.
- Introduce at most 3-4 new ideas per turn, then name the chunk.

**ANALOGY DISCIPLINE:**
- Use ONE consistent metaphor per topic, and say where it breaks.
- Map relationships, not surface resemblance ("a load balancer seats guests"
  is about the function, not about tables and chairs).

**HINT LADDER - NEVER OPEN WITH THE ANSWER:**
1 Point    - "look at line 3" (direct attention only)
2 Pump     - "what did we say a loop needs at the top?" (activate recall)
3 Principle- state the RULE, not the answer
4 Apply    - walk the rule onto their exact line
5 Bottom-out - give the step, then require a self-explanation AND a retry
Move down a level only when they are genuinely stuck. Reset to level 1 after
any success. Never skip straight to level 5.

**AFTER EVERY ANSWER, CHOOSE A MOVE, NOT A VERDICT:**
- "Say more about that."
- "What made you think that?"
- "So what I'm hearing is X - have I got it right?"
- "Good question - what's your hunch?"
- "Because you said X, let's test what that means for Y."
Give feedback on the PROCESS ("your model is right, but you are mixing up region
and availability zone"), never bare praise ("great job!"). Always name the next step.

**MISCONCEPTIONS:**
When a learner states a wrong idea, use three beats: name it as common and
understandable, show concretely why it fails, then give the correct model. Ask
them to say the correction back in their own words.

**VOICE-SPECIFIC DELIVERY:**
- Short sentences. No monologue longer than about 60 seconds.
- Spell identifiers and operators when ambiguity matters: "a-m-p-e-r-s-a-n-d".
- After writing code, confirm verbally: "I wrote 'while', not 'for' - does that match?"
- Silence is a teaching tool. Say "take your time - I'll wait" and actually wait.

**REDIRECT "JUST FIX IT":**
If the learner asks you to just fix it, do not fix it. Move one rung UP the hint
ladder and co-construct the fix. Protect productive struggle.

**DO NOT:**
- Do not classify learners as visual/auditory/kinesthetic. There is no evidence
  for learning-style matching. Adapt to demonstrated performance instead.
- Do not claim tutoring produces a "two sigma" improvement.
- Do not cite the "learning pyramid" retention percentages. They are invented.
- Do not share secrets, tokens, personal data, or hardcoded credentials.

**VOICE COMMANDS:**
If the user says "run the code", "reset this", or "next lesson", use 'controlApp'.

**TEACHING TOOLS:**
- USE 'writeCode' to demonstrate concepts live as you explain them.
- USE 'readCode' ALWAYS before answering questions about their code or debugging.

${lessonContext}

**SESSION CONTEXT:**
- User History: ${aiMemory.length > 0 ? aiMemory.slice(-3).join('; ') : 'New user, be welcoming!'}
`;

    // Use the lazy getter here
    return getAiClient().live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks,
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction,
            outputAudioTranscription: {},
            inputAudioTranscription: {},
            tools: [{ functionDeclarations: [writeCodeTool, executeCodeTool, readCodeTool, controlAppTool] }],
        },
    });
};

export function createPcmBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    const encode = (bytes: Uint8Array) => {
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}
