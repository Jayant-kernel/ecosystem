
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Course, Lesson, Transcript, ConsoleOutput, TestResult, TutorToolCall, TutorToolResponse } from '../types';
import RoadmapSidebar from './RoadmapSidebar';
import { useCourseProgress } from '../hooks/useCourseProgress';
import { useVoiceTutor } from '../hooks/useVoiceTutor';
import { useLearningActivity } from '../hooks/useLearningActivity';
import LearningHeader from './LearningHeader';
import ConversationPanel from './ConversationPanel';
import CodeWorkspace from './CodeWorkspace';
import LearningFooter from './LearningFooter';
import PracticeView from './PracticeView';
import { executeCodeSafely, executeTests } from '../utils/codeExecutor';
import { voiceService } from '../services/voiceService';
import { View } from '../App';

interface LearningViewProps {
    course: Course;
    navigateTo: (view: View) => void;
}

const LearningView: React.FC<LearningViewProps> = ({ course, navigateTo }) => {
    const { progress, updateProgress, completeLesson } = useCourseProgress(course.id);
    const { startTracking, stopTracking } = useLearningActivity();
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [isCompleting, setIsCompleting] = useState(false);
    const [practiceModuleId, setPracticeModuleId] = useState<string | null>(null);

    // Start tracking time when component mounts, stop when unmounts
    useEffect(() => {
        startTracking();
        return () => {
            stopTracking();
        };
    }, [startTracking, stopTracking]);

    // Initialize sidebar closed on mobile, open on desktop
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

    const [editorCode, setEditorCode] = useState('// Your AI tutor will write code here...');
    const [consoleOutput, setConsoleOutput] = useState<ConsoleOutput[]>([]);
    const [transcript, setTranscript] = useState<Transcript>({ user: '', ai: '', isFinal: false });

    // Refs to access latest state in async tool callbacks
    const editorCodeRef = useRef(editorCode);
    useEffect(() => { editorCodeRef.current = editorCode; }, [editorCode]);

    // Monaco editor instance (captured on mount) for tutor line highlights.
    const editorApiRef = useRef<{ editor: any; monaco: any } | null>(null);
    const highlightDecoRef = useRef<string[]>([]);
    const pendingHighlightRef = useRef<{ startLine: number; endLine: number } | null>(null);
    const isTypingRef = useRef(false);
    const [highlight, setHighlight] = useState<{ startLine: number; endLine: number; revision: number } | null>(null);
    // Bumped when the tutor runs code so the console tab takes over.
    const [consoleTabSignal, setConsoleTabSignal] = useState(0);

    const clearHighlight = useCallback(() => {
        pendingHighlightRef.current = null;
        setHighlight(null);
        const api = editorApiRef.current;
        if (api && highlightDecoRef.current.length) {
            try {
                highlightDecoRef.current = api.editor.deltaDecorations(highlightDecoRef.current, []);
            } catch {
                /* editor torn down — ignore */
            }
        }
    }, []);

    const applyHighlight = useCallback((startLine: number, endLine: number) => {
        let s = Math.max(1, Math.floor(Number(startLine)) || 1);
        let e = Math.max(1, Math.floor(Number(endLine)) || 1);
        if (s > e) { const t = s; s = e; e = t; }
        pendingHighlightRef.current = { startLine: s, endLine: e };
        setHighlight((prev) => ({ startLine: s, endLine: e, revision: (prev?.revision ?? 0) + 1 }));
        const api = editorApiRef.current;
        if (!api) return;
        try {
            const { editor, monaco } = api;
            const model = editor.getModel();
            const lineCount = model ? model.getLineCount() : e;
            const cs = Math.min(s, Math.max(1, lineCount));
            const ce = Math.min(e, Math.max(1, lineCount));
            highlightDecoRef.current = editor.deltaDecorations(highlightDecoRef.current, [{
                range: new monaco.Range(cs, 1, ce, model ? model.getLineMaxColumn(ce) : 1),
                options: {
                    isWholeLine: true,
                    className: 'tutor-highlight-line',
                    overviewRuler: { color: 'rgba(249,115,22,0.9)', position: monaco.editor.OverviewRulerLane.Right },
                },
            }]);
            editor.revealLinesInCenter(cs, ce);
        } catch {
            /* editor not ready — pending highlight re-applies when typing finishes */
        }
    }, []);

    const handleMountEditor = useCallback((editor: any, monaco: any) => {
        editorApiRef.current = { editor, monaco };
        // Re-apply any active highlight (e.g. after a remount).
        const pending = pendingHighlightRef.current;
        if (pending) applyHighlight(pending.startLine, pending.endLine);
    }, [applyHighlight]);

    // Handle window resize to auto-manage sidebar state
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsSidebarOpen(true);
            } else {
                setIsSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const typeCode = (code: string, onDone?: () => void) => {
        isTypingRef.current = true;
        setTimeout(() => {
            let i = 0;
            const interval = setInterval(() => {
                if (i < code.length) {
                    setEditorCode(prev => code.substring(0, i + 1));
                    i++;
                } else {
                    clearInterval(interval);
                    isTypingRef.current = false;
                    // Re-apply any highlight the tutor requested while typing.
                    const pending = pendingHighlightRef.current;
                    if (pending) applyHighlight(pending.startLine, pending.endLine);
                    onDone?.();
                }
            }, 15);
        }, 50);
    };

    const handleRunCode = useCallback(async () => {
        setConsoleOutput([]);
        const code = editorCodeRef.current;

        // Prefer the AWS Lambda sandbox; fall back to in-browser execution when
        // no backend is configured (e.g. local dev without VITE_API_BASE_URL).
        if (voiceService.isConfigured()) {
            try {
                const { output } = await voiceService.executeCode(code);
                setConsoleOutput(output || []);
                return;
            } catch (error) {
                console.warn('Remote execution failed, falling back to local:', error);
            }
        }

        executeCodeSafely(code, (output) => {
            setConsoleOutput(prev => [...prev, output]);
        });
    }, []);

    const handleResetCode = useCallback(() => {
        setEditorCode('// Code has been reset.');
        setConsoleOutput([]);
    }, []);

    // --- Tutor line highlighting (array-based, staggered) ------------------------------
    // Kept alongside the range-based Monaco decoration highlight below so the
    // `highlightCode` tool keeps working while `highlightLines` drives the editor.
    const [highlightedLines, setHighlightedLines] = useState<number[]>([]);
    const highlightTimersRef = useRef<number[]>([]);

    const clearHighlightTimers = useCallback(() => {
        highlightTimersRef.current.forEach((id) => window.clearTimeout(id));
        highlightTimersRef.current = [];
    }, []);

    /** Stagger highlights so they step through the code as the tutor speaks. */
    const applyHighlightLines = useCallback((lines: number[], delayMs: number) => {
        const show = window.setTimeout(() => {
            setHighlightedLines(lines);
            const clear = window.setTimeout(() => setHighlightedLines([]), 8000);
            highlightTimersRef.current.push(clear);
        }, delayMs);
        highlightTimersRef.current.push(show);
    }, []);

    // A new lesson starts with a clean editor.
    useEffect(() => {
        clearHighlightTimers();
        setHighlightedLines([]);
        return clearHighlightTimers;
    }, [currentLesson?.id, clearHighlightTimers]);

    const handleRunTests = useCallback((): TestResult[] => {
        if (!currentLesson || !currentLesson.content.exercises || currentLesson.content.exercises.length === 0) {
            return [];
        }
        return executeTests(editorCode, currentLesson.content.exercises[0].tests);
    }, [editorCode, currentLesson]);

    // Memoize the flattened list of lessons for easier navigation lookup
    const allLessons = useMemo(() => course.modules.flatMap(m => m.lessons), [course]);

    // Stable references so memoized children (Monaco editor, sidebar) do not
    // re-render when the transcript streams in.
    const exercises = useMemo(() => currentLesson?.content.exercises ?? [], [currentLesson]);
    const handleCodeChange = useCallback((val?: string) => {
        setEditorCode(val || '');
        // Manual edits invalidate any tutor highlight (programmatic typing is guarded by isTypingRef).
        if (!isTypingRef.current) clearHighlight();
    }, [clearHighlight]);
    const handleBackToDashboard = useCallback(() => navigateTo('dashboard'), [navigateTo]);

    const [showXPModal, setShowXPModal] = useState(false);
    const [xpGained, setXpGained] = useState(0);

    const handleCompleteLesson = useCallback(async () => {
        if (!currentLesson || isCompleting) return;

        setIsCompleting(true);
        try {
            const currentIndex = allLessons.findIndex(l => l.id === currentLesson.id);
            let nextLessonId = currentLesson.id;

            if (currentIndex !== -1 && currentIndex < allLessons.length - 1) {
                nextLessonId = allLessons[currentIndex + 1].id;
            }

            await completeLesson(currentLesson.id, nextLessonId);
            setXpGained(50); // Example XP value for lesson completion
            setShowXPModal(true);

            // Delay navigation/updates until modal is closed or after short delay if automatic
            // For now, we'll keep the modal open until user dimisses it or continues

            if (nextLessonId === currentLesson.id && currentIndex === allLessons.length - 1) {
                // Course Completion logic handled in modal or subsequent check
            }
        } catch (error) {
            console.error("Failed to complete lesson:", error);
        } finally {
            setIsCompleting(false);
        }
    }, [currentLesson, isCompleting, allLessons, completeLesson]);

    const closeXPModal = () => {
        setShowXPModal(false);
        const currentIndex = allLessons.findIndex(l => l?.id === currentLesson?.id);
        if (currentIndex !== -1 && currentIndex === allLessons.length - 1) {
            navigateTo('dashboard');
        }
    };

    const handleToolCall = useCallback(async (functionCalls: TutorToolCall[]): Promise<TutorToolResponse[]> => {
        const responses: TutorToolResponse[] = [];
        let highlightStep = 0;
        // writeCode first: fresh code invalidates any old highlight. Only wait
        // for typing to finish when later calls in the same batch need the
        // final code (e.g. executeCode); otherwise keep audio latency low.
        const writeCall = functionCalls.find((fc) => fc.name === 'writeCode');
        const needsSettledCode = functionCalls.some((fc) =>
            fc.name === 'executeCode' ||
            (fc.name === 'controlApp' && (fc.args?.action as string) === 'run_code')
        );
        if (writeCall) {
            const code = (writeCall.args?.code as string) || '';
            clearHighlight();
            clearHighlightTimers();
            setHighlightedLines([]);
            pendingHighlightRef.current = null;
            setEditorCode('');
            if (needsSettledCode) {
                await new Promise<void>((resolve) => typeCode(code, resolve));
            } else {
                typeCode(code);
            }
            responses.push({ id: writeCall.id, name: writeCall.name, response: { result: "Code written successfully." } });
        }
        for (const fc of functionCalls) {
            if (fc.name === 'writeCode') continue;
            switch (fc.name) {
                case 'highlightCode': {
                    const raw = fc.args?.lines;
                    const lines = Array.isArray(raw)
                        ? (raw as unknown[]).map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0)
                        : [];
                    if (lines.length) {
                        // Let the editor finish typing before pointing at a line.
                        applyHighlightLines(lines, 1200 + highlightStep * 1500);
                        highlightStep += 1;
                    }
                    responses.push({ id: fc.id, name: fc.name, response: { result: "Lines highlighted." } });
                    break;
                }
                case 'highlightLines': {
                    const s = Number(fc.args?.startLine) || 1;
                    const e = Number(fc.args?.endLine) || s;
                    applyHighlight(s, e);
                    const lo = Math.min(s, e), hi = Math.max(s, e);
                    responses.push({ id: fc.id, name: fc.name, response: { result: `Lines ${lo}-${hi} highlighted.` } });
                    break;
                }
                case 'executeCode':
                    await handleRunCode();
                    setConsoleTabSignal((n) => n + 1);
                    responses.push({ id: fc.id, name: fc.name, response: { result: "Code executed." } });
                    break;
                case 'readCode':
                    responses.push({ id: fc.id, name: fc.name, response: { result: editorCodeRef.current } });
                    break;
                case 'controlApp':
                    const action = fc.args?.action as string;
                    let resultMsg = `Action ${action} triggered.`;
                    if (action === 'run_code') {
                        await handleRunCode();
                        setConsoleTabSignal((n) => n + 1);
                    } else if (action === 'reset_code') {
                        handleResetCode();
                    } else if (action === 'next_lesson') {
                        handleCompleteLesson();
                        resultMsg = "Moving to next lesson.";
                    }
                    responses.push({ id: fc.id, name: fc.name, response: { result: resultMsg } });
                    break;
            }
        }
        return responses;
    }, [applyHighlight, applyHighlightLines, clearHighlight, clearHighlightTimers, handleRunCode, handleResetCode, handleCompleteLesson]);

    const onStreamMessage = useCallback((newTranscript: Transcript) => {
        setTranscript(newTranscript);
    }, []);

    useEffect(() => {
        const firstLesson = allLessons[0];
        if (!firstLesson) {
            setCurrentLesson(null);
            return;
        }

        const lesson = allLessons.find(l => l.id === progress.currentLessonId);
        if (lesson) {
            setCurrentLesson(lesson);
            return;
        }

        // The stored lesson id does not belong to this course (e.g. the learner
        // switched courses). Self-heal by opening this course's first lesson.
        setCurrentLesson(firstLesson);
        if (progress.currentLessonId !== firstLesson.id) {
            updateProgress({ currentLessonId: firstLesson.id });
        }
    }, [progress.currentLessonId, allLessons, updateProgress]);

    const {
        isSessionActive,
        isConnecting,
        isSpeaking,
        isListening,
        isMuted,
        startSession,
        stopSession,
        toggleMute,
        sessionError,
        ensureSessionId,
        pushHistory,
        resetConversation,
        playExternalAudio
    } = useVoiceTutor(onStreamMessage, handleToolCall, progress, currentLesson, editorCodeRef, course.title);

    // Parent module of the open chapter (for the tutor's greeting).
    const currentModule = useMemo(() => {
        if (!currentLesson) return null;
        return course.modules.find((m) => m.lessons.some((l) => l.id === currentLesson.id)) ?? null;
    }, [course.modules, currentLesson]);

    // Chapter intro state, keyed by lesson.
    const [introState, setIntroState] = useState<{ lessonId: string; loading: boolean } | null>(null);

    // A new chapter means a fresh conversation so the tutor greets THIS chapter.
    const currentLessonId = currentLesson?.id;
    useEffect(() => {
        setTranscript({ user: '', ai: '', isFinal: false });
        resetConversation();
        setIntroState(null);
    }, [currentLessonId, resetConversation]);

    const handleRequestIntro = useCallback(async () => {
        if (!currentLesson || introState?.loading) return;
        if (!voiceService.isConfigured()) {
            setTranscript({
                user: '',
                ai: 'Voice backend is not configured. Set VITE_API_BASE_URL to enable the tutor voice.',
                isFinal: true,
            });
            return;
        }
        setIntroState({ lessonId: currentLesson.id, loading: true });
        try {
            const sessionId = await ensureSessionId();
            const result = await voiceService.requestIntro({
                sessionId,
                lessonTitle: currentLesson.title,
                moduleTitle: currentModule?.title,
                objectives: currentLesson.objectives?.join('; '),
                openingQuestion: currentLesson.content.oralQuestions?.[0]?.prompt,
                lessonSummary: currentLesson.content.explanations?.[0],
                aiMemory: progress.aiMemory?.slice(-3).join('; '),
                editorCode: editorCodeRef.current,
            });
            if (result.toolCalls?.length) {
                await handleToolCall(result.toolCalls.map((call, index) => ({
                    id: `intro-tool-${index}`,
                    name: call.name,
                    args: call.args || {},
                })));
            }
            setTranscript({ user: '', ai: result.response, isFinal: true });
            pushHistory(`[Opened chapter ${currentLesson.title}]`, result.response);
            await playExternalAudio(result.audio, result.audioMimeType);
            setIntroState({ lessonId: currentLesson.id, loading: false });
        } catch (error: any) {
            setIntroState({ lessonId: currentLesson.id, loading: false });
            setTranscript({
                user: '',
                ai: `Sorry, I could not introduce this chapter: ${error?.message || error}`,
                isFinal: true,
            });
        }
    }, [currentLesson, currentModule, editorCodeRef, ensureSessionId, handleToolCall, introState?.loading, playExternalAudio, progress.aiMemory, pushHistory]);

    const handleLessonClick = useCallback(async (lessonId: string) => {
        await updateProgress({ currentLessonId: lessonId });
        setPracticeModuleId(null);
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    }, [updateProgress]);

    const handlePracticeClick = useCallback((moduleId: string) => {
        setPracticeModuleId(moduleId);
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    }, []);

    // End-of-module practice replaces the lesson workspace while it is open.
    const practiceModule = useMemo(
        () => course.modules.find((m) => m.id === practiceModuleId && m.practice),
        [course, practiceModuleId]
    );

    // Concept lessons have no editor and no console.
    const isTheory = currentLesson?.mode === 'theory';

    if (practiceModule?.practice) {
        return (
            <PracticeView
                practice={practiceModule.practice}
                moduleTitle={practiceModule.title}
                onBack={() => setPracticeModuleId(null)}
            />
        );
    }

    return (
        <div className="fixed inset-0 bg-[#0D0D0D] text-gray-200 font-sans flex overflow-hidden selection:bg-orange-500/30 selection:text-orange-200">
            {/* Background Ambience */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

            {/* Mobile Sidebar Backdrop */}
            {isSidebarOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/80 z-30 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <RoadmapSidebar
                course={course}
                completedLessons={progress.completedLessons}
                currentLessonId={progress.currentLessonId}
                onBack={handleBackToDashboard}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
                onLessonClick={handleLessonClick}
                onPracticeClick={handlePracticeClick}
                practiceModuleId={practiceModuleId}
            />

            <main className={`flex flex-col flex-grow relative h-full transition-all duration-300 ${isSidebarOpen ? 'md:ml-80' : ''} w-full`}>
                <LearningHeader
                    lessonTitle={currentLesson?.title || 'Loading...'}
                    courseTitle={course.title}
                    toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    isSidebarOpen={isSidebarOpen}
                    navigateTo={navigateTo}
                />

                <div className={`flex-grow flex flex-col gap-6 p-4 md:p-6 overflow-hidden min-h-0 relative z-10 ${isTheory ? '' : 'md:grid md:grid-cols-5'}`}>
                    <div className={`${isTheory ? 'flex-1' : 'h-[38%] md:h-full md:col-span-2'} min-h-0 flex-shrink-0 animate-fade-in-up flex flex-col`}>
                        <div className="flex-1 min-h-0">
                            <ConversationPanel
                                isSessionActive={isSessionActive}
                                isConnecting={isConnecting}
                                isListening={isListening}
                                isSpeaking={isSpeaking}
                                isMuted={isMuted}
                                startSession={startSession}
                                stopSession={stopSession}
                                toggleMute={toggleMute}
                                transcript={transcript}
                                sessionError={sessionError}
                                currentLesson={currentLesson}
                                onRequestIntro={currentLesson ? handleRequestIntro : null}
                                introLoading={introState?.loading ?? false}
                            />
                        </div>
                    </div>
                    {!isTheory && (
                        <div className="flex-1 md:h-full min-h-0 animate-fade-in-up delay-100 md:col-span-3">
                            <CodeWorkspace
                                code={editorCode}
                                onCodeChange={handleCodeChange}
                                output={consoleOutput}
                                exercises={exercises}
                                onRunTests={handleRunTests}
                                onRunCode={handleRunCode}
                                onResetCode={handleResetCode}
                                highlightLines={highlightedLines}
                                onMountEditor={handleMountEditor}
                                consoleTabSignal={consoleTabSignal}
                            />
                        </div>
                    )}
                </div>

                <LearningFooter
                    onComplete={handleCompleteLesson}
                    isCompleting={isCompleting}
                />
            </main>

            {/* Level Up / Success Modal */}
            {showXPModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={closeXPModal}></div>
                    <div className="relative bg-[#0D0D0D] border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl transform scale-100 animate-bounce-in overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-500/10 to-purple-500/10 pointer-events-none"></div>

                        <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(249,115,22,0.6)] animate-pulse">
                            <i className="fas fa-trophy text-3xl text-white"></i>
                        </div>

                        <h2 className="text-3xl font-bold text-white mb-2 font-manrope">Lesson Complete!</h2>
                        <p className="text-zinc-400 mb-8">You're making great progress.</p>

                        <div className="flex items-center justify-center gap-2 text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-8">
                            +{xpGained} <span className="text-lg text-zinc-500 font-medium">XP</span>
                        </div>

                        <button
                            onClick={closeXPModal}
                            className="w-full py-3.5 rounded-xl font-bold bg-white text-black hover:bg-orange-500 hover:text-white transition-all shadow-lg"
                        >
                            Continue Learning
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LearningView;
