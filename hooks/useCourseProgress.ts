
import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Progress, CourseProgress } from '../types';
import { getCourseById, getInitialProgress } from '../constants';
import { useAuth } from '../contexts/AuthContext';

export const useCourseProgress = (courseId: string) => {
  const { user, loading: authLoading } = useAuth();
  const course = getCourseById(courseId);
  const initialProgress = getInitialProgress(course);
  const [progress, setProgress] = useState<Progress>(initialProgress);
  // NOTE: progress default is course-aware so each course opens on its own first lesson.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to log permission errors clearly
  const logPermissionError = (err: any) => {
      if (err.code === 'permission-denied') {
          console.warn(
              "%cFIREBASE SETUP REQUIRED: Missing Security Rules\n" +
              "%cYour app cannot access Firestore. Go to Firebase Console > Firestore Database > Rules and set:\n" +
              "match /users/{userId}/{document=**} { allow read, write: if request.auth != null && request.auth.uid == userId; }",
              "font-weight: bold; color: red; font-size: 12px;",
              "color: orange;"
          );
          return "Database permissions missing (see console)";
      }
      return "Failed to sync data";
  };

  // Real-time subscription to Firestore
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
        // DEMO MODE: Load from localStorage once on mount
        try {
            const localData = window.localStorage.getItem(`progress-${courseId}`);
            if (localData) {
                setProgress(JSON.parse(localData));
            } else {
                setProgress(initialProgress);
            }
        } catch (e) {
            console.error("Local storage error", e);
            setProgress(initialProgress);
        }
        setLoading(false);
        return;
    }

    setLoading(true);
    const docRef = doc(db, 'users', user.id, 'progress', courseId);

    const unsubscribe = onSnapshot(docRef, {
        next: (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data() as CourseProgress;
                // Map Firestore data model back to app internal Progress model
                setProgress({
                    completedLessons: data.completedLessonIds || [],
                    currentLessonId: data.currentLessonId || initialProgress.currentLessonId,
                    aiMemory: data.aiMemory || initialProgress.aiMemory
                });
            } else {
                // If doc doesn't exist yet for authed user, use defaults (don't auto-create until they do something)
                setProgress(initialProgress);
            }
            setLoading(false);
            setError(null);
        },
        error: (err) => {
            console.error("Firestore progress sync error:", err);
            setError(logPermissionError(err));
            setLoading(false);
        }
    });

    return () => unsubscribe();
  }, [user, courseId, authLoading]);

  // Helper to save to localStorage for demo users
  const saveToLocal = (newProgress: Progress) => {
      try {
        window.localStorage.setItem(`progress-${courseId}`, JSON.stringify(newProgress));
      } catch (e) {
          console.error("Failed to save to localStorage", e);
      }
  };

  const updateProgress = useCallback(async (newProgressData: Partial<Progress>) => {
    if (!user) {
        setProgress(prev => {
            const updated = { ...prev, ...newProgressData };
            saveToLocal(updated);
            return updated;
        });
        return;
    }

    try {
        const docRef = doc(db, 'users', user.id, 'progress', courseId);
        // We need to map our internal Progress type to the Firestore CourseProgress type for saving
        const updatePayload: any = { updatedAt: serverTimestamp() };
        
        if (newProgressData.currentLessonId !== undefined) updatePayload.currentLessonId = newProgressData.currentLessonId;
        if (newProgressData.completedLessons !== undefined) updatePayload.completedLessonIds = newProgressData.completedLessons;
        if (newProgressData.aiMemory !== undefined) updatePayload.aiMemory = newProgressData.aiMemory;

        // setDoc with merge: true acts as both create-if-missing and update
        await setDoc(docRef, updatePayload, { merge: true });
    } catch (err: any) {
        console.error("Failed to update progress:", err);
        setError(logPermissionError(err));
    }
  }, [user, courseId]);

  const completeLesson = useCallback(async (lessonId: string, nextLessonId: string) => {
    if (!user) {
         setProgress(prev => {
            const newCompleted = prev.completedLessons.includes(lessonId) ? prev.completedLessons : [...prev.completedLessons, lessonId];
            const updated = {
                ...prev,
                completedLessons: newCompleted,
                currentLessonId: nextLessonId,
                aiMemory: [...prev.aiMemory, `User completed lesson ${lessonId}.`]
            };
            saveToLocal(updated);
            return updated;
        });
        return;
    }

    try {
        const docRef = doc(db, 'users', user.id, 'progress', courseId);
        // Atomic update using arrayUnion to prevent race conditions when adding completed lessons
        await setDoc(docRef, {
            completedLessonIds: arrayUnion(lessonId),
            currentLessonId: nextLessonId,
            aiMemory: arrayUnion(`User completed lesson ${lessonId}.`),
            updatedAt: serverTimestamp()
        }, { merge: true });

    } catch (err: any) {
        console.error("Failed to complete lesson:", err);
        setError(logPermissionError(err));
    }
  }, [user, courseId]);

  return { progress, updateProgress, completeLesson, loading, error };
};
