import React, { useCallback, useEffect, useRef, useState } from 'react';
import OrbCanvas from './OrbCanvas';
import { ORB_TUNING as T } from './tuning';
import { ORB_STATE_LABEL } from './types';
import type { OrbState, TutorOrbProps } from './types';
import { audioLevels } from '../../utils/audioLevels';

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
  const halo = T.halo[state];
  const animated = state === 'listening' || state === 'speaking' || state === 'thinking';
  return (
    <div
      className={`rounded-full ${animated ? 'animate-pulse' : ''}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 32% 26%, rgba(255,255,255,0.9), ${halo} 46%, rgba(9,11,20,0.92) 76%)`,
        boxShadow: `0 0 70px ${halo}, inset 0 0 46px rgba(255,255,255,0.22)`,
      }}
    />
  );
}

/**
 * The AI tutor's face: a liquid-glass orb drawn by a single fragment shader.
 *
 * It owns no session logic. `ConversationPanel` derives the state from the
 * existing flags, and clicking the orb simply toggles the session through the
 * same handler the old microphone button used.
 */
const TutorOrb: React.FC<TutorOrbProps> = ({ state, onToggle, size = T.size, label, className }) => {
  const reducedMotion = useMediaFlag('(prefers-reduced-motion: reduce)');
  const [supported] = useState(hasWebGL);
  const [onScreen, setOnScreen] = useState(true);
  const [failed, setFailed] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Read the current state inside the frame loop without re-running the effect.
  const stateRef = useRef(state);
  stateRef.current = state;

  const getLevel = useCallback(() => {
    const current = stateRef.current;
    if (current === 'listening') return audioLevels.mic;
    if (current === 'speaking') return audioLevels.speaker;
    return 0;
  }, []);

  // Stable identity: OrbCanvas re-creates its WebGL context if this changes.
  const handleCanvasError = useCallback(() => setFailed(true), []);

  // Stop all GPU work while the orb is scrolled out of view.
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

  const preset = T.states[state];
  const accessibleLabel = label ?? ORB_STATE_LABEL[state];
  const showFallback = reducedMotion || !supported || failed;
  const fallback = <OrbFallback state={state} size={size} />;

  return (
    <div
      ref={wrapRef}
      className={`relative flex items-center justify-center ${className ?? ''}`}
      style={{ width: size, height: size }}
    >
      {/* Halo: a cheap CSS glow rather than a shader bloom pass. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute rounded-full"
        style={{
          inset: '-18%',
          background: `radial-gradient(circle, ${T.halo[state]} 0%, transparent 68%)`,
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
          <OrbCanvas
            hue={preset.hue}
            hoverIntensity={preset.hoverIntensity}
            rotateSpeed={preset.rotateSpeed}
            errorMix={preset.errorMix}
            forceHoverState={state === 'listening' || state === 'speaking'}
            backgroundColor={T.backgroundColor}
            getLevel={getLevel}
            paused={!onScreen}
            onError={handleCanvasError}
          />
        )}
      </button>
    </div>
  );
};

export default TutorOrb;
