import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/dbService';

const STORAGE_KEY = 'voicecode_stopwatch_start_time';

interface StopwatchWidgetProps {
    onTimeUpdate?: (seconds: number) => void;
}

/**
 * StopwatchWidget - Real-time learning timer with daily stats
 * Shows a running stopwatch, start/stop controls, and per-day breakdown
 * Timer persists across page navigation using localStorage
 */
export const StopwatchWidget: React.FC<StopwatchWidgetProps> = ({ onTimeUpdate }) => {
    const { user } = useAuth();
    const [isRunning, setIsRunning] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [todayTotal, setTodayTotal] = useState(0);
    const [weeklyData, setWeeklyData] = useState<Array<{ day: string; minutes: number }>>([]);
    const [isLoading, setIsLoading] = useState(true);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Format seconds to HH:MM:SS
    const formatTime = (totalSeconds: number): string => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Format minutes to display string
    const formatMinutes = (mins: number): string => {
        if (mins >= 60) {
            const h = Math.floor(mins / 60);
            const m = mins % 60;
            return `${h}h ${m}m`;
        }
        return `${mins}m`;
    };

    // Fetch weekly data from Firebase
    const fetchWeeklyData = useCallback(async () => {
        if (!user) {
            setWeeklyData([]);
            setTodayTotal(0);
            setIsLoading(false);
            return;
        }

        try {
            const activity = await dbService.getLearningActivity(user.id);
            const formattedData = activity.map(a => ({
                day: a.dayLabel,
                minutes: a.minutes
            }));
            setWeeklyData(formattedData);

            // Today is the last item in the array
            const today = formattedData[formattedData.length - 1]?.minutes || 0;
            setTodayTotal(today);
        } catch (error) {
            console.error('Error fetching weekly data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Check for persisted timer on mount and restore if running
    useEffect(() => {
        fetchWeeklyData();

        const savedStartTime = localStorage.getItem(STORAGE_KEY);
        if (savedStartTime) {
            const startTime = parseInt(savedStartTime, 10);
            const elapsed = Math.floor((Date.now() - startTime) / 1000);

            if (elapsed > 0 && elapsed < 86400) { // Less than 24 hours
                setElapsedSeconds(elapsed);
                setIsRunning(true);

                // Start the interval to update display
                intervalRef.current = setInterval(() => {
                    const newElapsed = Math.floor((Date.now() - startTime) / 1000);
                    setElapsedSeconds(newElapsed);
                    onTimeUpdate?.(newElapsed);
                }, 1000);
            } else {
                // Clear stale timer
                localStorage.removeItem(STORAGE_KEY);
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [fetchWeeklyData, onTimeUpdate]);

    // Start the stopwatch
    const startTimer = useCallback(() => {
        if (isRunning) return;

        const startTime = Date.now();
        localStorage.setItem(STORAGE_KEY, startTime.toString());

        setIsRunning(true);
        setElapsedSeconds(0);

        intervalRef.current = setInterval(() => {
            const newElapsed = Math.floor((Date.now() - startTime) / 1000);
            setElapsedSeconds(newElapsed);
            onTimeUpdate?.(newElapsed);
        }, 1000);
    }, [isRunning, onTimeUpdate]);

    // Stop the stopwatch and save time
    const stopTimer = useCallback(async () => {
        if (!isRunning) return;

        setIsRunning(false);
        localStorage.removeItem(STORAGE_KEY);

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // Save elapsed time to Firebase (convert seconds to minutes, minimum 1 minute)
        if (user && elapsedSeconds > 0) {
            const minutesToSave = Math.max(1, Math.round(elapsedSeconds / 60));
            await dbService.addLearningTime(user.id, minutesToSave);

            // Refresh data
            await fetchWeeklyData();
        }

        // Reset stopwatch
        setElapsedSeconds(0);
    }, [isRunning, user, elapsedSeconds, fetchWeeklyData]);

    // Reset without saving
    const resetTimer = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        localStorage.removeItem(STORAGE_KEY);
        setIsRunning(false);
        setElapsedSeconds(0);
    }, []);

    // Calculate weekly total
    const weeklyTotal = weeklyData.reduce((acc, d) => acc + d.minutes, 0);

    return (
        <div className="bg-gradient-to-br from-zinc-900/80 via-zinc-900/60 to-zinc-800/40 border border-white/10 rounded-[2rem] p-8 relative overflow-hidden backdrop-blur-xl shadow-2xl">
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-gradient-to-r from-orange-500/20 via-pink-500/10 to-purple-500/20 blur-[80px] rounded-full pointer-events-none"></div>

            {/* Header */}
            <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                    <h3 className="text-2xl font-bold text-white font-manrope flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <i className="fas fa-stopwatch text-white"></i>
                        </div>
                        Learning Timer
                    </h3>
                    <p className="text-zinc-400 text-sm mt-2 ml-[52px]">Track your learning sessions</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'}`}></div>
                    {isRunning ? 'Recording' : 'Paused'}
                </div>
            </div>

            {/* Main Stopwatch Display */}
            <div className="relative z-10 bg-black/30 rounded-2xl p-8 border border-white/5 mb-6">
                <div className="text-center">
                    {/* Timer Display */}
                    <div className={`text-6xl md:text-7xl font-bold font-mono tracking-wider mb-6 transition-all duration-300 ${isRunning ? 'text-orange-400 drop-shadow-[0_0_30px_rgba(249,115,22,0.5)]' : 'text-white'}`}>
                        {formatTime(elapsedSeconds)}
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-center gap-4">
                        {!isRunning ? (
                            <button
                                onClick={startTimer}
                                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-lg flex items-center gap-3 hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-lg shadow-emerald-500/25 hover:scale-105"
                            >
                                <i className="fas fa-play"></i>
                                Start Learning
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={stopTimer}
                                    className="px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold text-lg flex items-center gap-3 hover:from-orange-500 hover:to-orange-400 transition-all shadow-lg shadow-orange-500/25 hover:scale-105"
                                >
                                    <i className="fas fa-stop"></i>
                                    Stop & Save
                                </button>
                                <button
                                    onClick={resetTimer}
                                    className="p-4 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all border border-white/5"
                                    title="Reset without saving"
                                >
                                    <i className="fas fa-undo"></i>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Today's Progress */}
            <div className="relative z-10 bg-black/20 rounded-2xl p-6 border border-white/5 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-zinc-400 text-sm font-medium">Today's Total</span>
                    <span className="text-2xl font-bold text-orange-400 font-manrope">
                        {isLoading ? '...' : formatMinutes(todayTotal + Math.floor(elapsedSeconds / 60))}
                    </span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-orange-600 to-orange-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, ((todayTotal + Math.floor(elapsedSeconds / 60)) / 60) * 100)}%` }}
                    ></div>
                </div>
                <p className="text-xs text-zinc-500 mt-2">Goal: 60 minutes per day</p>
            </div>

            {/* Weekly Breakdown */}
            <div className="relative z-10">
                <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">This Week</h4>
                <div className="grid grid-cols-7 gap-2">
                    {weeklyData.map((day, index) => {
                        const isToday = index === weeklyData.length - 1;
                        const height = Math.min(100, (day.minutes / 60) * 100);

                        return (
                            <div key={day.day} className="flex flex-col items-center gap-2">
                                {/* Bar */}
                                <div className="w-full h-20 bg-zinc-800/50 rounded-lg flex items-end overflow-hidden relative group">
                                    <div
                                        className={`w-full rounded-t-lg transition-all duration-500 ${isToday ? 'bg-gradient-to-t from-orange-600 to-orange-400' : 'bg-gradient-to-t from-zinc-600 to-zinc-500'}`}
                                        style={{ height: `${Math.max(height, 5)}%` }}
                                    ></div>
                                    {/* Tooltip */}
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 border border-white/10">
                                        {day.minutes}m
                                    </div>
                                </div>
                                {/* Label */}
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-orange-400' : 'text-zinc-500'}`}>
                                    {day.day.substring(0, 2)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Summary Stats */}
            <div className="flex justify-around mt-6 pt-6 border-t border-white/5 relative z-10">
                <div className="text-center">
                    <p className="text-2xl font-bold text-white font-manrope">{formatMinutes(weeklyTotal)}</p>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">This Week</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-400 font-manrope">{Math.round(weeklyTotal / 7)}</p>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Daily Avg (min)</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-orange-400 font-manrope">{weeklyData.filter(d => d.minutes > 0).length}</p>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Active Days</p>
                </div>
            </div>
        </div>
    );
};

export default StopwatchWidget;
