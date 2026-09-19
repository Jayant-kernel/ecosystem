import React from 'react';

interface HintOverlayProps {
    hints: string[];
    /** How many hints have been revealed so far (1-based). */
    level: number;
    targetLabel: string;
    onNext: () => void;
    onClose: () => void;
}

/**
 * Blur-the-page hint overlay with an animated arrow pointing at the code area.
 * Hints are revealed one at a time so the learner is nudged, not told.
 */
const HintOverlay: React.FC<HintOverlayProps> = ({ hints, level, targetLabel, onNext, onClose }) => {
    const current = hints[Math.min(level, hints.length) - 1] ?? '';
    const isLast = level >= hints.length;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 practice-fade-in">
            {/* Blur the whole page behind the hint. */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-xl"
                onClick={onClose}
                aria-hidden="true"
            />

            <div className="relative w-full max-w-lg practice-pop-in">
                <div className="relative bg-[#121212] border border-orange-500/30 rounded-2xl p-6 shadow-2xl shadow-orange-500/10 overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500/40 via-orange-400 to-orange-500/40" />

                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
                                <i className="fas fa-lightbulb text-orange-400 text-sm"></i>
                            </span>
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-orange-400 font-bold">Hint</p>
                                <p className="text-[11px] text-zinc-500">
                                    {level} of {hints.length}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-zinc-500 hover:text-white transition-colors p-1"
                            aria-label="Close hint"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>

                    <p className="text-zinc-200 leading-relaxed text-sm practice-pop-in" key={level}>
                        {current}
                    </p>

                    <div className="flex items-center gap-3 mt-6">
                        {!isLast && (
                            <button
                                onClick={onNext}
                                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-200 text-sm font-semibold hover:bg-white/10 transition-colors"
                            >
                                <i className="fas fa-arrow-down mr-2 text-orange-400"></i>
                                Another hint
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 text-white text-sm font-bold hover:from-orange-500 hover:to-orange-400 transition-all"
                        >
                            {isLast ? "I'll try it now" : 'Got it'}
                        </button>
                    </div>

                    {/* Animated arrow pointing at where the code changes. */}
                    <div className="mt-6 flex items-center justify-end gap-3">
                        <span className="text-[11px] uppercase tracking-wider text-orange-300 font-bold bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1">
                            {targetLabel}
                        </span>
                        <svg
                            width="96"
                            height="64"
                            viewBox="0 0 96 64"
                            fill="none"
                            className="practice-arrow text-orange-400"
                            aria-hidden="true"
                        >
                            <path
                                className="practice-arrow-path"
                                d="M8 6 C 40 6, 62 18, 74 44"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                fill="none"
                            />
                            <path d="M62 40 L 76 52 L 80 34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HintOverlay;
