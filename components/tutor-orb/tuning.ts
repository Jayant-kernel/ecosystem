import type { OrbState } from './types';

/**
 * Every tunable for the shader orb, in one place.
 *
 * `hue` rotates the shader's purple/cyan/blue palette in degrees.
 * `hoverIntensity` controls how much the surface wobbles when energised.
 * `rotateSpeed` is the spin rate (radians/sec) while energised.
 * `errorMix` washes the orb toward red/orange (0 = off, 1 = full).
 */
export const ORB_TUNING = {
  /** Visual size in px. 180–240 reads best. */
  size: 196,
  /** Device pixel ratio ceiling. Raise for crisper, lower for faster. */
  maxDpr: 1.5,
  /** Background colour the shader uses for its luminance maths. */
  backgroundColor: '#0D0D0D',

  states: {
    idle: { hue: 0, hoverIntensity: 0.1, rotateSpeed: 0.12, errorMix: 0 },
    listening: { hue: 30, hoverIntensity: 0.24, rotateSpeed: 0.22, errorMix: 0 },
    thinking: { hue: -40, hoverIntensity: 0.18, rotateSpeed: 0.55, errorMix: 0 },
    speaking: { hue: 85, hoverIntensity: 0.26, rotateSpeed: 0.3, errorMix: 0 },
    error: { hue: 0, hoverIntensity: 0.08, rotateSpeed: 0.05, errorMix: 1 },
  } as Record<OrbState, { hue: number; hoverIntensity: number; rotateSpeed: number; errorMix: number }>,

  /** CSS halo behind the canvas, per state. */
  halo: {
    idle: 'rgba(140,120,255,0.30)',
    listening: 'rgba(60,200,255,0.42)',
    thinking: 'rgba(180,90,255,0.42)',
    speaking: 'rgba(120,230,255,0.42)',
    error: 'rgba(255,80,45,0.48)',
  } as Record<OrbState, string>,
} as const;
