
import { Course, RawCurriculumDatabase } from './types';
import { rawCurriculumData } from './javascriptCurriculum';

// Cast and map the raw JSON to our internal Course interface if necessary
const rawDb = rawCurriculumData as RawCurriculumDatabase;

export const JAVASCRIPT_COURSE: Course = {
  id: rawDb.course.id,
  title: "JavaScript Mastery", // Mapping 'name' from JSON to 'title' for UI consistency
  description: "Start from scratch and build real-world apps. Master the modern web's most popular language with your AI Tutor.",
  level: "Beginner to Intermediate",
  totalDuration: "4 Weeks (Estimated)",
  outcomes: [
    "Build interactive websites with modern DOM manipulation",
    "Master asynchronous programming (Promises, Async/Await)",
    "Understand closures, scope, and execution context",
    "Debug complex issues with Chrome DevTools and AI",
    "Write clean, modular, and ES6+ modern JavaScript",
    "Create a final project: A dynamic Task Management App"
  ],
  prerequisites: [
    "No prior coding experience required",
    "A computer with internet access",
    "Basic understanding of how to use a web browser"
  ],
  // Keep only the first 3 modules for a focused learning experience
  modules: rawDb.course.modules.slice(0, 3)
};

export const INITIAL_PROGRESS = {
  completedLessons: [],
  // Default to the first lesson of the first module
  currentLessonId: JAVASCRIPT_COURSE.modules[0]?.lessons[0]?.id || 'js-vars-101',
  aiMemory: ['User is a complete beginner.'],
};
