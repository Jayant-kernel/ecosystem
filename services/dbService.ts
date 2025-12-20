
import {
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs,
    updateDoc,
    deleteDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Progress } from '../types';
import { INITIAL_PROGRESS } from '../constants';

// Define a standard User Profile interface for Firestore
export interface UserProfile {
    uid: string;
    name: string;
    email: string;
    createdAt?: string;
    [key: string]: any; // Allow for flexible additional fields
}

export const dbService = {
    // --- Standard CRUD for 'users' collection ---

    // 1. Create (or overwrite) a generic user document
    async createUser(userId: string, userData: { name: string; email: string }): Promise<void> {
        try {
            // Use setDoc with merge: true to avoid accidental overwrites of existing subcollections if called later
            await setDoc(doc(db, 'users', userId), {
                uid: userId,
                name: userData.name,
                email: userData.email,
                createdAt: new Date().toISOString()
            }, { merge: true });
        } catch (error) {
            console.error("Error creating user:", error);
            throw error;
        }
    },

    // 2. Retrieve all documents from 'users' collection
    async getAllUsers(): Promise<UserProfile[]> {
        try {
            const querySnapshot = await getDocs(collection(db, 'users'));
            const users: UserProfile[] = [];
            querySnapshot.forEach((doc) => {
                users.push(doc.data() as UserProfile);
            });
            return users;
        } catch (error) {
            console.error("Error getting all users:", error);
            throw error;
        }
    },

    // 3. Update a specific user document
    async updateUser(userId: string, data: Partial<UserProfile>): Promise<void> {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, data);
        } catch (error) {
            console.error("Error updating user:", error);
            throw error;
        }
    },

    // 4. Delete a specific user document
    async deleteUser(userId: string): Promise<void> {
        try {
            await deleteDoc(doc(db, 'users', userId));
        } catch (error) {
            console.error("Error deleting user:", error);
            throw error;
        }
    },

    // --- Existing App-Specific Methods ---

    async getUserProgress(userId: string, courseId: string): Promise<Progress> {
        try {
            const docRef = doc(db, 'users', userId, 'progress', courseId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data() as Progress;
            } else {
                return INITIAL_PROGRESS;
            }
        } catch (error) {
            console.error("Error fetching progress:", error);
            return INITIAL_PROGRESS;
        }
    },

    async saveUserProgress(userId: string, courseId: string, progress: Progress): Promise<void> {
        try {
            const docRef = doc(db, 'users', userId, 'progress', courseId);
            await setDoc(docRef, progress, { merge: true });
        } catch (error) {
            console.error("Error saving progress:", error);
            throw error;
        }
    },

    async getUserNotes(userId: string): Promise<string> {
        try {
            const docRef = doc(db, 'users', userId, 'data', 'notes');
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data().content || '';
            }
            return '';
        } catch (error) {
            console.error("Error fetching notes:", error);
            return '';
        }
    },

    async saveUserNotes(userId: string, content: string): Promise<void> {
        try {
            const docRef = doc(db, 'users', userId, 'data', 'notes');
            await setDoc(docRef, { content }, { merge: true });
        } catch (error) {
            console.error("Error saving notes:", error);
            throw error;
        }
    },

    // --- Lesson-based Notes Methods ---

    async getLessonNote(userId: string, lessonId: string): Promise<{ content: string; lessonTitle: string } | null> {
        try {
            const docRef = doc(db, 'users', userId, 'notes', lessonId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                return {
                    content: data.content || '',
                    lessonTitle: data.lessonTitle || ''
                };
            }
            return null;
        } catch (error) {
            console.error("Error fetching lesson note:", error);
            return null;
        }
    },

    async saveLessonNote(userId: string, lessonId: string, lessonTitle: string, content: string): Promise<void> {
        try {
            const docRef = doc(db, 'users', userId, 'notes', lessonId);
            await setDoc(docRef, {
                lessonId,
                lessonTitle,
                content,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        } catch (error) {
            console.error("Error saving lesson note:", error);
            throw error;
        }
    },

    async getAllLessonNotes(userId: string): Promise<Array<{ lessonId: string; lessonTitle: string; updatedAt: string }>> {
        try {
            const notesRef = collection(db, 'users', userId, 'notes');
            const querySnapshot = await getDocs(notesRef);
            const notes: Array<{ lessonId: string; lessonTitle: string; updatedAt: string }> = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                notes.push({
                    lessonId: data.lessonId || doc.id,
                    lessonTitle: data.lessonTitle || 'Untitled',
                    updatedAt: data.updatedAt || ''
                });
            });

            // Sort by most recently updated
            return notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        } catch (error) {
            console.error("Error fetching all lesson notes:", error);
            return [];
        }
    },

    // --- Learning Activity Tracking ---

    /**
     * Get learning activity for the past 7 days
     */
    async getLearningActivity(userId: string): Promise<Array<{ date: string; dayLabel: string; minutes: number }>> {
        try {
            const activityRef = collection(db, 'users', userId, 'activity');
            const querySnapshot = await getDocs(activityRef);

            // Create a map of existing data
            const activityMap = new Map<string, number>();
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                activityMap.set(doc.id, data.minutes || 0);
            });

            // Generate last 7 days
            const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
            const result: Array<{ date: string; dayLabel: string; minutes: number }> = [];

            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
                const dayLabel = days[date.getDay()];

                result.push({
                    date: dateKey,
                    dayLabel,
                    minutes: activityMap.get(dateKey) || 0
                });
            }

            return result;
        } catch (error) {
            console.error("Error fetching learning activity:", error);
            return [];
        }
    },

    /**
     * Add minutes to today's learning activity
     */
    async addLearningTime(userId: string, minutesToAdd: number): Promise<void> {
        try {
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const docRef = doc(db, 'users', userId, 'activity', today);

            const existingDoc = await getDoc(docRef);
            const currentMinutes = existingDoc.exists() ? (existingDoc.data().minutes || 0) : 0;

            await setDoc(docRef, {
                date: today,
                minutes: currentMinutes + minutesToAdd,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        } catch (error) {
            console.error("Error adding learning time:", error);
            throw error;
        }
    },

    /**
     * Get today's learning time
     */
    async getTodayLearningTime(userId: string): Promise<number> {
        try {
            const today = new Date().toISOString().split('T')[0];
            const docRef = doc(db, 'users', userId, 'activity', today);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data().minutes || 0;
            }
            return 0;
        } catch (error) {
            console.error("Error getting today's learning time:", error);
            return 0;
        }
    },

    /**
     * Get user dashboard stats (XP, streak, total time)
     */
    async getUserStats(userId: string, completedLessonsCount: number): Promise<{
        totalXP: number;
        dayStreak: number;
        totalTimeMinutes: number;
    }> {
        try {
            // Calculate XP: 50 XP per completed lesson
            const totalXP = completedLessonsCount * 50;

            // Get activity data for streak and time calculation
            const activityRef = collection(db, 'users', userId, 'activity');
            const querySnapshot = await getDocs(activityRef);

            // Calculate total time from all activity
            let totalTimeMinutes = 0;
            const activityDates: string[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                totalTimeMinutes += data.minutes || 0;
                if (data.minutes > 0) {
                    activityDates.push(doc.id); // doc.id is YYYY-MM-DD format
                }
            });

            // Calculate day streak (consecutive days from today backwards)
            let dayStreak = 0;
            const today = new Date();

            for (let i = 0; i < 365; i++) {
                const checkDate = new Date(today);
                checkDate.setDate(checkDate.getDate() - i);
                const dateKey = checkDate.toISOString().split('T')[0];

                if (activityDates.includes(dateKey)) {
                    dayStreak++;
                } else if (i > 0) {
                    // Allow today to be skipped (streak continues from yesterday)
                    break;
                }
            }

            return {
                totalXP,
                dayStreak,
                totalTimeMinutes
            };
        } catch (error) {
            console.error("Error getting user stats:", error);
            return {
                totalXP: completedLessonsCount * 50,
                dayStreak: 0,
                totalTimeMinutes: 0
            };
        }
    }
};

