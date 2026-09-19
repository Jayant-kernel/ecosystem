/**
 * Shared tokens, copy, and scroll-window math for the scroll-story journey.
 *
 * Everything here is static data. Animation input is always Framer Motion's
 * scroll progress (native document scroll is the only driver), so every
 * reveal is a pure function of scroll position — deterministic in both
 * directions with no timers, loops, or event handlers.
 */
import type { MutableRefObject } from 'react';
import type { UseScrollOptions } from 'framer-motion';

/** Editorial light-theme tokens for the story (contrast after the dark hero). */
export const STORY = {
  bg: '#F4F3EE',
  bgDeep: '#ECEAE2',
  ink: '#101C30',
  muted: '#5B6B82',
  faint: '#9AA6B8',
  ember: '#C2410C',
  pine: '#1E7A46',
  lime: '#B9FF66',
  card: '#FFFFFF',
  hairline: 'rgba(16, 28, 48, 0.12)',
} as const;

export const STORY_FONT = 'Manrope, Inter, system-ui, sans-serif';

/** Tall cinematic dwell per chapter, in viewports (mirrors TIMELINE.runwayViewportHeights). */
export const CHAPTER_VIEWPORTS = 3;

export interface StoryCopy {
  index: string;
  eyebrow: string;
  headline: string;
  headlineSecond?: string;
  support: string;
}

export const CHAPTER_COPY: StoryCopy[] = [
  {
    index: '01',
    eyebrow: "LEARNING TO CODE SHOULDN'T FEEL LIKE THIS",
    headline: 'Coding gets complicated.',
    support:
      'No more jumping between documentation, tutorials, Stack Overflow, and your editor just to understand one error. Ecosystem stays with you while you code.',
  },
  {
    index: '02',
    eyebrow: 'YOUR AI CODING COMPANION',
    headline: 'Your voice becomes your interface.',
    support:
      "Ask a question naturally. Share what you're building. Describe an error. Ecosystem understands the context and helps you move forward without breaking your flow.",
  },
  {
    index: '03',
    eyebrow: 'BUILT FOR UNDERSTANDING',
    headline: "Don't just get the answer.",
    headlineSecond: 'Understand the code.',
    support:
      "Ecosystem doesn't have to replace the thinking. It can guide you through concepts, explain unfamiliar code, break down errors, and help you discover the solution yourself.",
  },
  {
    index: '04',
    eyebrow: 'ONE PLACE TO GROW',
    headline: 'From stuck',
    headlineSecond: 'to building.',
    support: 'Learn concepts. Understand errors. Build with confidence.',
  },
];

/**
 * Activation window for a station sitting at `fraction` of a path's drawn
 * length. The word starts appearing just before the stroke arrives and is
 * fully present on arrival; it stays latched (outputs clamp) afterwards, so
 * reverse scrolling deterministically deactivates it again.
 */
export function stationWindow(fraction: number, lead = 0.1): [number, number] {
  const end = Math.min(0.995, Math.max(0.02, fraction));
  const start = Math.max(0, end - lead);
  return [start, end];
}

/** Evenly spaced station fractions for `count` stations along a path. */
export function evenFractions(count: number): number[] {
  return Array.from({ length: count }, (_, i) => (i + 0.75) / (count + 0.5));
}

/**
 * Adapts a section element ref to Framer Motion v13's scroll-target type.
 * Same role as the cinematic hero's `runwayRef` (an `HTMLElement` ref bound
 * to a `<section>`), kept behind this helper so chapters never fight the
 * motion library's own `RefObject` flavor.
 */
export function scrollTarget(ref: MutableRefObject<HTMLElement | null>): UseScrollOptions['target'] {
  return ref as unknown as UseScrollOptions['target'];
}
