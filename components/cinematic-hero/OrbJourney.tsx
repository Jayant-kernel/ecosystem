import type { Ref, RefObject } from 'react';
import { smoothstep } from './timeline';

/**
 * Cinematic "rolling orb journey": a glowing orb that rolls down a curved
 * slide/track along the right rail of the hero as the film advances.
 *
 * Everything here is a pure function of film time `t` — the existing Overlay
 * tick calls `updateOrbJourney` alongside its other style writes, so there is
 * no second scroll system, no animation loop, no timers, and reverse
 * scrubbing retraces the exact same path. The journey lives inside the 3D
 * flight (fully faded before the handoff panel takes over), so it never
 * competes with the assembled headline.
 */

export const ORB_APPEAR_START = 0.08;
export const ORB_APPEAR_END = 0.22;
/** Orb travel window: starts after the opening frames, ends as the canvas yields. */
export const ORB_TRAVEL_START = 0.15;
export const ORB_TRAVEL_END = 0.8;

/** ViewBox geometry of the slide track. */
export const ORB_VIEW_W = 200;
export const ORB_VIEW_H = 1000;

/** S-curve slide from top-center to bottom-center of the rail. */
export const ORB_PATH_D =
  'M100,10 C100,120 170,160 165,260 ' +
  'C160,360 40,400 45,500 ' +
  'C50,600 160,640 155,740 ' +
  'C150,840 110,900 100,990';

/** Orb diameter as a fraction of the rail width (resolution-independent). */
const ORB_DIAMETER_FRACTION = 0.22;

export interface OrbRefs {
  wrap: RefObject<HTMLDivElement | null>;
  track: RefObject<SVGPathElement | null>;
  drawn: RefObject<SVGPathElement | null>;
  orb: RefObject<HTMLDivElement | null>;
  speckle: RefObject<HTMLDivElement | null>;
  lengthCache: { current: number };
}

/** 0 → 1 travel progress along the slide for film time `t`. */
export function orbPathProgress(t: number): number {
  return smoothstep(ORB_TRAVEL_START, ORB_TRAVEL_END, t);
}

/**
 * Writes the orb journey for film time `t`. All quantities derive from path
 * geometry: position from `getPointAtLength`, rolling rotation from arc
 * length over orb circumference (true rolling, not a timer spin).
 */
export function updateOrbJourney(refs: OrbRefs, t: number, canvasFade: number): void {
  const { wrap, track, drawn, orb, speckle, lengthCache } = refs;
  const wrapEl = wrap.current;
  const trackEl = track.current;
  if (!wrapEl || !trackEl) return;

  const appear = smoothstep(ORB_APPEAR_START, ORB_APPEAR_END, t);
  const opacity = appear * (1 - canvasFade);
  wrapEl.style.opacity = opacity.toFixed(3);
  wrapEl.style.visibility = opacity <= 0.01 ? 'hidden' : 'visible';
  if (opacity <= 0.01) return;

  if (!lengthCache.current) {
    try {
      lengthCache.current = trackEl.getTotalLength();
    } catch {
      return;
    }
    if (!lengthCache.current) return;
  }
  const total = lengthCache.current;
  const progress = orbPathProgress(t);
  const drawnEl = drawn.current;
  if (drawnEl) {
    const drawnLen = progress * total;
    drawnEl.style.strokeDasharray = `${drawnLen.toFixed(1)} ${total.toFixed(1)}`;
  }

  const orbEl = orb.current;
  if (!orbEl) return;
  let point: { x: number; y: number };
  try {
    point = trackEl.getPointAtLength(progress * total);
  } catch {
    return;
  }
  const xPct = (point.x / ORB_VIEW_W) * 100;
  const yPct = (point.y / ORB_VIEW_H) * 100;
  orbEl.style.left = `${xPct.toFixed(2)}%`;
  orbEl.style.top = `${yPct.toFixed(2)}%`;

  // True rolling: rotation angle = arc travelled / orb radius, both in
  // viewBox units, so rolling stays physical at any viewport size. Tangent
  // direction is unused for shading (the light source stays fixed) — only
  // the speckle marker rolls.
  const orbRadiusUnits = (ORB_DIAMETER_FRACTION / 2) * ORB_VIEW_W;
  const rollDeg = ((progress * total) / Math.max(1e-6, orbRadiusUnits)) * (180 / Math.PI);
  const speckleEl = speckle.current;
  if (speckleEl) {
    speckleEl.style.transform = `rotate(${rollDeg.toFixed(1)}deg)`;
  }
}

export function OrbJourneyMarkup(refs: {
  wrap: Ref<HTMLDivElement>;
  track: Ref<SVGPathElement>;
  drawn: Ref<SVGPathElement>;
  orb: Ref<HTMLDivElement>;
  speckle: Ref<HTMLDivElement>;
}): JSX.Element {
  return (
    <div
      ref={refs.wrap}
      aria-hidden="true"
      className="pointer-events-none absolute bottom-[6%] right-[4%] top-[6%] aspect-[1/5] w-[72px] md:right-[6%] md:w-[120px]"
      style={{ opacity: 0, visibility: 'hidden' }}
    >
      <svg
        viewBox={`0 0 ${ORB_VIEW_W} ${ORB_VIEW_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full"
      >
        {/* Dark translucent slide body. */}
        <path
          ref={refs.track}
          d={ORB_PATH_D}
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={7}
          strokeLinecap="round"
        />
        {/* Warm illuminated channel where the orb has travelled. */}
        <path
          ref={refs.drawn}
          d={ORB_PATH_D}
          fill="none"
          stroke="rgba(249,115,22,0.28)"
          strokeWidth={7}
          strokeLinecap="round"
        />
        <path
          d={ORB_PATH_D}
          fill="none"
          stroke="#fdba74"
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.55}
        />
      </svg>
      {/* Dimensional glowing orb with a rolling speckle marker. */}
      <div
        ref={refs.orb}
        className="absolute aspect-square w-[22%]"
        style={{ transform: 'translate(-50%, -50%)', left: '50%', top: '1%' }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle at 34% 30%, #fff7ed 0%, #fdba74 32%, #f97316 62%, #7c2d12 100%)',
            boxShadow: '0 0 18px 4px rgba(249,115,22,0.45), 0 0 46px 12px rgba(249,115,22,0.18), 0 6px 14px rgba(0,0,0,0.5)',
          }}
        />
        <div ref={refs.speckle} className="absolute inset-0">
          <div
            className="absolute rounded-full"
            style={{ width: '26%', height: '26%', left: '12%', top: '8%', background: 'rgba(124,45,18,0.55)' }}
          />
        </div>
      </div>
    </div>
  );
}
