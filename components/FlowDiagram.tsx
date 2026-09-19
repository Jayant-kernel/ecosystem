import React from 'react';
import { Flow } from '../types';

interface FlowDiagramProps {
    flow: Flow;
}

/**
 * A small flow chart for the Guide tab.
 * Vertical reads as a timeline; horizontal reads as a chain of steps.
 */
const FlowDiagram: React.FC<FlowDiagramProps> = ({ flow }) => {
    const horizontal = flow.direction === 'horizontal';

    return (
        <figure className="practice-pop-in rounded-2xl border border-white/10 bg-black/30 p-4 md:p-5">
            {flow.title && (
                <figcaption className="text-[10px] uppercase tracking-[0.2em] font-bold text-orange-400 mb-4">
                    {flow.title}
                </figcaption>
            )}

            {horizontal ? (
                <div className="flex flex-wrap items-center gap-2">
                    {flow.steps.map((step, i) => (
                        <React.Fragment key={i}>
                            {i > 0 && (
                                <i className="fas fa-arrow-right text-orange-500/60 text-xs px-1 flex-shrink-0"></i>
                            )}
                            <div
                                className="practice-step-in flex-1 min-w-[130px] rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5"
                                style={{ animationDelay: `${i * 90}ms` }}
                            >
                                <p className="text-xs font-semibold text-zinc-100 leading-tight">{step.label}</p>
                                {step.detail && (
                                    <p className="text-[10px] text-zinc-500 mt-1 leading-snug">{step.detail}</p>
                                )}
                            </div>
                        </React.Fragment>
                    ))}
                </div>
            ) : (
                <ol>
                    {flow.steps.map((step, i) => {
                        const isLast = i === flow.steps.length - 1;
                        return (
                            <li
                                key={i}
                                className="practice-step-in flex gap-3"
                                style={{ animationDelay: `${i * 90}ms` }}
                            >
                                {/* Rail: number badge, then the connector to the next step. */}
                                <div className="flex flex-col items-center flex-shrink-0">
                                    <span className="w-7 h-7 rounded-full bg-orange-500/15 border border-orange-500/40 text-orange-300 text-[11px] font-bold flex items-center justify-center">
                                        {i + 1}
                                    </span>
                                    {!isLast && (
                                        <>
                                            <span className="w-px flex-1 min-h-[12px] bg-gradient-to-b from-orange-500/45 to-orange-500/15" />
                                            <i className="fas fa-chevron-down text-[9px] text-orange-500/70 flow-arrow my-0.5" aria-hidden="true"></i>
                                            <span className="w-px flex-1 min-h-[10px] bg-gradient-to-b from-orange-500/15 to-transparent" />
                                        </>
                                    )}
                                </div>

                                <div className={isLast ? 'pt-0.5' : 'pt-0.5 pb-4'}>
                                    <p className="text-sm font-semibold text-zinc-100 leading-tight">{step.label}</p>
                                    {step.detail && (
                                        <p className="text-xs text-zinc-500 mt-1 leading-snug">{step.detail}</p>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ol>
            )}
        </figure>
    );
};

export default FlowDiagram;
