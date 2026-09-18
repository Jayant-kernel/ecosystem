
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

    const typeCode = (code: string) => {
        setTimeout(() => {
            let i = 0;
            const interval = setInterval(() => {
                if (i < code.length) {
                    setEditorCode(prev => code.substring(0, i + 1));
                    i++;
                } else {
                    clearInterval(interval);
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
    const handleCodeChange = useCallback((val?: string) => setEditorCode(val || ''), []);
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
        for (const fc of functionCalls) {
            switch (fc.name) {
                case 'writeCode':
                    setEditorCode('');
                    typeCode((fc.args?.code as string) || '');
                    responses.push({ id: fc.id, name: fc.name, response: { result: "Code written successfully." } });
                    break;
                case 'executeCode':
                    handleRunCode();
                    responses.push({ id: fc.id, name: fc.name, response: { result: "Code executed." } });
                    break;
                case 'readCode':
                    responses.push({ id: fc.id, name: fc.name, response: { result: editorCodeRef.current } });
                    break;
                case 'controlApp':
                    const action = fc.args?.action as string;
                    let resultMsg = `Action ${action} triggered.`;
                    if (action === 'run_code') {
                        handleRunCode();
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
    }, [handleRunCode, handleResetCode, handleCompleteLesson]);

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
        sessionError
    } = useVoiceTutor(onStreamMessage, handleToolCall, progress, currentLesson, editorCodeRef);

    const handleLessonClick = useCallback(async (lessonId: string) => {
        await updateProgress({ currentLessonId: lessonId });
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    }, [updateProgress]);

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
            />

            <main className={`flex flex-col flex-grow relative h-full transition-all duration-300 ${isSidebarOpen ? 'md:ml-80' : ''} w-full`}>
                <LearningHeader
                    lessonTitle={currentLesson?.title || 'Loading...'}
                    courseTitle={course.title}
                    toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    isSidebarOpen={isSidebarOpen}
                    navigateTo={navigateTo}
                />

                <div className="flex-grow flex flex-col md:grid md:grid-cols-2 gap-6 p-4 md:p-6 overflow-hidden min-h-0 relative z-10">
                    <div className="h-[40%] md:h-full min-h-0 flex-shrink-0 animate-fade-in-up">
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
                        />
                    </div>
                    <div className="flex-1 md:h-full min-h-0 animate-fade-in-up delay-100">
                        <CodeWorkspace
                            code={editorCode}
                            onCodeChange={handleCodeChange}
                            output={consoleOutput}
                            exercises={exercises}
                            onRunTests={handleRunTests}
                            onRunCode={handleRunCode}
                            onResetCode={handleResetCode}
                        />
                    </div>
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
