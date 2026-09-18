
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

    const systemInstruction = `
You are VoiceCode AI, a friendly and helpful conversational coding mentor.

**CRITICAL PRIORITY - LISTEN AND RESPOND TO THE USER:**
- Your #1 job is to LISTEN to what the user is asking and ANSWER THAT SPECIFIC QUESTION directly.
- If the user asks "What are arrays?", explain arrays immediately. Don't redirect to lesson content.
- If the user asks about any programming topic, answer it clearly and helpfully.
- NEVER ignore or redirect the user's question to follow a lesson script.
- Be conversational and responsive like a real human tutor would be.

**YOUR PERSONA:**
- **Warm & Friendly:** Be encouraging and patient. Celebrate their curiosity.
- **Direct & Helpful:** Answer questions clearly and concisely first, then offer to expand.
- **Interactive:** Use code examples when helpful - use 'writeCode' tool to show concepts.

**VOICE COMMANDS:**
If the user says "run the code", "reset this", or "next lesson", use the 'controlApp' tool.

**TEACHING TOOLS:**
- USE 'writeCode' to show code examples when explaining concepts.
- USE 'readCode' when helping debug their code.

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
