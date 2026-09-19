import type { OrbState } from './types';

/**
 * Everything worth tuning about the orb, in one place.
 *
 * Ranges are noted so these can be adjusted without reading the shader.
 */
export const ORB_TUNING = {
  // ---- Shape -------------------------------------------------------------
  /** Icosahedron subdivision. 5 (~10k verts) is light, 6 (~41k) is smoother. */
  geometryDetail: 6,
  radius: 1,
  /** Spatial frequency of the noise. Higher = more, smaller blobs. 0.8–2.5. */
  noiseScale: 1.35,
  /** Base surface displacement. 0 = perfect sphere. 0.05–0.25. */
  noiseStrength: 0.15,
  /** How much loudness adds to the displacement. 0.2–0.7. */
  audioStrength: 0.4,
  /** Speed of the internal liquid motion, per state. */
  speed: { idle: 0.07, listening: 0.16, thinking: 0.3, speaking: 0.22, error: 0.05 } as Record<OrbState, number>,
  /** Slow breathing multiplier applied to displacement on idle. 0 = none. */
  breathDepth: 0.22,
  breathRate: 0.55,

  // ---- Motion ------------------------------------------------------------
  /** Constant Y rotation, radians/sec, per state. */
  rotation: { idle: 0.06, listening: 0.09, thinking: 0.28, speaking: 0.14, error: 0.03 } as Record<OrbState, number>,
  /** Amplitude smoothing rate. Higher = snappier, lower = smoother. 2–8. */
  damping: 3.4,

  // ---- Audio -------------------------------------------------------------
  // Audio sensitivity (how loud counts as "full scale") lives next to the
  // pipeline that fills the levels: see MIC_REFERENCE / SPEAKER_REFERENCE in
  // ../../utils/audioLevels.ts.

  // ---- Material ----------------------------------------------------------
  /** Base glass tint (near-white keeps the iridescence readable). */
  color: '#f4f7ff',
  transmission: 1,
  roughness: 0.08,
  metalness: 0,
  ior: 1.35,
  thickness: 1.2,
  clearcoat: 1,
  clearcoatRoughness: 0.08,
  iridescence: 1,
  iridescenceIOR: 1.3,
  /** Soap-film thickness in nanometres: [min, max]. Widen for more colour. */
  iridescenceThicknessRange: [100, 700] as [number, number],
  /** Chromatic dispersion. Requires WebGL2; silently ignored otherwise. 0–0.4. */
  dispersion: 0.18,

  // ---- Glow --------------------------------------------------------------
  /** Emissive glow colour per state, plus the matching CSS halo behind it. */
  glow: {
    idle: { emissive: '#8ea2ff', halo: 'rgba(120,145,255,0.34)' },
    listening: { emissive: '#3fe3ff', halo: 'rgba(60,220,255,0.46)' },
    thinking: { emissive: '#b072ff', halo: 'rgba(170,95,255,0.46)' },
    speaking: { emissive: '#ffd7a3', halo: 'rgba(255,195,125,0.46)' },
    error: { emissive: '#ff5a3c', halo: 'rgba(255,75,45,0.5)' },
  } as Record<OrbState, { emissive: string; halo: string }>,
  /** Peak emissive intensity. 0.4–1.2. */
  glowIntensity: 0.75,
  /** Extra emissive added by loudness. 0–0.8. */
  glowAudioGain: 0.45,
  /** Error pulse rate (radians/sec). */
  errorPulseRate: 3.2,

  // ---- Rendering ---------------------------------------------------------
  /** Device pixel ratio ceiling. Raise for crisper, lower for faster. */
  maxDpr: 1.6,
  /** Samples used by the transmission/refraction pass. */
  envResolution: 0.04,
} as const;
