import React from 'react';
import { Canvas } from '@react-three/fiber';
import { INITIAL_CAMERA } from './timeline';
import Scene from './scene/Scene';
import type { VoiceScreenContent } from './scene/VoiceScreen';

class SceneErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { failed: boolean }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(error: unknown): void {
    // eslint-disable-next-line no-console
    console.error('[cinematic-hero] 3D scene failed, showing static fallback.', error);
  }

  render(): React.ReactNode {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

/**
 * The repository's only R3F boundary. Nothing outside cinematic-hero may
 * import three.js or @react-three/fiber.
 */
export default function CinematicCanvas({ screenContent }: { screenContent?: VoiceScreenContent }): JSX.Element {
  return (
    <SceneErrorBoundary
      fallback={
        <div className="absolute inset-0 flex items-center justify-center bg-black px-6 text-center">
          <p className="max-w-md text-sm text-zinc-400">
            The 3D intro could not start on this device. Scroll on to explore the course.
          </p>
        </div>
      }
    >
      <Canvas
        frameloop="demand"
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance', stencil: false }}
        camera={{
          fov: INITIAL_CAMERA.fov,
          near: 0.05,
          far: 60,
          position: [
            INITIAL_CAMERA.position[0],
            INITIAL_CAMERA.position[1],
            INITIAL_CAMERA.position[2],
          ],
        }}
        style={{ position: 'absolute', inset: 0 }}
        onCreated={({ invalidate }) => invalidate()}
      >
        <Scene screenContent={screenContent} />
      </Canvas>
    </SceneErrorBoundary>
  );
}
