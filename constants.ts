
import { Course, Progress, RawCurriculumDatabase } from './types';
import { rawCurriculumData } from './javascriptCurriculum';
import { CLOUD_BIG_DATA_COURSE } from './cloudBigDataCurriculum';

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

// Re-export the Cloud & Big Data Engineering course so the rest of the app
// can treat every course uniformly.
export { CLOUD_BIG_DATA_COURSE };

export const COURSES: Course[] = [JAVASCRIPT_COURSE, CLOUD_BIG_DATA_COURSE];

export const DEFAULT_COURSE_ID = JAVASCRIPT_COURSE.id;

export const getCourseById = (courseId: string | undefined): Course =>
  COURSES.find((course) => course.id === courseId) ?? JAVASCRIPT_COURSE;

/**
 * Courses that can be opened without signing in.
 * Every course is currently public so guests/judges can try the platform immediately.
 */
export const PUBLIC_COURSE_IDS: string[] = COURSES.map((course) => course.id);

export const isCoursePublic = (courseId: string | undefined): boolean =>
  !!courseId && PUBLIC_COURSE_IDS.includes(courseId);


export const getInitialProgress = (course: Course): Progress => ({
  completedLessons: [],
  // Default to the first lesson of the first module for THIS course
  currentLessonId: course.modules[0]?.lessons[0]?.id ?? '',
  aiMemory: ['User is a complete beginner.'],
});

export const INITIAL_PROGRESS: Progress = getInitialProgress(JAVASCRIPT_COURSE);
