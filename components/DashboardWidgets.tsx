
import React from 'react';

// --- Types ---
export interface ChartData {
    label: string;
    value: number; // 0-100
}

export interface DailyGoal {
    id: string;
    title: string;
    completed: boolean;
}

// --- Components ---

/**
 * StatCard: Displays a single metric with an icon and label.
 * Inspired by the "Yellow" dashboard top stats.
 */
export const StatCard: React.FC<{
    label: string;
    value: string | number;
    icon: string;
    trend?: string;
}> = ({ label, value, icon, trend }) => {
    return (
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden group hover:border-orange-500/20 transition-all cursor-default backdrop-blur-sm">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <i className={`fas ${icon} text-5xl text-orange-500`}></i>
            </div>
            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 text-xl mb-3 border border-orange-500/20 shadow-[0_0_15px_-3px_rgba(249,115,22,0.3)]">
                <i className={`fas ${icon}`}></i>
            </div>
            <h3 className="text-3xl font-bold text-white font-manrope">{value}</h3>
            <p className="text-zinc-500 text-sm font-medium uppercase tracking-wide mt-1">{label}</p>
            {trend && (
                <div className="absolute top-4 right-4 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {trend}
                </div>
            )}
        </div>
    );
};

/**
 * ActivityChart: A beautiful bar chart visualization of learning activity.
 * Features colorful gradients, glowing effects, and modern aesthetics.
 */
