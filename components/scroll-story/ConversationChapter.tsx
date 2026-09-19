import { useRef } from 'react';
import { useScroll } from 'framer-motion';
import { ChapterShell } from './ChapterShell';
import { Station, StationLabel, StoryPath } from './StoryPath';
import { CHAPTER_COPY, STORY, scrollTarget } from './story';

/** The problem stroke continues straight down, then breathes into a waveform. */
const PATH_D =
  'M400,-20 C400,40 400,60 400,110 ' +
  'C550,170 550,250 400,310 ' +
  'C250,370 250,450 400,510 ' +
  'C550,570 550,650 400,710 ' +
  'C250,770 250,850 400,910 ' +
  'C550,970 550,1050 400,1110 ' +
  'C350,1135 380,1180 400,1260';

interface Message {
  speaker: 'YOU' | 'ECOSYSTEM';
  lines: [string, string?];
  /** Left or right of the waveform. */
  side: 'left' | 'right';
  y: number;
  at: number;
}

const MESSAGES: Message[] = [
  { speaker: 'YOU', lines: ["Why isn't this", 'function working?'], side: 'right', y: 300, at: 0.24 },
  { speaker: 'ECOSYSTEM', lines: ["Let's look at what your", 'function is returning...'], side: 'left', y: 540, at: 0.44 },
  { speaker: 'YOU', lines: ['Can you explain that?'], side: 'right', y: 780, at: 0.64 },
  { speaker: 'ECOSYSTEM', lines: ['Sure. Think of it', 'this way...'], side: 'left', y: 1020, at: 0.84 },
];

function Bubble({ message, children }: { message: Message; children: React.ReactNode }): JSX.Element {
  const x = message.side === 'left' ? 30 : 400;
  const labelX = message.side === 'left' ? 58 : 428;
  return (
    <g>
      <rect
        x={x}
        y={message.y - 72}
        width={370}
        height={message.lines[1] ? 144 : 112}
        rx={24}
        fill={STORY.card}
        stroke={STORY.hairline}
        strokeWidth={2}
      />
      <StationLabel
        x={labelX}
        y={message.y - 36}
        anchor="start"
        size={19}
        spacing="4px"
        color={message.speaker === 'YOU' ? STORY.pine : STORY.ember}
      >
        {message.speaker}
      </StationLabel>
      {children}
    </g>
  );
}

/**
 * Chapter 2 — the conversation. The stroke from Chapter 1 continues and
 * evolves into a voice-waveform trajectory; exchanges reveal progressively
 * as the user travels through them. Nothing autoplays.
 */
export function ConversationChapter(): JSX.Element {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: scrollTarget(ref), offset: ['start start', 'end end'] });

  return (
    <ChapterShell copy={CHAPTER_COPY[1]} sectionRef={ref} progress={scrollYProgress}>
      <svg
        viewBox="0 0 800 1240"
        preserveAspectRatio="xMidYMid meet"
        className="h-full max-h-full w-auto max-w-full"
        role="img"
        aria-label="A waveform path through a voice conversation"
      >
        <StoryPath d={PATH_D} progress={scrollYProgress} />
        {MESSAGES.map((m) => {
          const labelX = m.side === 'left' ? 58 : 428;
          return (
            <Station key={`${m.speaker}-${m.y}`} progress={scrollYProgress} at={m.at}>
              <Bubble message={m}>
                <StationLabel x={labelX} y={m.y + 2} anchor="start" size={25} weight={600}>
                  {m.lines[0]}
                </StationLabel>
                {m.lines[1] ? (
                  <StationLabel x={labelX} y={m.y + 34} anchor="start" size={25} weight={600}>
                    {m.lines[1]}
                  </StationLabel>
                ) : null}
              </Bubble>
            </Station>
          );
        })}
      </svg>
    </ChapterShell>
  );
}
