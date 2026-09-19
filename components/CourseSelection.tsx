import React, { useEffect, useState } from 'react';
import { View } from '../App';
import { CinematicHero } from './cinematic-hero';

interface LandingPageProps {
    navigateTo: (view: View) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ navigateTo }) => {

    // Initialize animations on mount
    useEffect(() => {
        if ((window as any).initInViewAnimations) {
            (window as any).initInViewAnimations();
        }
    }, []);

    return (
        <div className="min-h-screen bg-background relative overflow-x-clip">

            <CinematicHero navigateTo={navigateTo} />

            {/* Features Section */}
            <section className="z-20 overflow-hidden w-full max-w-7xl mx-auto px-6 py-32 relative">
                <div className="mb-24">
                    <h2 className="text-5xl md:text-7xl font-medium text-white tracking-tighter font-manrope mb-8 leading-[1.1]">
                        Coding at the speed of <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">sound.</span>
                    </h2>
                    <p className="text-xl text-zinc-400 font-sans max-w-2xl leading-relaxed">
                        Ecosystem transforms your spoken intent into syntactically correct code, managing boilerplate and logic so you can focus on architecture.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Feature 1 */}
                    <div className="group relative bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-10 hover:bg-zinc-900/60 transition-all duration-500 overflow-hidden md:col-span-2">
                        <div className="absolute top-0 right-0 p-10 opacity-20 group-hover:opacity-40 transition-opacity">
                            <i className="fas fa-microphone-lines text-9xl text-orange-500"></i>
                        </div>
                        <div className="relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-8 border border-white/5">
                                <i className="fas fa-wave-square text-orange-500 text-2xl"></i>
                            </div>
                            <h3 className="text-3xl font-medium text-white font-manrope mb-4">Natural Language Processing</h3>
                            <p className="text-zinc-500 font-sans leading-relaxed max-w-md">
                                Our advanced NLP engine understands context, nuance, and programming jargon. Just describe what you want, and watch the code generate in real-time.
                            </p>
                        </div>
                    </div>

                    {/* Feature 2 */}
                    <div className="group relative bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-10 hover:bg-zinc-900/60 transition-all duration-500 overflow-hidden">
                        <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-orange-500/10 blur-[100px] rounded-full group-hover:bg-orange-500/20 transition-all"></div>
                        <div className="relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-8 border border-white/5">
                                <i className="fas fa-bolt text-white text-2xl"></i>
                            </div>
                            <h3 className="text-3xl font-medium text-white font-manrope mb-4">Instant Execution</h3>
                            <p className="text-zinc-500 font-sans leading-relaxed">
                                Run and test snippets immediately. No context switching between IDE and documentation.
                            </p>
                        </div>
                    </div>

                    {/* Feature 3 */}
                    <div className="group relative bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-10 hover:bg-zinc-900/60 transition-all duration-500 overflow-hidden">
                        <div className="relative z-10">
                            <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-8 border border-white/5">
                                <i className="fas fa-bug text-white text-2xl"></i>
                            </div>
                            <h3 className="text-3xl font-medium text-white font-manrope mb-4">Live Debugging</h3>
                            <p className="text-zinc-500 font-sans leading-relaxed">
                                Encounter an error? Just ask "What went wrong?" and get an instant, conversational explanation and fix.
                            </p>
                        </div>
                    </div>

                    {/* Feature 4 */}
                    <div className="group relative bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-10 hover:bg-zinc-900/60 transition-all duration-500 overflow-hidden md:col-span-2">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.1)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                            <div>
                                <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-8 border border-white/5">
                                    <i className="fas fa-graduation-cap text-orange-500 text-2xl"></i>
                                </div>
                                <h3 className="text-3xl font-medium text-white font-manrope mb-4">Interactive Curriculum</h3>
                                <p className="text-zinc-500 font-sans leading-relaxed">
                                    Structured courses that adapt to your pace. Learn JavaScript, Python, and React through hands-on voice-guided exercises.
                                </p>
                            </div>
                            <div className="bg-zinc-950/50 rounded-2xl p-6 border border-white/5 font-mono text-sm text-zinc-400">
                                <div className="flex gap-2 mb-4">
                                    <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
                                </div>
                                <div className="space-y-2">
                                    <p><span className="text-purple-400">const</span> <span className="text-blue-400">greeting</span> = <span className="text-orange-400">"Hello, Ecosystem!"</span>;</p>
                                    <p><span className="text-purple-400">function</span> <span className="text-blue-400">speak</span>() {'{'}</p>
                                    <p className="pl-4"><span className="text-zinc-500">// Just say it...</span></p>
                                    <p className="pl-4">console.<span className="text-yellow-400">log</span>(greeting);</p>
                                    <p>{'}'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mobile / App Demo Section */}
            <section className="z-20 overflow-hidden w-full max-w-7xl mx-auto px-6 py-20 relative">

                {/* Background Large Typography */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full select-none pointer-events-none z-0">
                    <h2 className="text-[12vw] leading-none font-bold text-white/[0.03] text-center whitespace-nowrap font-manrope tracking-tighter">
                        MOBILE EDITOR
                    </h2>
                </div>

                <div className="grid lg:grid-cols-12 gap-8 items-center relative z-10">

                    {/* Left Column: Text Content */}
                    <div className="lg:col-span-4 flex flex-col justify-center order-2 lg:order-1">
                        <div className="flex items-center gap-2 mb-6 opacity-60">
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                            <span className="text-xs font-mono text-gray-400 tracking-widest">02/04</span>
                        </div>

                        <h3 className="leading-[1.1] uppercase md:text-7xl text-4xl font-normal text-white tracking-tight font-manrope mb-8">
                            Coding
                            Unbound
                            <span className="text-gray-500">Freedom &amp;</span>
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-orange-200">Speed</span>
                        </h3>

                        <div className="hidden lg:block h-px w-24 bg-white/10 mt-4"></div>
                    </div>

                    {/* Center Column: Phone Mockup (Chat Interface) */}
                    <div className="lg:col-span-4 flex order-1 lg:order-2 lg:py-0 pt-12 pb-12 relative justify-center">
                        {/* Glow Effect */}
                        <div className="-translate-x-1/2 -translate-y-1/2 blur-[100px] pointer-events-none bg-orange-500/20 w-64 h-96 rounded-full absolute top-1/2 left-1/2"></div>

                        {/* Phone Frame */}
                        <div className="border-[1px] overflow-hidden bg-zinc-950 w-[330px] h-[660px] z-10 border-zinc-800 rounded-[3.5rem] ring-white/10 ring-1 relative shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">

                            {/* Dynamic Island */}
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 h-[32px] w-[110px] bg-black rounded-full z-50 flex items-center justify-between px-3 transition-all duration-500 hover:w-[140px] group/island">
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-1.5">
                                    <div className="w-4 h-4 rounded-full bg-zinc-900/80 backdrop-blur-md border border-white/5"></div>
                                </div>
                            </div>

                            {/* Status Bar */}
                            <div className="absolute top-4 left-0 w-full px-8 flex justify-between items-center z-40 text-[10px] font-semibold text-white/90 tracking-wide">
                                <span>9:41</span>
                                <div className="flex gap-1.5 items-center">
                                    <i className="fas fa-signal"></i>
                                    <i className="fas fa-wifi"></i>
                                    <i className="fas fa-battery-full"></i>
                                </div>
                            </div>

                            {/* App Content */}
                            <div className="flex flex-col z-10 bg-gradient-to-b from-zinc-900 to-black w-full h-full pt-16 relative">

                                {/* Header */}
                                <div className="flex z-10 mb-6 px-6 relative items-center justify-between">
                                    <button className="flex hover:bg-white/10 transition-colors text-white/70 bg-white/5 w-8 h-8 rounded-full items-center justify-center border border-white/5">
                                        <i className="fas fa-arrow-left text-xs"></i>
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse"></div>
                                        <span className="text-sm font-semibold text-white tracking-wide">Ecosystem</span>
                                    </div>
                                    <button className="flex hover:bg-white/10 transition-colors text-white/70 bg-white/5 w-8 h-8 rounded-full items-center justify-center border border-white/5">
                                        <i className="fas fa-ellipsis-h text-xs"></i>
                                    </button>
                                </div>

                                {/* Chat Area */}
                                <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-4">
                                    {/* AI Message */}
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/20 flex-shrink-0">
                                            <i className="fas fa-robot text-orange-500 text-xs"></i>
                                        </div>
                                        <div className="bg-zinc-800/80 rounded-2xl rounded-tl-none p-3 border border-white/5 max-w-[85%]">
                                            <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                                                I've analyzed your component. The <span className="text-orange-400 font-mono">useEffect</span> dependency array is missing <span className="text-orange-400 font-mono">userData</span>. Should I fix it?
                                            </p>
                                        </div>
                                    </div>

                                    {/* User Message */}
                                    <div className="flex gap-3 flex-row-reverse">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10 flex-shrink-0">
                                            <i className="fas fa-user text-white text-xs"></i>
                                        </div>
                                        <div className="bg-orange-500/20 rounded-2xl rounded-tr-none p-3 border border-orange-500/20 max-w-[85%]">
                                            <p className="text-xs text-orange-100 font-sans leading-relaxed">
                                                Yes, please fix it and explain why that causes a bug.
                                            </p>
                                        </div>
                                    </div>

                                    {/* AI Message */}
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/20 flex-shrink-0">
                                            <i className="fas fa-robot text-orange-500 text-xs"></i>
                                        </div>
                                        <div className="bg-zinc-800/80 rounded-2xl rounded-tl-none p-3 border border-white/5 max-w-[85%]">
                                            <p className="text-xs text-zinc-300 font-sans leading-relaxed mb-2">
                                                Done. Without it, the effect references stale data from the first render. Here represents the fix:
                                            </p>
                                            <div className="bg-black/50 rounded-lg p-2 font-mono text-[10px] text-zinc-400 border border-white/5">
                                                <span className="text-purple-400">useEffect</span>(() =&gt; {'{'}<br />
                                                &nbsp;&nbsp;fetchData(userData.id);<br />
                                                {'}'}, [<span className="text-green-400">userData</span>]);
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Voice Input Controls */}
                                <div className="p-6 bg-zinc-900/80 backdrop-blur-md border-t border-white/5 rounded-t-[2.5rem]">
                                    <div className="flex items-center justify-center gap-6 mb-6">
                                        <button className="w-10 h-10 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all">
                                            <i className="fas fa-keyboard"></i>
                                        </button>
                                        <button className="w-16 h-16 rounded-full bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)] flex items-center justify-center text-white hover:scale-105 transition-transform">
                                            <i className="fas fa-microphone text-2xl"></i>
                                        </button>
                                        <button className="w-10 h-10 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all">
                                            <i className="fas fa-paper-plane"></i>
                                        </button>
                                    </div>
                                    <p className="text-center text-[10px] text-zinc-500 uppercase tracking-widest">Listening...</p>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Right Column: Cards */}
                    <div className="lg:col-span-4 flex flex-col gap-5 lg:items-end order-3 justify-center relative z-10">

                        {/* Card 1: Stats */}
                        <div className="transition-transform duration-500 hover:scale-[1.01] text-left bg-gradient-to-br from-white/10 to-white/0 w-full max-w-sm rounded-3xl p-5 shadow-2xl backdrop-blur-xl border border-white/10">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 p-0.5 shadow-lg shadow-orange-500/20">
                                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                                        <i className="fas fa-trophy text-orange-500"></i>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white tracking-tight font-manrope">Daily Streak</h3>
                                    <p className="text-xs font-medium text-zinc-400 font-sans">Level 5 · Apprentice</p>
                                </div>
                                <div className="ml-auto">
                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></div>
                                </div>
                            </div>

                            <div className="flex justify-between gap-2 mb-5">
                                <div className="flex flex-col flex-1 bg-white/5 rounded-2xl p-3 border border-white/5">
                                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-sans">XP Today</span>
                                    <span className="text-sm font-semibold text-white font-geist">1,250</span>
                                </div>
                                <div className="flex flex-col flex-1 bg-white/5 rounded-2xl p-3 border border-white/5">
                                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-sans">Fixes</span>
                                    <span className="text-sm font-semibold text-white font-geist">14</span>
                                </div>
                                <div className="flex flex-col flex-1 bg-white/5 rounded-2xl p-3 border border-white/5">
                                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 font-sans">Time</span>
                                    <span className="text-sm font-semibold text-white font-geist">2.4h</span>
                                </div>
                            </div>

                            <button className="flex gap-2 w-full rounded-full py-2.5 items-center justify-center bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-xs font-medium text-white">
                                View Profile <i className="fas fa-arrow-right text-[10px]"></i>
                            </button>
                        </div>

                        {/* Card 2: Quick Commands */}
                        <div className="transition-transform duration-500 hover:scale-[1.01] text-left bg-gradient-to-br from-white/10 to-white/0 w-full max-w-sm rounded-3xl p-5 shadow-xl backdrop-blur-xl border border-white/10">
                            <p className="text-sm text-zinc-400 leading-relaxed mb-4 font-sans">
                                Control your entire development environment with simple natural language commands.
                            </p>
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-zinc-300 bg-white/5 border border-white/5 rounded-full px-2.5 py-1">
                                    <i className="fas fa-magic text-orange-400"></i> Refactor
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-zinc-300 bg-white/5 border border-white/5 rounded-full px-2.5 py-1">
                                    <i className="fas fa-bug text-orange-400"></i> Debug
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-zinc-300 bg-white/5 border border-white/5 rounded-full px-2.5 py-1">
                                    <i className="fas fa-book text-orange-400"></i> Explain
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button className="flex-1 flex items-center justify-between rounded-xl bg-zinc-950/50 border border-white/5 px-3 py-2 hover:border-white/20 transition-colors group">
                                    <span className="text-xs text-zinc-300 font-medium font-sans">Docs</span>
                                    <i className="fas fa-external-link-alt text-[10px] text-zinc-500 group-hover:text-white"></i>
                                </button>
                                <button className="flex-1 flex items-center justify-between rounded-xl bg-zinc-950/50 border border-white/5 px-3 py-2 hover:border-white/20 transition-colors group">
                                    <span className="text-xs text-zinc-300 font-medium font-sans">Settings</span>
                                    <i className="fas fa-cog text-[10px] text-zinc-500 group-hover:text-white"></i>
                                </button>
                            </div>
                        </div>

                        {/* Card 3: Recent Sessions */}
                        <div className="transition-transform duration-500 hover:scale-[1.01] text-left bg-gradient-to-br from-white/10 to-white/0 w-full max-w-sm rounded-3xl p-5 shadow-xl backdrop-blur-xl border border-white/10">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-sans">Recent Sessions</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping"></div>
                                </div>
                                <button className="text-[10px] font-medium text-zinc-400 hover:text-white transition-colors font-sans underline decoration-zinc-700 underline-offset-2">View all</button>
                            </div>
                            <div className="space-y-2">
                                <div className="group rounded-xl bg-zinc-950/50 border border-white/5 p-2.5 flex items-center gap-3 hover:bg-white/[0.02] hover:border-white/10 transition-colors cursor-pointer">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                                        <i className="fab fa-react text-blue-400"></i>
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-medium text-zinc-200 truncate font-geist">React Hooks Mastery</span>
                                        <span className="text-[10px] text-zinc-500 font-mono">15m ago · 98% Accuracy</span>
                                    </div>
                                </div>
                                <div className="group rounded-xl bg-zinc-950/50 border border-white/5 p-2.5 flex items-center gap-3 hover:bg-white/[0.02] hover:border-white/10 transition-colors cursor-pointer">
                                    <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                                        <i className="fab fa-js text-yellow-400"></i>
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-medium text-zinc-200 truncate font-geist">Async/Await Basics</span>
                                        <span className="text-[10px] text-zinc-500 font-mono">2h ago · Completed</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="w-full max-w-7xl mx-auto px-6 py-20 relative z-20">
                <div className="flex flex-col text-center mb-20 items-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/20 bg-orange-500/5 mb-6">
                        <i className="fas fa-star text-orange-500 text-xs"></i>
                        <span className="text-xs font-semibold text-orange-200 uppercase tracking-widest font-sans">Testimonials</span>
                    </div>
                    <h2 className="md:text-7xl text-5xl font-medium text-white tracking-tighter font-manrope mb-6">Proven results,
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-500"> delivered</span>
                    </h2>
                    <p className="text-xl text-gray-400 font-sans max-w-2xl leading-relaxed">
                        See how developers are mastering code faster with Ecosystem's conversational intelligence.
                    </p>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 mb-12 gap-x-6 gap-y-6">

                    {/* Left Column: Mixed Cards */}
                    <div className="lg:col-span-7 flex flex-col gap-6">

                        {/* Top Wide Card */}
                        <div className="group hover:bg-zinc-900/60 transition-all duration-500 bg-zinc-900/40 rounded-[2.5rem] p-10 relative backdrop-blur-sm border border-white/5">
                            <div className="group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-bl from-orange-500/5 via-transparent to-transparent opacity-0 rounded-[2.5rem] absolute top-0 right-0 bottom-0 left-0"></div>

                            <div className="relative z-10">
                                <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
                                    <h3 className="text-6xl font-semibold text-white tracking-tighter font-geist">
                                        300<span className="align-top text-xs font-normal text-zinc-500 tracking-tighter mt-2 ml-1">ms</span>
                                    </h3>
                                    <p className="text-lg font-medium text-zinc-300">Average voice-to-code execution latency.</p>
                                </div>

                                <i className="fas fa-quote-left text-3xl text-zinc-700 mb-4"></i>

                                <blockquote className="text-base text-gray-300 font-sans leading-relaxed mb-8">
                                    "I thought voice coding was a gimmick until I tried Ecosystem. The latency is practically non-existent. It feels like the AI is reading my mind before I finish speaking."
                                </blockquote>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 overflow-hidden flex items-center justify-center">
                                            <i className="fas fa-user-circle text-2xl text-zinc-500"></i>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-white font-manrope">Sarah Jenkins</h4>
                                            <p className="text-xs text-zinc-500 font-sans">Frontend Lead, Vercel</p>
                                        </div>
                                    </div>
                                    <div className="text-zinc-500 opacity-50 group-hover:opacity-100 transition-opacity">
                                        <i className="fas fa-bolt text-2xl"></i>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Split Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">

                            {/* Card 3 */}
                            <div className="group hover:bg-zinc-900/60 transition-all duration-500 flex flex-col bg-zinc-900/40 rounded-[2.5rem] p-8 relative backdrop-blur-sm justify-between border border-white/5">
                                <div className="relative z-10">
                                    <i className="fas fa-heart text-3xl text-zinc-700 mb-4"></i>
                                    <p className="text-sm text-gray-300 font-sans leading-relaxed mb-6">
                                        "The accessibility features are game-changing. Being able to code entirely hands-free when my RSI flares up has saved my career."
                                    </p>
                                </div>
                                <div className="relative z-10 flex items-center justify-between mt-auto">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 overflow-hidden flex items-center justify-center">
                                            <i className="fas fa-user text-2xl text-zinc-500"></i>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-white font-manrope">Alex Chen</h4>
                                            <p className="text-xs text-zinc-500 font-sans">Full Stack Dev</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 4 (Contrast) */}
                            <div className="group overflow-hidden flex flex-col bg-zinc-100 border-white/10 border rounded-[2.5rem] p-8 relative shadow-2xl justify-between">
                                <div className="relative z-10">
                                    <i className="fas fa-star text-3xl text-zinc-400 mb-4"></i>
                                    <p className="text-sm text-zinc-800 font-medium font-sans leading-relaxed mb-6">
                                        "Ecosystem's context awareness is unreal. It knows exactly which file I'm referencing without me explaining it."
                                    </p>
                                </div>
                                <div className="relative z-10 flex items-center justify-between mt-auto pt-4 border-t border-zinc-300">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-zinc-300 border border-zinc-400 overflow-hidden flex items-center justify-center">
                                            <i className="fas fa-user text-2xl text-zinc-600"></i>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-zinc-900 font-manrope">Emily Davis</h4>
                                            <p className="text-xs text-zinc-500 font-sans">Senior Eng, Google</p>
                                        </div>
                                    </div>
                                    <div className="text-zinc-400 group-hover:text-zinc-900 transition-colors">
                                        <i className="fab fa-google text-xl"></i>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Right Column: Big Card Carousel */}
                    <div className="lg:col-span-5 carousel-container relative">

                        {/* Carousel Item 1 (Dev Speed) */}
                        <div className="carousel-card group flex flex-col hover:bg-zinc-900/60 transition-all duration-500 bg-zinc-900/40 rounded-[2.5rem] p-10 relative backdrop-blur-sm justify-between animate-carousel border border-white/5" style={{ animationDelay: '0s', opacity: 0 }}>
                            <div className="group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent opacity-0 rounded-[2.5rem] absolute top-0 right-0 bottom-0 left-0"></div>

                            <div className="relative z-10">
                                <div className="flex items-baseline gap-2 mb-4">
                                    <h3 className="text-8xl font-semibold text-white tracking-tighter font-geist">
                                        10<span className="text-orange-500">x</span></h3>
                                </div>
                                <p className="text-xl font-medium text-zinc-300 border-l-2 border-orange-500 pl-4 mb-12">
                                    Increase in development velocity for complex refactors.
                                </p>

                                <i className="fas fa-quote-left text-4xl text-zinc-700 mb-6"></i>

                                <blockquote className="text-lg text-gray-300 font-sans leading-relaxed mb-8">
                                    "I refactored my entire legacy codebase in a weekend using Ecosystem. Describing the changes verbally is infinitely faster than typing them out manually."
                                </blockquote>
                            </div>

                            <div className="relative z-10 flex items-center justify-between pt-8 border-t border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-zinc-800 border border-white/10 overflow-hidden flex items-center justify-center">
                                        <i className="fas fa-user-astronaut text-2xl text-zinc-500"></i>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-white font-manrope">Marcus Neo</h4>
                                        <p className="text-xs text-zinc-500 font-sans">Indiehacker</p>
                                    </div>
                                </div>
                                <div className="text-zinc-500 opacity-50 group-hover:opacity-100 transition-opacity">
                                    <i className="fas fa-rocket text-2xl"></i>
                                </div>
                            </div>
                        </div>

                        {/* Carousel Item 2 (Accuracy) */}
                        <div className="carousel-card group flex flex-col hover:bg-zinc-900/60 transition-all duration-500 bg-zinc-900/40 rounded-[2.5rem] p-10 relative backdrop-blur-sm justify-between animate-carousel border border-white/5" style={{ animationDelay: '5s', opacity: 0 }}>
                            <div className="group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-green-500/5 via-transparent to-transparent opacity-0 rounded-[2.5rem] absolute top-0 right-0 bottom-0 left-0"></div>

                            <div className="relative z-10">
                                <div className="flex items-baseline gap-2 mb-4">
                                    <h3 className="text-8xl font-semibold text-white tracking-tighter font-geist">
                                        99<span className="text-green-500">%</span></h3>
                                </div>
                                <p className="text-xl font-medium text-zinc-300 border-l-2 border-green-500 pl-4 mb-12">
                                    Syntax accuracy rate on first-pass code generation.
                                </p>

                                <i className="fas fa-quote-left text-4xl text-zinc-700 mb-6"></i>

                                <blockquote className="text-lg text-gray-300 font-sans leading-relaxed mb-8">
                                    "I was skeptical about voice dictation for code syntax. But it never misses a bracket. It's actually more accurate than my own typing."
                                </blockquote>
                            </div>

                            <div className="relative z-10 flex items-center justify-between pt-8 border-t border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-zinc-800 border border-white/10 overflow-hidden flex items-center justify-center">
                                        <i className="fas fa-user-ninja text-2xl text-zinc-500"></i>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-white font-manrope">Sarah Li</h4>
                                        <p className="text-xs text-zinc-500 font-sans">Open Source Maintainer</p>
                                    </div>
                                </div>
                                <div className="text-zinc-500 opacity-50 group-hover:opacity-100 transition-opacity">
                                    <i className="fas fa-check-circle text-2xl"></i>
                                </div>
                            </div>
                        </div>

                        {/* Carousel Item 3 (Health) */}
                        <div className="carousel-card group flex flex-col hover:bg-zinc-900/60 transition-all duration-500 bg-zinc-900/40 rounded-[2.5rem] p-10 relative backdrop-blur-sm justify-between animate-carousel border border-white/5" style={{ animationDelay: '10s', opacity: 0 }}>
                            <div className="group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 rounded-[2.5rem] absolute top-0 right-0 bottom-0 left-0"></div>

                            <div className="relative z-10">
                                <div className="flex items-baseline gap-2 mb-4">
                                    <h3 className="text-8xl font-semibold text-white tracking-tighter font-geist">
                                        0<span className="text-blue-500 text-4xl align-top ml-1">RSI</span></h3>
                                </div>
                                <p className="text-xl font-medium text-zinc-300 border-l-2 border-blue-500 pl-4 mb-12">
                                    Reported hand strain after switching to voice coding.
                                </p>

                                <i className="fas fa-quote-left text-4xl text-zinc-700 mb-6"></i>

                                <blockquote className="text-lg text-gray-300 font-sans leading-relaxed mb-8">
                                    "Ecosystem isn't just a tool; it's a health-saver. I can code for 8 hours without touching the keyboard. My wrist pain is completely gone."
                                </blockquote>
                            </div>

                            <div className="relative z-10 flex items-center justify-between pt-8 border-t border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-zinc-800 border border-white/10 overflow-hidden flex items-center justify-center">
                                        <i className="fas fa-user-md text-2xl text-zinc-500"></i>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-white font-manrope">Dr. Arinze</h4>
                                        <p className="text-xs text-zinc-500 font-sans">DevOps Engineer</p>
                                    </div>
                                </div>
                                <div className="text-zinc-500 opacity-50 group-hover:opacity-100 transition-opacity">
                                    <i className="fas fa-heartbeat text-2xl"></i>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* CTA / Form Section */}
            <section className="w-full max-w-7xl mx-auto px-6 mb-32 relative z-20 mt-32">
                <div className="grid lg:grid-cols-12 gap-16 items-start">
                    {/* CTA Text Side */}
                    <div className="lg:col-span-5 pt-4">
                        <h2 className="text-5xl md:text-6xl font-medium text-white tracking-tighter font-manrope mb-6 leading-[1.1]">
                            Ready to find your <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">voice?</span>
                        </h2>
                        <p className="text-lg text-zinc-400 font-sans leading-relaxed max-w-md">
                            Join the Ecosystem revolution. Whether you're a seasoned pro looking to speed up, or a beginner starting your journey, we have a plan for you.
                        </p>
                    </div>

                    {/* Form Side */}
                    <div className="lg:col-span-7">
                        <form className="space-y-12">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="group relative">
                                    <input type="text" id="name" required className="peer w-full bg-transparent border-b border-white/10 py-3 text-white placeholder-transparent focus:border-orange-500 focus:outline-none transition-colors font-sans text-lg" placeholder="Name" />
                                    <label htmlFor="name" className="absolute left-0 -top-5 text-xs text-zinc-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-zinc-400 peer-placeholder-shown:top-3 peer-focus:-top-5 peer-focus:text-[10px] peer-focus:text-orange-500 font-sans uppercase tracking-wider font-medium">Name</label>
                                </div>
                                <div className="group relative">
                                    <input type="email" id="email" required className="peer w-full bg-transparent border-b border-white/10 py-3 text-white placeholder-transparent focus:border-orange-500 focus:outline-none transition-colors font-sans text-lg" placeholder="Email" />
                                    <label htmlFor="email" className="absolute left-0 -top-5 text-xs text-zinc-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-zinc-400 peer-placeholder-shown:top-3 peer-focus:-top-5 peer-focus:text-[10px] peer-focus:text-orange-500 font-sans uppercase tracking-wider font-medium">Email</label>
                                </div>
                            </div>

                            <div className="group relative">
                                <input type="text" id="interest" className="peer w-full bg-transparent border-b border-white/10 py-3 text-white placeholder-transparent focus:border-orange-500 focus:outline-none transition-colors font-sans text-lg" placeholder="Primary Interest" />
                                <label htmlFor="interest" className="absolute left-0 -top-5 text-xs text-zinc-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-zinc-400 peer-placeholder-shown:top-3 peer-focus:-top-5 peer-focus:text-[10px] peer-focus:text-orange-500 font-sans uppercase tracking-wider font-medium">Primary Interest (e.g. Learning, Productivity)</label>
                            </div>

                            <div className="group relative">
                                <textarea id="message" rows={1} className="peer w-full bg-transparent border-b border-white/10 py-3 text-white placeholder-transparent focus:border-orange-500 focus:outline-none transition-colors font-sans text-lg resize-none" placeholder="Anything else?"></textarea>
                                <label htmlFor="message" className="absolute left-0 -top-5 text-xs text-zinc-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-zinc-400 peer-placeholder-shown:top-3 peer-focus:-top-5 peer-focus:text-[10px] peer-focus:text-orange-500 font-sans uppercase tracking-wider font-medium">Any questions?</label>
                            </div>

                            <div className="flex justify-end pt-8">
                                <button type="button" onClick={() => navigateTo('signup')} className="group flex items-center gap-3 px-8 py-4 bg-white text-black font-semibold tracking-widest uppercase text-xs hover:bg-zinc-200 transition-all duration-300 font-manrope">
                                    Get Started
                                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" className="transform group-hover:translate-x-1 transition-transform"><path fill="currentColor" d="M13.25 12.75V18a.75.75 0 0 0 1.28.53l6-6a.75.75 0 0 0 0-1.06l-6-6a.75.75 0 0 0-1.28.53z"></path></svg>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </section >
        </div >
    );
};

export default LandingPage;
