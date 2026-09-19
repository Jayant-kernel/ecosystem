import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { filmDriver } from './filmDriver';
import { sampleTimeline, smoothstep } from './timeline';

/**
 * Handoff window: the 3D screen fades out while the DOM panel fades in over
 * 0.62–0.78. Both are smoothstep curves in `t` — a pure function of film
 * progress, identical forward and reverse. The canvas lags the panel slightly
 * so no background edge or bezel can flash through mid-blend.
 */
const HANDOFF_START = 0.62;
const HANDOFF_END = 0.78;

const showDebugUi = (import.meta as any).env?.DEV === true;

interface OverlayProps {
  navigateTo: (view: 'signup' | 'courses') => void;
  canvasWrapRef: RefObject<HTMLDivElement | null>;
}

function FilmDebugReadout(): JSX.Element {
  const readoutRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      const el = readoutRef.current;
      if (!el) return;
      const film = sampleTimeline(filmDriver.currentT);
      el.textContent =
        `t ${film.t.toFixed(3)} · target ${filmDriver.targetT.toFixed(3)} · ` +
        `dist ${film.cameraDistance.toFixed(2)} · lid ${film.lidOpen.toFixed(2)}`;
    }, 200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      ref={readoutRef}
      className="pointer-events-none absolute left-4 top-24 rounded-lg border border-white/10 bg-black/70 px-3 py-2 font-mono text-[11px] leading-5 text-zinc-300"
    />
  );
}

function setFade(
  el: HTMLElement | null,
  opacity: number,
  translateYPx = 0,
  interactive = false,
): void {
  if (!el) return;
  const clamped = Math.min(1, Math.max(0, opacity));
  el.style.opacity = clamped.toFixed(3);
  el.style.visibility = clamped <= 0.01 ? 'hidden' : 'visible';
  el.style.transform = translateYPx ? `translateY(${translateYPx.toFixed(1)}px)` : '';
  if (interactive) {
    el.style.pointerEvents = clamped > 0.5 ? 'auto' : 'none';
  }
}

/**
 * DOM overlay for the film. Every opacity and offset below is a pure function
 * of film time, so forward and reverse scrubbing render identical frames for
 * identical `t`. A dedicated lightweight loop writes only these styles and
 * runs solely while the runway is visible.
 */
export default function Overlay({ navigateTo, canvasWrapRef }: OverlayProps): JSX.Element {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const hintRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const eyebrowRef = useRef<HTMLParagraphElement | null>(null);
  const headlineRef = useRef<HTMLHeadingElement | null>(null);
  const subRef = useRef<HTMLParagraphElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const noteRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === 'undefined') return;
    const runway = root.closest('[data-cinematic-hero="runway"]');
    let raf = 0;
    let running = false;
    let lastSignature = '';

    const tick = () => {
      const film = sampleTimeline(filmDriver.currentT);
      const signature = `${film.t.toFixed(4)}|${filmDriver.targetT.toFixed(4)}`;
      if (signature !== lastSignature) {
        lastSignature = signature;
        const t = film.t;

        // Scroll hint: fades and drifts up over the opening frames.
        const hintOut = smoothstep(0, 0.08, t);
        setFade(hintRef.current, 1 - hintOut, -12 * hintOut);

        // Film progress hairline: grows with t, yields as the panel takes over.
        const panel = smoothstep(HANDOFF_START, HANDOFF_END, t);
        const progress = progressRef.current;
        if (progress) {
          progress.style.width = `${(t * 100).toFixed(1)}%`;
          setFade(progress, 1 - panel);
        }

        // Handoff: panel fades in while the canvas fades slightly behind it.
        // Editorial children stagger inside the same window; the note settles
        // just after. All pure in t — reverse is the exact inverse.
        setFade(panelRef.current, panel, 0, true);
        const eyebrow = smoothstep(0.64, 0.74, t);
        setFade(eyebrowRef.current, eyebrow);
        const headline = smoothstep(0.66, 0.78, t);
        setFade(headlineRef.current, headline, (1 - headline) * 20);
        const sub = smoothstep(0.68, 0.8, t);
        setFade(subRef.current, sub, (1 - sub) * 16);
        const ctas = smoothstep(0.7, 0.82, t);
        setFade(ctaRef.current, ctas, (1 - ctas) * 12);
        setFade(noteRef.current, smoothstep(0.72, 0.84, t));

        const canvasFade = smoothstep(HANDOFF_START + 0.02, HANDOFF_END + 0.03, t);
        const canvasWrap = canvasWrapRef.current;
        if (canvasWrap) {
          canvasWrap.style.opacity = (1 - canvasFade).toFixed(3);
          canvasWrap.style.visibility = canvasFade >= 0.99 ? 'hidden' : 'visible';
        }
      }
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (running) return;
      running = true;
      lastSignature = '';
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    let io: IntersectionObserver | null = null;
    if (runway && 'IntersectionObserver' in window) {
      io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) start();
          else stop();
        },
        { rootMargin: '200px' },
      );
      io.observe(runway);
    } else {
      start();
    }
    return () => {
      stop();
      io?.disconnect();
    };
  }, [canvasWrapRef]);

  return (
    <div ref={rootRef} className="absolute inset-0 z-10">
      {/* Static cinematic vignette (pure CSS, zero GPU loop cost). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)' }}
      />
      <div ref={hintRef} className="absolute inset-x-0 bottom-10 flex justify-center">
        <div className="rounded-full border border-white/10 bg-black/55 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-300 backdrop-blur-sm">
          Scroll to move the camera
        </div>
      </div>
      {/* Film progress hairline. */}
      <div
        ref={progressRef}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 h-px bg-orange-500/60"
        style={{ width: '0%' }}
      />

      <div
        ref={panelRef}
        className="absolute inset-0 flex items-center justify-center bg-[#0D0D0D] px-6 text-center"
        style={{ opacity: 0, visibility: 'hidden' }}
      >
        <div className="max-w-2xl">
          <p
            ref={eyebrowRef}
            className="mb-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-500/90"
          >
            Ecosystem · AI coding tutor
          </p>
          <h1
            ref={headlineRef}
            className="mb-5 font-manrope text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-white md:text-6xl"
          >
            Master code with your voice.
          </h1>
          <p ref={subRef} className="mx-auto mb-8 max-w-lg text-base leading-relaxed text-zinc-400/90 md:text-lg">
            The conversational coding companion. From explaining complex concepts to
            real-time debugging, learn faster by talking to your code.
          </p>
          <div ref={ctaRef} className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              type="button"
              onClick={() => navigateTo('signup')}
              className="rounded-full bg-white px-7 py-3.5 text-[13px] font-bold uppercase tracking-widest text-black transition-colors hover:bg-orange-500 hover:text-white"
            >
              Start Learning Free
            </button>
            <button
              type="button"
              onClick={() => navigateTo('courses')}
              className="rounded-full border border-white/15 px-7 py-3.5 text-[13px] font-bold uppercase tracking-widest text-zinc-300 transition-colors hover:border-white/40 hover:text-white"
            >
              Browse courses
            </button>
          </div>
          <p ref={noteRef} className="mt-8 text-[11px] uppercase tracking-[0.2em] text-zinc-600">
            Scroll to continue
          </p>
        </div>
      </div>

      {showDebugUi ? <FilmDebugReadout /> : null}
    </div>
  );
}
