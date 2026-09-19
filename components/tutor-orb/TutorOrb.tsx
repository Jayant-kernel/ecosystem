import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import OrbScene from './OrbScene';
import { ORB_TUNING as T } from './tuning';
import { ORB_STATE_LABEL } from './types';
import type { OrbState, TutorOrbProps } from './types';

/** Subscribe to a media query without pulling in a dependency. */
function useMediaFlag(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [query]);
  return matches;
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/** CSS-only orb: the non-WebGL and reduced-motion experience. */
function OrbFallback({ state, size }: { state: OrbState; size: number }): JSX.Element {
  const glow = T.glow[state];
  const animated = state === 'listening' || state === 'speaking' || state === 'thinking';
  return (
    <div
      className={`rounded-full ${animated ? 'animate-pulse' : ''}`}
      style={{
        width: size,
        height: size,
        background:
          `radial-gradient(circle at 32% 26%, rgba(255,255,255,0.96), ${glow.emissive}66 44%, rgba(9,11,20,0.92) 76%)`,
        boxShadow: `0 0 70px ${glow.halo}, inset 0 0 46px rgba(255,255,255,0.22)`,
        transition: 'background 600ms ease, box-shadow 600ms ease',
      }}
    />
  );
}

class OrbErrorBoundary extends React.Component<
  { fallback: React.ReactNode; onFail: () => void; children: React.ReactNode },
  { failed: boolean }
> {
  constructor(props: { fallback: React.ReactNode; onFail: () => void; children: React.ReactNode }) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(error: unknown): void {
    // eslint-disable-next-line no-console
    console.error('[tutor-orb] WebGL scene failed, falling back to the CSS orb.', error);
    this.props.onFail();
  }

  render(): React.ReactNode {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

/**
 * The AI tutor's face: a procedural liquid-glass orb that reacts to the live
 * microphone and to the tutor's own voice. It owns no session logic — it is a
 * pure visual for whatever `ConversationPanel` is already doing.
 */
const TutorOrb: React.FC<TutorOrbProps> = ({ state, onToggle, size = 200, label, className }) => {
  const reducedMotion = useMediaFlag('(prefers-reduced-motion: reduce)');
  const [supported] = useState(hasWebGL);
  const [onScreen, setOnScreen] = useState(true);
  const [failed, setFailed] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Stop all rendering work while the orb is scrolled out of view.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => setOnScreen(entries.some((entry) => entry.isIntersecting)),
      { rootMargin: '160px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const glow = T.glow[state];
  const accessibleLabel = label ?? ORB_STATE_LABEL[state];
  const showFallback = reducedMotion || !supported || failed;
  const fallback = <OrbFallback state={state} size={size} />;

  return (
    <div
      ref={wrapRef}
      className={`relative flex items-center justify-center ${className ?? ''}`}
      style={{ width: size, height: size }}
    >
      {/* Halo: a cheap CSS glow instead of a post-processing pass. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute rounded-full"
        style={{
          inset: '-18%',
          background: `radial-gradient(circle, ${glow.halo} 0%, transparent 68%)`,
          filter: 'blur(14px)',
          transition: 'background 700ms ease',
        }}
      />

      <button
        type="button"
        onClick={onToggle}
        aria-label={accessibleLabel}
        aria-pressed={state === 'listening' || state === 'speaking'}
        title={accessibleLabel}
        className="relative h-full w-full rounded-full outline-none transition-transform duration-300 hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-orange-400/70 active:scale-[0.99]"
      >
        {showFallback ? (
          fallback
        ) : (
          <OrbErrorBoundary fallback={fallback} onFail={() => setFailed(true)}>
            <Canvas
              frameloop={onScreen ? 'always' : 'never'}
              dpr={[1, T.maxDpr]}
              gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false }}
              camera={{ fov: 30, position: [0, 0, 3.4], near: 0.1, far: 20 }}
              // Clicks belong to the button; the canvas never needs the pointer.
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            >
              <OrbScene state={state} onError={() => setFailed(true)} />
            </Canvas>
          </OrbErrorBoundary>
        )}
      </button>
    </div>
  );
};

export default TutorOrb;
