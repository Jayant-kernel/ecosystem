
import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/dbService';

interface NoteSummary {
    lessonId: string;
    lessonTitle: string;
    updatedAt: string;
}

export const useUserNotes = (lessonId?: string, lessonTitle?: string) => {
    const { user, loading: authLoading } = useAuth();
    const [notes, setNotes] = useState<string>('');
    const [savedNotes, setSavedNotes] = useState<NoteSummary[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState<boolean>(false);

    const saveTimeoutRef = useRef<any>(null);
    const currentLessonIdRef = useRef<string | undefined>(lessonId);

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
        return "Failed to sync notes";
    };

    // Load all saved notes list
    const loadSavedNotesList = useCallback(async () => {
        if (!user) return;
        try {
            const notesList = await dbService.getAllLessonNotes(user.id);
            setSavedNotes(notesList);
        } catch (err) {
            console.error("Error loading notes list:", err);
        }
    }, [user]);

    // Real-time subscription for current lesson's notes
    useEffect(() => {
        if (authLoading) return;

        // Update ref when lessonId changes
        currentLessonIdRef.current = lessonId;

        if (!user) {
            // Demo mode: LocalStorage with lesson-based keys
            const storageKey = lessonId ? `voicecode_notes_${lessonId}` : 'voicecode_notes';
            const localNotes = window.localStorage.getItem(storageKey);
            setNotes(localNotes || '');
            setIsLoading(false);
            return;
        }

        if (!lessonId) {
            setNotes('');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const unsubscribe = onSnapshot(
            doc(db, 'users', user.id, 'notes', lessonId),
            (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    // Only update state from DB if we aren't actively typing/saving
                    if (!isSaving) {
                        setNotes(data.content || '');
                    }
                } else {
                    setNotes('');
                }
                setIsLoading(false);
                setError(null);
            },
            (err: any) => {
                console.error("Error syncing notes:", err);
                setError(logPermissionError(err));
                setIsLoading(false);
            }
        );

        // Also load the list of all saved notes
        loadSavedNotesList();

        return () => unsubscribe();
    }, [user, authLoading, lessonId, loadSavedNotesList]);

    // Debounced save function
    const updateNotes = useCallback((newContent: string) => {
        setNotes(newContent);

        const currentLessonId = currentLessonIdRef.current;

        if (!user) {
            const storageKey = currentLessonId ? `voicecode_notes_${currentLessonId}` : 'voicecode_notes';
            window.localStorage.setItem(storageKey, newContent);
            return;
        }

        if (!currentLessonId || !lessonTitle) return;

        setIsSaving(true);

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(async () => {
            try {
                await setDoc(doc(db, 'users', user.id, 'notes', currentLessonId), {
                    lessonId: currentLessonId,
                    lessonTitle: lessonTitle,
                    content: newContent,
                    updatedAt: serverTimestamp()
                }, { merge: true });
                setIsSaving(false);
                // Refresh the notes list after saving
                loadSavedNotesList();
            } catch (err: any) {
                console.error("Failed to save notes:", err);
                setError(logPermissionError(err));
                setIsSaving(false);
            }
        }, 1000); // 1 second debounce
    }, [user, lessonTitle, loadSavedNotesList]);

    return {
        notes,
        updateNotes,
        isLoading,
        isSaving,
        error,
        savedNotes,
        refreshNotesList: loadSavedNotesList
    };
};