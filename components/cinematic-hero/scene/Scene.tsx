import CameraRig from './CameraRig';
import RiggedLaptop from './RiggedLaptop';
import type { VoiceScreenContent } from './VoiceScreen';

/**
 * Cinematic scene shell: neutral presentation lighting for the real laptop,
 * the film-driven camera rig, and the rigged laptop. No decorative loops.
 */
export default function Scene({ screenContent }: { screenContent?: VoiceScreenContent }): JSX.Element {
  return (
    <>
      <color attach="background" args={['#050505']} />
      <hemisphereLight args={['#8a8f9e', '#0a0a0c', 0.85]} />
      <directionalLight position={[4, 6, 3]} intensity={1.6} />
      <directionalLight position={[-3, 2, -4]} intensity={0.25} color="#f97316" />
      <CameraRig />
      <RiggedLaptop content={screenContent} />
    </>
  );
}
