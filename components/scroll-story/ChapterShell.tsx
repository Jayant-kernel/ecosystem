import type { MutableRefObject } from 'react';
import { motion, useReducedMotion, useTransform, type MotionValue } from 'framer-motion';
import { CHAPTER_VIEWPORTS, STORY, STORY_FONT, type StoryCopy } from './story';

interface ChapterShellProps {
  copy: StoryCopy;
  sectionRef: MutableRefObject<HTMLElement | null>;
  progress: MotionValue<number>;
  /** Replaces the static support paragraph (e.g. progressively revealed lines). */
  supportOverride?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * One cinematic chapter: a tall scroll runway with a sticky full-viewport
 * stage. `progress` travels 0 → 1 across the runway and is the sole input
 * for every reveal inside. Reverse scrolling reverses everything exactly.
 */
export function ChapterShell({ copy, sectionRef, progress, supportOverride, children }: ChapterShellProps): JSX.Element {
  const reduce = useReducedMotion();
  const filled = useTransform(progress, () => 1);
  const hairline = reduce ? filled : progress;

  return (
    <section ref={sectionRef} style={{ height: `${CHAPTER_VIEWPORTS * 100}vh` }} className="relative">
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden px-6 pt-24 md:px-12">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-5 flex items-center gap-4">
            <span
              className="text-xs font-bold tracking-[0.3em]"
              style={{ color: STORY.ember, fontFamily: STORY_FONT }}
            >
              {copy.index}
            </span>
            <motion.div
              aria-hidden="true"
              className="h-px flex-1 origin-left"
              style={{ background: STORY.hairline, scaleX: hairline }}
            />
          </div>
          <p
            className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] md:text-xs"
            style={{ color: STORY.ember, fontFamily: STORY_FONT }}
          >
            {copy.eyebrow}
          </p>
          <h2
            className="font-manrope text-4xl font-medium leading-[1.02] tracking-[-0.02em] md:text-6xl"
            style={{ color: STORY.ink }}
          >
            {copy.headline}
            {copy.headlineSecond ? (
              <>
                <br />
                {copy.headlineSecond}
              </>
            ) : null}
          </h2>
          {supportOverride ?? (
            <p className="mt-4 max-w-xl text-base leading-relaxed md:text-lg" style={{ color: STORY.muted }}>
              {copy.support}
            </p>
          )}
        </div>
        <div className="relative mx-auto flex w-full max-w-6xl flex-1 items-center justify-center py-4">
          {children}
        </div>
      </div>
    </section>
  );
}
