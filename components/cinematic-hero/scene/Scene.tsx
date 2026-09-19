import CameraRig from './CameraRig';
import RiggedLaptop from './RiggedLaptop';
import type { VoiceScreenContent } from './VoiceScreen';

/**
 * Cinematic scene shell: subtle studio/product lighting for the real laptop,
 * the film-driven camera rig, and the rigged laptop. No decorative loops,
 * no shadows, no post-processing — background stays dark.
 */
export default function Scene({ screenContent }: { screenContent?: VoiceScreenContent }): JSX.Element {
  return (
    <>
      <color attach="background" args={['#050505']} />
      {/* Environmental depth: floor edges dissolve into the background (negligible at film distances). */}
      <fogExp2 attach="fog" args={['#050505', 0.022]} />
      {/* Grounding: an unlit near-black floor just beneath the base. Unlit on
          purpose — studio lights are for the laptop only, so the floor keeps
          an exact value and dissolves into the background via fog. */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.135, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshBasicMaterial color="#0a0a0e" />
      </mesh>
      {/* Soft ambient base so dark PBR surfaces never crush to pure black. */}
      <hemisphereLight args={['#9aa3b5', '#0a0a0c', 0.9]} />
      {/* Key: warm-white, front-top-right — reads the top deck, keys, lid face. */}
      <directionalLight position={[5, 7, 4]} intensity={2.2} color="#fff4e8" />
      {/* Fill: cool, front-left, low — lifts shadow-side detail without flattening. */}
      <directionalLight position={[-6, 2.5, 4]} intensity={0.55} color="#b9c6ff" />
      {/* Rim: cool back-left — separates the black lid silhouette from the black background. */}
      <directionalLight position={[-4, 4, -5]} intensity={1.4} color="#cfe0ff" />
      <CameraRig />
      <RiggedLaptop content={screenContent} />
    </>
  );
}
