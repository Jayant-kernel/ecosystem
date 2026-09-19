import type { FilmNotify } from './types';

/**
 * Mutable bridge between DOM scroll and the isolated R3F render loop.
 *
 * Scroll writes only `targetT`. The canvas damps `currentT` toward that target
 * and renders while the two differ. React state is intentionally unused here so
 * pointer/scroll input never causes per-frame component renders.
 */
export interface FilmDriver {
  targetT: number;
  currentT: number;
  notify: FilmNotify | null;
}

export const filmDriver: FilmDriver = {
  targetT: 0,
  currentT: 0,
  notify: null,
};

export function setFilmTarget(nextT: number): boolean {
  const clamped = Number.isFinite(nextT) ? Math.min(1, Math.max(0, nextT)) : 0;
  if (Math.abs(clamped - filmDriver.targetT) <= 0.0000005) {
    return false;
  }

  filmDriver.targetT = clamped;
  filmDriver.notify?.();
  return true;
}

export function resetFilmDriver(): void {
  filmDriver.targetT = 0;
  filmDriver.currentT = 0;
}
