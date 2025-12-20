import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/dbService';

export interface ActivityData {
    label: string;
    value: number;
}

interface UseLearningActivityReturn {
    activityData: ActivityData[];
    isLoading: boolean;
    todayMinutes: number;
    startTracking: () => void;
    stopTracking: () => void;
    isTracking: boolean;
    refreshActivity: () => Promise<void>;
}

/**
 * Hook to track and manage learning activity time
 * - Automatically tracks time spent in lessons
 * - Stores data in Firebase per day
 * - Returns data formatted for the ActivityChart
 */
export const useLearningActivity = (): UseLearningActivityReturn => {
    const { user } = useAuth();
    const [activityData, setActivityData] = useState<ActivityData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [todayMinutes, setTodayMinutes] = useState(0);
    const [isTracking, setIsTracking] = useState(false);

    // Track elapsed time
    const trackingStartTime = useRef<number | null>(null);
    const trackingInterval = useRef<NodeJS.Timeout | null>(null);

    // Fetch activity data from Firebase
    const fetchActivity = useCallback(async () => {
        if (!user) {
            // Return demo data for non-logged-in users
            setActivityData([
                { label: 'MON', value: 0 },
                { label: 'TUE', value: 0 },
                { label: 'WED', value: 0 },
                { label: 'THU', value: 0 },
                { label: 'FRI', value: 0 },
                { label: 'SAT', value: 0 },
                { label: 'SUN', value: 0 },
            ]);
            setIsLoading(false);
            return;
        }

        try {
            const activity = await dbService.getLearningActivity(user.id);
            const formattedData: ActivityData[] = activity.map(a => ({
                label: a.dayLabel,
                value: a.minutes
            }));
            setActivityData(formattedData);

            // Get today's minutes
            const today = await dbService.getTodayLearningTime(user.id);
            setTodayMinutes(today);
        } catch (error) {
            console.error('Error fetching activity:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Start tracking time
    const startTracking = useCallback(() => {
        if (!user || isTracking) return;

        setIsTracking(true);
        trackingStartTime.current = Date.now();

        // Update every minute
        trackingInterval.current = setInterval(async () => {
            if (trackingStartTime.current && user) {
                const elapsedMinutes = Math.floor((Date.now() - trackingStartTime.current) / 60000);

                if (elapsedMinutes > 0) {
                    // Save elapsed time and reset
                    await dbService.addLearningTime(user.id, elapsedMinutes);
                    trackingStartTime.current = Date.now();

                    // Refresh local state
                    const today = await dbService.getTodayLearningTime(user.id);
                    setTodayMinutes(today);
                }
            }
        }, 60000); // Check every minute
    }, [user, isTracking]);

    // Stop tracking and save remaining time
    const stopTracking = useCallback(async () => {
        if (!user || !isTracking || !trackingStartTime.current) return;

        setIsTracking(false);

        // Clear interval
        if (trackingInterval.current) {
            clearInterval(trackingInterval.current);
            trackingInterval.current = null;
        }

        // Calculate and save remaining time (at least 1 minute if they spent any time)
        const elapsedMs = Date.now() - trackingStartTime.current;
        const elapsedMinutes = Math.max(1, Math.floor(elapsedMs / 60000));

        await dbService.addLearningTime(user.id, elapsedMinutes);
        trackingStartTime.current = null;

        // Refresh activity data
        await fetchActivity();
    }, [user, isTracking, fetchActivity]);

    // Refresh function for manual updates
    const refreshActivity = useCallback(async () => {
        setIsLoading(true);
        await fetchActivity();
    }, [fetchActivity]);

    // Fetch activity on mount
    useEffect(() => {
        fetchActivity();
    }, [fetchActivity]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (trackingInterval.current) {
                clearInterval(trackingInterval.current);
            }
        };
    }, []);

    return {
        activityData,
        isLoading,
        todayMinutes,
        startTracking,
        stopTracking,
        isTracking,
        refreshActivity
    };
};