export const ActivityChart: React.FC<{ data: ChartData[] }> = ({ data }) => {
    // Colors for each day - creates a rainbow effect
    const barColors = [
        { from: 'from-violet-500', to: 'to-purple-400', shadow: 'shadow-violet-500/30', glow: 'bg-violet-500/20' },
        { from: 'from-blue-500', to: 'to-cyan-400', shadow: 'shadow-blue-500/30', glow: 'bg-blue-500/20' },
        { from: 'from-emerald-500', to: 'to-teal-400', shadow: 'shadow-emerald-500/30', glow: 'bg-emerald-500/20' },
        { from: 'from-orange-500', to: 'to-amber-400', shadow: 'shadow-orange-500/30', glow: 'bg-orange-500/20' },
        { from: 'from-pink-500', to: 'to-rose-400', shadow: 'shadow-pink-500/30', glow: 'bg-pink-500/20' },
        { from: 'from-indigo-500', to: 'to-blue-400', shadow: 'shadow-indigo-500/30', glow: 'bg-indigo-500/20' },
        { from: 'from-fuchsia-500', to: 'to-pink-400', shadow: 'shadow-fuchsia-500/30', glow: 'bg-fuchsia-500/20' },
    ];

    const maxValue = Math.max(...data.map(d => d.value), 1);

    return (
        <div className="bg-gradient-to-br from-zinc-900/80 via-zinc-900/60 to-zinc-800/40 border border-white/10 rounded-[2rem] p-8 relative overflow-hidden backdrop-blur-xl shadow-2xl">
            {/* Background animated glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-gradient-to-r from-violet-500/10 via-orange-500/10 to-pink-500/10 blur-[80px] rounded-full pointer-events-none"></div>

            {/* Decorative corner accents */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent rounded-br-full"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-purple-500/10 to-transparent rounded-tl-full"></div>

            {/* Header */}
            <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                    <h3 className="text-2xl font-bold text-white font-manrope flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <i className="fas fa-chart-bar text-white"></i>
                        </div>
                        Learning Activity
                    </h3>
                    <p className="text-zinc-400 text-sm mt-2 ml-[52px]">Your daily focus time this week</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        Live
                    </div>
                    <select className="bg-black/40 border border-white/10 text-sm text-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:border-orange-500/50 hover:border-white/20 transition-colors cursor-pointer">
                        <option>This Week</option>
                        <option>Last Week</option>
                        <option>This Month</option>
                    </select>
                </div>
            </div>

            {/* Chart Area */}
            <div className="relative z-10 bg-black/20 rounded-2xl p-6 border border-white/5">
                {/* Y-Axis Labels */}
                <div className="absolute left-0 top-6 bottom-16 w-12 flex flex-col justify-between text-right pr-2 pointer-events-none">
                    <span className="text-[10px] text-zinc-500 font-mono">100m</span>
                    <span className="text-[10px] text-zinc-500 font-mono">75m</span>
                    <span className="text-[10px] text-zinc-500 font-mono">50m</span>
                    <span className="text-[10px] text-zinc-500 font-mono">25m</span>
                    <span className="text-[10px] text-zinc-500 font-mono">0m</span>
                </div>

                {/* Grid Lines */}
                <div className="absolute inset-x-16 top-6 bottom-16 flex flex-col justify-between pointer-events-none">
                    {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className="border-t border-dashed border-white/5 w-full"></div>
                    ))}
                </div>

                {/* Bars Container */}
                <div className="flex items-end justify-around h-52 gap-3 md:gap-6 ml-12 relative">
                    {data.map((item, index) => {
                        const colors = barColors[index % barColors.length];
                        const heightPercent = (item.value / maxValue) * 100;

                        return (
                            <div key={index} className="flex flex-col items-center gap-4 flex-1 group cursor-pointer">
                                {/* Bar Container */}
                                <div className="relative w-full max-w-[60px] h-[180px] flex items-end justify-center">
                                    {/* Glow effect behind bar */}
                                    <div
                                        className={`absolute bottom-0 w-full ${colors.glow} blur-xl rounded-full transition-all duration-500 group-hover:blur-2xl`}
                                        style={{ height: `${heightPercent}%` }}
                                    ></div>

                                    {/* Main bar */}
                                    <div
                                        className={`relative w-full bg-gradient-to-t ${colors.from} ${colors.to} rounded-xl transition-all duration-700 ease-out shadow-lg ${colors.shadow} group-hover:scale-105 group-hover:shadow-xl`}
                                        style={{ height: `${Math.max(heightPercent, 5)}%` }}
                                    >
                                        {/* Shine effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-xl opacity-50"></div>

                                        {/* Top highlight */}
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-white/30 rounded-full"></div>

                                        {/* Value tooltip */}
                                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-zinc-800/90 backdrop-blur-sm text-white text-xs font-bold py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 border border-white/10 shadow-xl whitespace-nowrap z-30 pointer-events-none transform group-hover:-translate-y-1">
                                            <span className={`bg-gradient-to-r ${colors.from} ${colors.to} bg-clip-text text-transparent`}>{item.value}</span> mins
                                            <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-zinc-800/90 border-b border-r border-white/10 rotate-45`}></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Day label */}
                                <span className={`text-xs font-bold uppercase tracking-wider transition-all duration-300 ${item.value === Math.max(...data.map(d => d.value)) ? 'text-orange-400' : 'text-zinc-500 group-hover:text-white'}`}>
                                    {item.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Summary stats */}
            <div className="flex justify-around mt-6 pt-6 border-t border-white/5 relative z-10">
                <div className="text-center">
                    <p className="text-2xl font-bold text-white font-manrope">{data.reduce((acc, d) => acc + d.value, 0)}</p>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Total Mins</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-400 font-manrope">{Math.max(...data.map(d => d.value))}</p>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Best Day</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-orange-400 font-manrope">{Math.round(data.reduce((acc, d) => acc + d.value, 0) / data.length)}</p>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Daily Avg</p>
                </div>
            </div>
        </div>
    );
};

/**
 * DailyGoalsWidget: A list of daily tasks/achievements.
 * Inspired by the "Purple" dashboard tasks list.
 */
export const DailyGoalsWidget: React.FC<{ goals: DailyGoal[]; onToggle: (id: string) => void }> = ({ goals, onToggle }) => {
    return (
        <div className="bg-zinc-900/40 border border-white/5 rounded-[2rem] p-6 backdrop-blur-sm h-full flex flex-col">
            <h3 className="text-lg font-bold text-white font-manrope mb-6 flex items-center gap-2">
                <i className="fas fa-bullseye text-orange-500"></i> Daily Quests
            </h3>

            <div className="space-y-4 flex-grow">
                {goals.map((goal) => (
                    <div key={goal.id} className="flex items-center gap-4 group cursor-pointer" onClick={() => onToggle(goal.id)}>
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${goal.completed ? 'bg-orange-500 border-orange-500' : 'border-zinc-700 bg-zinc-800/50 group-hover:border-orange-500/50'}`}>
                            {goal.completed && <i className="fas fa-check text-white text-xs"></i>}
                        </div>
                        <div className="flex-1">
                            <p className={`text-sm font-medium transition-colors ${goal.completed ? 'text-zinc-500 line-through' : 'text-gray-200 group-hover:text-white'}`}>
                                {goal.title}
                            </p>
                        </div>
                        {goal.completed && (
                            <span className="text-xs font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                                +50 XP
                            </span>
                        )}
                    </div>
                ))}
            </div>

            <button className="mt-6 w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors border border-white/5">
                View All Quests
            </button>
        </div>
    );
};
