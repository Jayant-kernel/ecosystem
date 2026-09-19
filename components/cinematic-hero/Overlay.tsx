import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { filmDriver } from './filmDriver';
import { sampleHandoff, sampleTimeline, smoothstep } from './timeline';

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

/**
 * DOM overlay for the film. Opacities are pure functions of film time, so the
 * handoff reverses exactly with scroll. A dedicated lightweight loop updates
 * only these styles and runs solely while the runway is visible.
 */
export default function Overlay({ navigateTo, canvasWrapRef }: OverlayProps): JSX.Element {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const hintRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === 'undefined') return;
    const runway = root.closest('[data-cinematic-hero="runway"]');
    let raf = 0;
    let running = false;
    let lastSignature = '';

    const tick = () => {
      const film = sampleTimeline(filmDriver.currentT);
      const handoff = sampleHandoff(film.t);
      const signature = `${film.t.toFixed(4)}|${filmDriver.targetT.toFixed(4)}`;
      if (signature !== lastSignature) {
        lastSignature = signature;
        const hint = hintRef.current;
        if (hint) {
          const opacity = 1 - smoothstep(0, 0.08, film.t);
          hint.style.opacity = opacity.toFixed(3);
          hint.style.visibility = opacity <= 0.01 ? 'hidden' : 'visible';
        }
        const panel = panelRef.current;
        if (panel) {
          panel.style.opacity = handoff.panelOpacity.toFixed(3);
          panel.style.visibility = handoff.panelOpacity <= 0.01 ? 'hidden' : 'visible';
          panel.style.pointerEvents = handoff.panelOpacity > 0.5 ? 'auto' : 'none';
        }
        const canvasWrap = canvasWrapRef.current;
        if (canvasWrap) {
          canvasWrap.style.opacity = handoff.canvasOpacity.toFixed(3);
          canvasWrap.style.visibility = handoff.canvasOpacity <= 0.01 ? 'hidden' : 'visible';
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
  }, []);

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

      <div
        ref={panelRef}
        className="absolute inset-0 flex items-center justify-center bg-[#0D0D0D] px-6 text-center"
        style={{ opacity: 0, visibility: 'hidden' }}
      >
        <div className="max-w-3xl">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-orange-500">
            Ecosystem · AI coding tutor
          </p>
          <h1 className="mb-6 font-manrope text-5xl font-medium tracking-tighter text-white md:text-7xl">
            Master code with your voice.
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-lg text-zinc-400">
            The conversational coding companion. From explaining complex concepts to
            real-time debugging, learn faster by talking to your code.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              type="button"
              onClick={() => navigateTo('signup')}
              className="rounded-full bg-white px-8 py-4 text-sm font-bold uppercase tracking-widest text-black transition-colors hover:bg-orange-500 hover:text-white"
            >
              Start Learning Free
            </button>
            <button
              type="button"
              onClick={() => navigateTo('courses')}
              className="rounded-full border border-white/15 px-8 py-4 text-sm font-bold uppercase tracking-widest text-zinc-300 transition-colors hover:border-white/40 hover:text-white"
            >
              Browse courses
            </button>
          </div>
          <p className="mt-10 text-xs uppercase tracking-[0.2em] text-zinc-600">
            Scroll to continue
          </p>
        </div>
      </div>

      {showDebugUi ? <FilmDebugReadout /> : null}
    </div>
  );
}
