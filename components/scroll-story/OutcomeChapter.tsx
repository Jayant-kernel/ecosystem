import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ChapterShell } from './ChapterShell';
import { StoryPath } from './StoryPath';
import { CHAPTER_COPY, STORY, STORY_FONT, scrollTarget } from './story';
import type { View } from '../../App';

/**
 * Three strokes converge from wide to a single point, then continue as one
 * trunk line toward the final call to action — visual simplification after
 * the journey's complexity.
 */
const CONVERGE_D =
  'M180,-20 C220,200 320,380 400,560 ' +
  'M400,-20 C400,220 400,400 400,560 ' +
  'M620,-20 C580,200 480,380 400,560 ' +
  'M400,560 C400,680 400,780 400,920';

const OUTCOMES = [
  'Learn concepts.',
  'Understand errors.',
  'Build with confidence.',
];

interface OutcomeChapterProps {
  navigateTo: (view: View) => void;
}

/**
 * Chapter 4 — the outcome. Paths converge, outcomes land one by one beside
 * the narrowing stroke, and the section resolves into the final CTA in
 * normal document flow right after the runway.
 */
export function OutcomeChapter({ navigateTo }: OutcomeChapterProps): JSX.Element {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: scrollTarget(ref), offset: ['start start', 'end end'] });
  const reduce = useReducedMotion();
  const lineFills = [
    useTransform(scrollYProgress, () => 1),
    useTransform(scrollYProgress, () => 1),
    useTransform(scrollYProgress, () => 1),
  ];
  const lineProgress = [
    useTransform(scrollYProgress, [0.3, 0.42], [0, 1]),
    useTransform(scrollYProgress, [0.5, 0.62], [0, 1]),
    useTransform(scrollYProgress, [0.7, 0.82], [0, 1]),
  ];

  const support = (
    <div className="mt-4 max-w-xl text-base leading-relaxed md:text-lg" style={{ color: STORY.muted }}>
      {OUTCOMES.map((line, i) => (
        <motion.p key={line} style={{ opacity: reduce ? lineFills[i] : lineProgress[i] }}>
          {line}
        </motion.p>
      ))}
    </div>
  );

  return (
    <>
      <ChapterShell copy={CHAPTER_COPY[3]} sectionRef={ref} progress={scrollYProgress} supportOverride={support}>
        <svg
          viewBox="0 0 800 920"
          preserveAspectRatio="xMidYMid meet"
          className="h-full max-h-full w-auto max-w-full"
          role="img"
          aria-label="Three paths converging into one toward the call to action"
        >
          <StoryPath d={CONVERGE_D} progress={scrollYProgress} />
        </svg>
      </ChapterShell>
      <div className="relative px-6 py-28 text-center md:py-36" style={{ background: STORY.bg }}>
        <p
          className="mb-4 text-[11px] font-bold uppercase tracking-[0.3em] md:text-xs"
          style={{ color: STORY.ember, fontFamily: STORY_FONT }}
        >
          Begin today
        </p>
        <p className="font-manrope text-4xl font-medium tracking-[-0.02em] md:text-6xl" style={{ color: STORY.ink }}>
          Talk. Code. Understand.
        </p>
        <button
          type="button"
          onClick={() => navigateTo('signup')}
          className="font-manrope mt-10 inline-flex items-center gap-3 rounded-full px-9 py-4 text-sm font-bold uppercase tracking-widest text-white transition-transform hover:scale-[1.03]"
          style={{ background: STORY.ink, fontFamily: STORY_FONT }}
        >
          Start your journey
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </>
  );
}
