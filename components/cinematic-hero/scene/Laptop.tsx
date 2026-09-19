export interface LaptopRigProps {
  /** 0 = closed, 1 = fully open. Derived from camera distance in timeline.ts. */
  lidOpen: number;
  /** 0 = dark display, 1 = fully illuminated display. */
  screenGlow: number;
}

/**
 * Typed placeholder for the future laptop asset.
 *
 * This intentionally renders nothing. The real GLB will be supplied separately
 * and consumed through this same `{ lidOpen, screenGlow }` interface.
 */
export function Laptop(_props: LaptopRigProps): null {
  return null;
}

export default Laptop;
