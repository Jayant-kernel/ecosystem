import { useRef } from 'react';
import { useScroll } from 'framer-motion';
import { ChapterShell } from './ChapterShell';
import { Station, StationLabel, StoryPath } from './StoryPath';
import { CHAPTER_COPY, scrollTarget } from './story';

/** A hand-drawn loop: near-closed circle with a slight organic wobble. */
const LOOP_D =
  'M400,168 ' +
  'C560,168 662,298 656,440 ' +
  'C650,582 540,692 398,692 ' +
  'C258,692 144,580 148,436 ' +
  'C152,296 246,166 400,168';

const CONCEPTS = [
  { word: 'ASK', x: 400, y: 118, at: 0.12 },
  { word: 'UNDERSTAND', x: 692, y: 348, at: 0.3 },
  { word: 'BUILD', x: 578, y: 672, at: 0.5 },
  { word: 'DEBUG', x: 222, y: 672, at: 0.7 },
  { word: 'LEARN', x: 108, y: 348, at: 0.88 },
];

/**
 * Chapter 3 — the learning loop. The stroke travels a large circular path;
 * each concept activates as the stroke reaches it and stays visible,
 * communicating ASK → UNDERSTAND → BUILD → DEBUG → LEARN → ASK.
 */
export function LearningLoopChapter(): JSX.Element {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: scrollTarget(ref), offset: ['start start', 'end end'] });

  return (
    <ChapterShell copy={CHAPTER_COPY[2]} sectionRef={ref} progress={scrollYProgress}>
      <svg
        viewBox="0 0 800 800"
        preserveAspectRatio="xMidYMid meet"
        className="h-full max-h-full w-auto max-w-full"
        role="img"
        aria-label="A continuous learning loop connecting five concepts"
      >
        <StoryPath d={LOOP_D} progress={scrollYProgress} strokeWidth={6} />
        {CONCEPTS.map((c) => (
          <Station key={c.word} progress={scrollYProgress} at={c.at}>
            <StationLabel x={c.x} y={c.y} size={36} spacing="5px">
              {c.word}
            </StationLabel>
          </Station>
        ))}
      </svg>
    </ChapterShell>
  );
}
