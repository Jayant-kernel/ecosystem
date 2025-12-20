import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/dbService';

interface UserStats {
    totalXP: number;
    dayStreak: number;
    totalTimeMinutes: number;
    isLoading: boolean;
}

/**
 * Hook to fetch real-time user stats (XP, streak, time spent)
 */
export const useUserStats = (completedLessonsCount: number): UserStats => {
    const { user } = useAuth();
    const [stats, setStats] = useState<UserStats>({
        totalXP: 0,
        dayStreak: 0,
        totalTimeMinutes: 0,
        isLoading: true
    });

    const fetchStats = useCallback(async () => {
        if (!user) {
            setStats({
                totalXP: 0,
                dayStreak: 0,
                totalTimeMinutes: 0,
                isLoading: false
            });
            return;
        }

        try {
            const userStats = await dbService.getUserStats(user.id, completedLessonsCount);
            setStats({
                ...userStats,
                isLoading: false
            });
        } catch (error) {
            console.error('Error fetching user stats:', error);
            setStats({
                totalXP: completedLessonsCount * 50,
                dayStreak: 0,
                totalTimeMinutes: 0,
                isLoading: false
            });
        }
    }, [user, completedLessonsCount]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return stats;
};

/**
 * Format minutes to a human-readable time string
 */
export const formatTimeSpent = (minutes: number): string => {
    if (minutes < 60) {
        return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
        return `${hours}h`;
    }
    return `${hours}h ${mins}m`;
};
