import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createOrbMaterial } from './orbMaterial';
import { ORB_TUNING as T } from './tuning';
import type { OrbState } from './types';
import { audioLevels } from '../../utils/audioLevels';

/**
 * A studio environment baked from Three's RoomEnvironment. Physical materials
 * (transmission, iridescence, clearcoat) have nothing to reflect or refract
 * without one, which is what makes cheap glass look like a grey ball.
 */
function OrbEnvironment(): null {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, T.envResolution);
    scene.environment = env.texture;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
      (room as unknown as { dispose?: () => void }).dispose?.();
    };
  }, [gl, scene]);

  return null;
}

/**
 * Three.js logs shader compile failures to the console but keeps rendering
 * (usually a black object). This turns that silent failure into the CSS orb.
 */
function ShaderErrorGuard({ onError }: { onError?: () => void }): null {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    if (!onError) return;
    const previous = gl.debug.onShaderError;
    gl.debug.onShaderError = (...args: unknown[]) => {
      console.error('[tutor-orb] shader failed to compile; using the CSS orb.');
      (previous as ((...a: unknown[]) => void) | undefined)?.(...args);
      onError();
    };
    return () => {
      gl.debug.onShaderError = previous;
    };
  }, [gl, onError]);

  return null;
}

function OrbMesh({ state }: { state: OrbState }): JSX.Element {
  const meshRef = useRef<THREE.Mesh>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const geometry = useMemo(
    () => new THREE.IcosahedronGeometry(T.radius, T.geometryDetail),
    [],
  );
  const { material, uniforms } = useMemo(() => createOrbMaterial(), []);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  // Per-frame animation state lives in refs; nothing here touches React state.
  const smooth = useRef({ audio: 0, time: 0 });
  const emissiveTarget = useMemo(() => new THREE.Color(T.glow.idle.emissive), []);

  useFrame((_, rawDelta) => {
    const delta = Math.min(Math.max(rawDelta, 0), 0.05);
    const current = stateRef.current;
    const s = smooth.current;

    // Loudness for the active state, exponentially damped so the surface never
    // jitters on individual frames.
    const amplitude =
      current === 'listening' ? audioLevels.mic
        : current === 'speaking' ? audioLevels.speaker
          : 0;
    s.audio += (amplitude - s.audio) * Math.min(1, T.damping * delta);
    s.time += delta;

    uniforms.uTime.value = s.time;
    uniforms.uAudio.value = s.audio;
    uniforms.uSpeed.value = T.speed[current];
    // Idle keeps a slow breathing swell; active states stay at full displacement.
    uniforms.uNoiseStrength.value =
      current === 'idle' ? T.noiseStrength * (1 + T.breathDepth * Math.sin(s.time * T.breathRate)) : T.noiseStrength;

    if (meshRef.current) {
      meshRef.current.rotation.y += T.rotation[current] * delta;
    }

    // Iridescence drifts while the model is thinking so the surface shimmers.
    material.iridescenceIOR =
      current === 'thinking' ? T.iridescenceIOR + 0.12 * Math.sin(s.time * 0.8) : T.iridescenceIOR;

    emissiveTarget.set(T.glow[current].emissive);
    material.emissive.lerp(emissiveTarget, Math.min(1, delta * 4));
    const pulse = current === 'error' ? 0.55 + 0.45 * Math.sin(s.time * T.errorPulseRate) : 1;
    material.emissiveIntensity = (T.glowIntensity + s.audio * T.glowAudioGain) * pulse;
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} frustumCulled={false} />;
}

/**
 * Scene contents for the orb. Kept separate from TutorOrb so the Canvas,
 * fallbacks and visibility handling stay out of the render loop.
 */
export default function OrbScene({ state, onError }: { state: OrbState; onError?: () => void }): JSX.Element {
  return (
    <>
      <ShaderErrorGuard onError={onError} />
      <OrbEnvironment />
      <ambientLight intensity={0.35} />
      {/* Warm key, cool fill, and two coloured rims that read through the glass. */}
      <directionalLight position={[3.2, 4.2, 5]} intensity={1.5} color="#fff3e6" />
      <directionalLight position={[-4, -1.5, -3]} intensity={1.05} color="#8ab4ff" />
      <pointLight position={[0, -2.4, -2.4]} intensity={1.6} color="#ff9ad5" />
      <pointLight position={[0, 2.6, 2.4]} intensity={1.1} color="#9ff4ff" />
      <OrbMesh state={state} />
    </>
  );
}
