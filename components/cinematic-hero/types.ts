export type Vector3Tuple = [number, number, number];

export interface CameraPose {
  position: Vector3Tuple;
  target: Vector3Tuple;
  fov: number;
}

export interface FilmState {
  /** Normalized film progress, always in [0, 1]. */
  t: number;
  /** Current camera distance along the approach path, in scene units. */
  cameraDistance: number;
  camera: CameraPose;
  /** Laptop lid position derived from camera distance. 0 = closed, 1 = fully open. */
  lidOpen: number;
  /** Display illumination derived from approach progress. 0 = dark, 1 = full. */
  screenGlow: number;
  /** How completely the display fills the sticky viewport near the end of the film. */
  displayFill: number;
  complete: boolean;
}

export interface TimelineConfig {
  /** Height of the scroll runway, in viewport heights. */
  runwayViewportHeights: number;
  /** Lid stays closed while cameraDistance is above this value. */
  lidStartDistance: number;
  /** Lid is fully open once cameraDistance reaches this value. */
  lidFullOpenDistance: number;
  /** Normalized time at which the display begins its final fill. */
  displayFillStartT: number;
  /** Handoff window: DOM panel fades in over [start, end]. */
  handoffStartT: number;
  handoffEndT: number;
}

export type FilmNotify = () => void;
