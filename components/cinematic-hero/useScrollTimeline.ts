import { useCallback, useEffect } from 'react';
import type { RefObject } from 'react';
import { setFilmTarget } from './filmDriver';

/**
 * Maps scroll position through the hero runway to the film target.
 *
 * The hook only writes a numeric target. It never sets React state per scroll
 * event, and it never drives camera motion directly.
 */
export function useScrollTimeline(
  runwayRef: RefObject<HTMLElement | null>,
  disabled = false,
): void {
  const updateFromScroll = useCallback(() => {
    if (disabled || typeof window === 'undefined') return;
    const runway = runwayRef.current;
    if (!runway) return;

    const rect = runway.getBoundingClientRect();
    const viewport = window.innerHeight || 1;
    const travel = Math.max(1, rect.height - viewport);
    const progressed = -rect.top / travel;
    setFilmTarget(progressed);
  }, [disabled, runwayRef]);

  useEffect(() => {
    updateFromScroll();
    if (disabled || typeof window === 'undefined') return;
    window.addEventListener('scroll', updateFromScroll, { passive: true });
    window.addEventListener('resize', updateFromScroll);
    return () => {
      window.removeEventListener('scroll', updateFromScroll);
      window.removeEventListener('resize', updateFromScroll);
    };
  }, [updateFromScroll, disabled]);
}
