
export interface Message {
    id: string;
    sender: 'user' | 'ai';
    text: string;
}

export enum InteractionMode {
    Chat = 'CHAT',
    Voice = 'VOICE',
}

export interface Progress {
    completedLessons: string[];
    currentLessonId: string;
    aiMemory: string[];
}

// New strictly typed Firestore models
export interface UserProfile {
    uid: string;
    name: string;
    email: string;
    createdAt: string;
}

export interface CourseProgress {
    completedLessonIds: string[];
    currentLessonId: string | null;
    aiMemory?: string[];
    updatedAt?: any; // generic for Firestore Timestamp or Date
}

export interface UserNotes {
    content: string;
    updatedAt?: any;
}

export interface LessonNote {
    lessonId: string;
    lessonTitle: string;
    content: string;
    updatedAt?: any;
}

export interface Transcript {
    user: string;
    ai: string;
    isFinal: boolean;
}

export interface ConsoleOutput {
    type: 'log' | 'error' | 'warn' | 'info';
    message: string;
}

export interface TestResult {
    test: string;
    passed: boolean;
    error?: string;
}

// --- Auth Types ---
export interface User {
    id: string;
    email: string;
    name: string;
}

// --- Standardized Curriculum Types ---
export interface Demo {
    code: string;
    explainByLine: boolean;
}

export interface Question {
    type: 'recall' | 'apply' | 'predict' | 'mcq' | 'output' | 'code';
    prompt: string;
    choices?: string[];
    answer?: string;
}

export interface DebuggingChallenge {
    buggyCode: string;
    hints: string[];
    solution: string;
}

export interface Exercise {
    prompt: string;
    tests: string[];
}

export interface Assessment {
    questions: Question[];
    passCriteria: {
        minCorrect: number;
    };
}

export interface LessonContent {
    explanations: string[];
    demos: Demo[];
    oralQuestions: Question[];
    debugging: DebuggingChallenge[];
    exercises: Exercise[];
    assessment: Assessment;
}

export interface MemoryUpdates {
    conceptsMastered: string[];
    mistakeWatchlist: string[];
}

export interface Lesson {
    id: string;
    title: string;
    objectives: string[];
    prerequisites: string[];
    timeEstimateMin: number;
    content: LessonContent;
    memoryUpdates: MemoryUpdates;
    nextLesson?: string | null;
}

export interface Module {
    id: string;
    title: string;
    lessons: Lesson[];
}

export interface Course {
    id: string;
    title: string;
    description: string;
    outcomes?: string[];
    prerequisites?: string[];
    level?: string;
    totalDuration?: string;
    modules: Module[];
}

export interface RawCurriculumDatabase {
    course: {
        id: string;
        name: string;
        description: string;
        modules: Module[];
    };
}
