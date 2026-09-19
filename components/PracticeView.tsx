import React, { useMemo, useState, useCallback } from 'react';
import { ConsoleOutput, ModulePractice, PracticeCoding, TestResult } from '../types';
import EditorPanel from './EditorPanel';
import ConsolePanel from './ConsolePanel';
import HintOverlay from './HintOverlay';
import { executeCodeSafely, executeTests } from '../utils/codeExecutor';

interface PracticeViewProps {
    practice: ModulePractice;
    moduleTitle: string;
    onBack: () => void;
}

type Tab = 'quiz' | 'coding';

const difficultyStyles: Record<string, string> = {
    easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
};

const PracticeView: React.FC<PracticeViewProps> = ({ practice, moduleTitle, onBack }) => {
    const [tab, setTab] = useState<Tab>('quiz');

    // --- Quiz state ---
    const [answers, setAnswers] = useState<Record<string, string>>({});

    // --- Coding state ---
    const [codingIndex, setCodingIndex] = useState(0);
    const current: PracticeCoding = practice.coding[codingIndex];
    const hasCoding = practice.coding.length > 0;
    const [code, setCode] = useState(current.starterCode);
    const [results, setResults] = useState<TestResult[] | null>(null);
    const [output, setOutput] = useState<ConsoleOutput[]>([]);
    const [solved, setSolved] = useState<Record<string, boolean>>({});

    // --- Hint / explanation overlays ---
    const [hintLevel, setHintLevel] = useState(0); // 0 = closed
    const [explainOpen, setExplainOpen] = useState(false);
    const [explainStep, setExplainStep] = useState(1);

    const mcqCorrect = useMemo(
        () => practice.mcqs.filter((q) => answers[q.id] === q.answer).length,
        [answers, practice.mcqs]
    );
    const solvedCount = useMemo(
        () => practice.coding.filter((c) => solved[c.id]).length,
        [solved, practice.coding]
    );

    const selectCoding = useCallback((index: number) => {
        const next = practice.coding[index];
        setCodingIndex(index);
        setCode(next.starterCode);
        setResults(null);
        setOutput([]);
        setHintLevel(0);
        setExplainOpen(false);
        setExplainStep(1);
    }, [practice.coding]);

    const runTests = useCallback(() => {
        const res = executeTests(code, current.tests);
        setResults(res);
        if (res.length > 0 && res.every((r) => r.passed)) {
            setSolved((prev) => ({ ...prev, [current.id]: true }));
        }
    }, [code, current]);

    const runCode = useCallback(() => {
        setOutput([]);
        executeCodeSafely(code, (line) => setOutput((prev) => [...prev, line]));
    }, [code]);

    const resetCode = useCallback(() => {
        setCode(current.starterCode);
        setResults(null);
        setOutput([]);
    }, [current]);

    return (
        <div className="fixed inset-0 bg-[#0D0D0D] text-gray-200 font-sans overflow-y-auto custom-scrollbar selection:bg-orange-500/30 selection:text-orange-200">
            <div className="absolute top-0 right-0 w-[520px] h-[520px] bg-orange-600/10 blur-[130px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[420px] h-[420px] bg-purple-600/5 blur-[130px] rounded-full pointer-events-none" />

            {/* Header */}
            <header className="relative z-10 sticky top-0 backdrop-blur-xl bg-black/50 border-b border-white/5">
                <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 font-bold text-xs uppercase tracking-wider group"
                    >
                        <i className="fas fa-arrow-left transition-transform group-hover:-translate-x-1"></i>
                        Back to lessons
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="hidden sm:inline text-[10px] uppercase tracking-[0.2em] text-orange-500 font-bold">
                            Module Practice
                        </span>
                        <span className="text-sm font-bold text-white font-manrope truncate max-w-[40vw]">{moduleTitle}</span>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-8">
                {/* Progress + tabs */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold font-manrope text-white mb-2">Practice</h1>
                        <p className="text-zinc-400 text-sm">
                            Everything here comes from this module only. Get one wrong and you get a hint, not a lecture.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-zinc-300">
                            Quiz {mcqCorrect}/{practice.mcqs.length}
                        </div>
                        <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-zinc-300">
                            Coding {solvedCount}/{practice.coding.length}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 mb-8 bg-black/40 border border-white/5 rounded-xl p-1 w-fit">
                    <button
                        onClick={() => setTab('quiz')}
                        className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${tab === 'quiz' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <i className="fas fa-question-circle mr-2"></i>Quiz ({practice.mcqs.length})
                    </button>
                    {hasCoding && (
                        <button
                            onClick={() => setTab('coding')}
                            className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${tab === 'coding' ? 'bg-orange-500 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <i className="fas fa-code mr-2"></i>Coding ({practice.coding.length})
                        </button>
                    )}
                </div>

                {/* ---------------- QUIZ ---------------- */}
                {tab === 'quiz' && (
                    <div className="space-y-5 pb-16">
                        {practice.mcqs.map((q, index) => {
                            const picked = answers[q.id];
                            const isCorrect = picked === q.answer;
                            const answered = picked !== undefined;
                            return (
                                <div
                                    key={q.id}
                                    className={`practice-pop-in bg-zinc-900/40 backdrop-blur-md border rounded-2xl p-5 md:p-6 transition-colors ${
                                        !answered ? 'border-white/5' : isCorrect ? 'border-emerald-500/30' : 'border-red-500/30'
                                    }`}
                                    style={{ animationDelay: `${index * 60}ms` }}
                                >
                                    <div className="flex items-start gap-3 mb-4">
                                        <span className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[11px] font-bold text-zinc-400 flex-shrink-0">
                                            {index + 1}
                                        </span>
                                        <p className="text-zinc-100 font-medium leading-relaxed">{q.prompt}</p>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-3">
                                        {q.choices.map((choice) => {
                                            const chosen = picked === choice;
                                            const revealCorrect = answered && choice === q.answer;
                                            let cls = 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-zinc-300';
                                            if (revealCorrect) cls = 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200';
                                            else if (chosen && !isCorrect) cls = 'border-red-500/40 bg-red-500/10 text-red-200';
                                            return (
                                                <button
                                                    key={choice}
                                                    disabled={answered}
                                                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: choice }))}
                                                    className={`text-left text-sm px-4 py-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${cls} ${answered ? 'cursor-default' : 'cursor-pointer'}`}
                                                >
                                                    <span>{choice}</span>
                                                    {revealCorrect && <i className="fas fa-check-circle text-emerald-400 text-xs"></i>}
                                                    {chosen && !isCorrect && <i className="fas fa-times-circle text-red-400 text-xs"></i>}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {answered && (
                                        <div
                                            className={`practice-pop-in mt-4 p-4 rounded-xl border text-sm leading-relaxed ${
                                                isCorrect
                                                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-200/90'
                                                    : 'bg-orange-500/5 border-orange-500/20 text-orange-200/90'
                                            }`}
                                        >
                                            <p className="font-bold mb-1 text-xs uppercase tracking-wider">
                                                {isCorrect ? 'Correct' : `Not quite — the answer is "${q.answer}"`}
                                            </p>
                                            <p>{q.explanation}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {mcqCorrect === practice.mcqs.length && practice.mcqs.length > 0 && (
                            <div className="practice-correct text-center p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                                <i className="fas fa-trophy text-2xl text-emerald-400 mb-2"></i>
                                <p className="font-bold text-white">All quiz questions correct.</p>
                                <p className="text-sm text-emerald-200/70">Now go break some code.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ---------------- CODING ---------------- */}
                {tab === 'coding' && hasCoding && (
                    <div className="grid lg:grid-cols-2 gap-6 pb-16">
                        {/* Left: question */}
                        <div className="space-y-4">
                            <div className="flex gap-2 flex-wrap">
                                {practice.coding.map((c, index) => (
                                    <button
                                        key={c.id}
                                        onClick={() => selectCoding(index)}
                                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                                            index === codingIndex
                                                ? 'bg-orange-500/15 border-orange-500/40 text-orange-200'
                                                : solved[c.id]
                                                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                                                    : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:text-zinc-200'
                                        }`}
                                    >
                                        {solved[c.id] ? <i className="fas fa-check"></i> : <span>{index + 1}</span>}
                                        {c.difficulty}
                                    </button>
                                ))}
                            </div>

                            <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 md:p-6 practice-pop-in" key={current.id}>
                                <div className="flex items-center gap-3 mb-3">
                                    <h2 className="text-lg font-bold text-white font-manrope">{current.title}</h2>
                                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full border ${difficultyStyles[current.difficulty]}`}>
                                        {current.difficulty}
                                    </span>
                                </div>
                                <p className="text-zinc-300 text-sm leading-relaxed">{current.prompt}</p>

                                <div className="flex flex-wrap gap-3 mt-5">
                                    <button
                                        onClick={() => { setHintLevel(1); }}
                                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-200 text-xs font-bold hover:bg-white/10 transition-colors"
                                    >
                                        <i className="fas fa-lightbulb text-orange-400 mr-2"></i>Hint
                                    </button>
                                    <button
                                        onClick={() => { setExplainOpen(true); setExplainStep(1); }}
                                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-200 text-xs font-bold hover:bg-white/10 transition-colors"
                                    >
                                        <i className="fas fa-wand-magic-sparkles text-purple-400 mr-2"></i>Explain
                                    </button>
                                </div>
                            </div>

                            {/* Animated explanation */}
                            {explainOpen && (
                                <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-5 md:p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-xs uppercase tracking-[0.2em] font-bold text-purple-300">
                                            Step {explainStep} of {current.explanation.length}
                                        </p>
                                        <button
                                            onClick={() => setExplainOpen(false)}
                                            className="text-zinc-500 hover:text-white transition-colors"
                                            aria-label="Close explanation"
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>

                                    <ol className="space-y-3">
                                        {current.explanation.slice(0, explainStep).map((step, i) => (
                                            <li
                                                key={i}
                                                className="practice-step-in flex gap-3 text-sm text-zinc-200 leading-relaxed"
                                                style={{ animationDelay: `${i * 70}ms` }}
                                            >
                                                <span className="w-6 h-6 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                                                    {i + 1}
                                                </span>
                                                <span>{step}</span>
                                            </li>
                                        ))}
                                    </ol>

                                    <div className="flex gap-3 mt-5">
                                        {explainStep < current.explanation.length ? (
                                            <button
                                                onClick={() => setExplainStep((s) => s + 1)}
                                                className="flex-1 py-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-200 text-xs font-bold hover:bg-purple-500/25 transition-colors"
                                            >
                                                Next step
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setCode(current.solution)}
                                                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs font-bold hover:from-purple-500 hover:to-purple-400 transition-all"
                                            >
                                                <i className="fas fa-eye mr-2"></i>Show the solution in the editor
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right: editor + actions */}
                        <div className="space-y-4">
                            <div className="bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden shadow-xl">
                                <div className="h-1 w-full bg-gradient-to-r from-orange-500/20 to-purple-500/20" />
                                <div className="h-[340px]">
                                    <EditorPanel code={code} onCodeChange={(v) => setCode(v || '')} />
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={runTests}
                                    className="flex-1 min-w-[140px] py-3 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 text-white text-xs font-bold hover:from-orange-500 hover:to-orange-400 transition-all shadow-lg shadow-orange-500/20"
                                >
                                    <i className="fas fa-flask mr-2"></i>Run tests
                                </button>
                                <button
                                    onClick={runCode}
                                    className="py-3 px-5 rounded-xl bg-white/5 border border-white/10 text-zinc-200 text-xs font-bold hover:bg-white/10 transition-colors"
                                >
                                    <i className="fas fa-play mr-2"></i>Run
                                </button>
                                <button
                                    onClick={resetCode}
                                    className="py-3 px-5 rounded-xl bg-white/5 border border-white/10 text-zinc-400 text-xs font-bold hover:bg-white/10 transition-colors"
                                >
                                    <i className="fas fa-undo"></i>
                                </button>
                            </div>

                            <div className="bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden">
                                <div className="px-4 py-2 border-b border-white/5 bg-black/20 text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">
                                    {results ? 'Test results' : 'Console'}
                                </div>
                                <div className="h-[220px] overflow-y-auto custom-scrollbar">
                                    {results ? (
                                        <ul className="p-4 space-y-2">
                                            {results.map((r, i) => (
                                                <li
                                                    key={i}
                                                    className={`practice-pop-in text-xs p-3 rounded-lg flex items-start gap-2 ${
                                                        r.passed ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'
                                                    }`}
                                                    style={{ animationDelay: `${i * 50}ms` }}
                                                >
                                                    <i className={`fas ${r.passed ? 'fa-check-circle' : 'fa-times-circle'} mt-0.5`}></i>
                                                    <div className="flex-1">
                                                        <code className="block opacity-80 break-all">{r.test}</code>
                                                        {r.error && <span className="block mt-1 font-semibold">{r.error}</span>}
                                                    </div>
                                                </li>
                                            ))}
                                            {results.length > 0 && results.every((r) => r.passed) && (
                                                <li className="practice-correct text-center text-emerald-400 text-xs font-bold py-3">
                                                    <i className="fas fa-trophy mr-2"></i>All tests passed.
                                                </li>
                                            )}
                                        </ul>
                                    ) : (
                                        <ConsolePanel output={output} />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Hint overlay */}
            {hintLevel > 0 && hasCoding && (
                <HintOverlay
                    hints={current.hints}
                    level={hintLevel}
                    targetLabel={current.target.label}
                    onNext={() => setHintLevel((l) => Math.min(l + 1, current.hints.length))}
                    onClose={() => setHintLevel(0)}
                />
            )}
        </div>
    );
};

export default PracticeView;
