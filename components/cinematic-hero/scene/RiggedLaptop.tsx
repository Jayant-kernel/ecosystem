import { Suspense, useEffect, useRef, useState } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { buildLaptopRig, type LaptopRig } from '../laptop-lab/rig';
import { filmDriver } from '../filmDriver';
import { sampleTimeline } from '../timeline';
import { createVoiceScreenTexture, type VoiceScreenContent } from './VoiceScreen';

/**
 * Runtime URL for the laptop model. Served from `public/laptop/` when present.
 * The GLB is a local binary asset and is not committed to git, so the scene
 * must tolerate it being absent (renders nothing, like the Laptop placeholder).
 */
export const LAPTOP_GLB_URL = '/laptop/gaming_laptop.glb';

interface LiveRig {
  rig: LaptopRig;
  screenMaterial: THREE.MeshBasicMaterial | null;
  screenTexture: THREE.CanvasTexture | null;
  previousMaterial: THREE.Material | THREE.Material[] | null;
}

/**
 * The production laptop: actual GLB + the shared LidPivot rig, driven by the
 * same scroll timeline as the camera. Openness and screen glow are pure
 * functions of film time, so reverse scrolling reverses them exactly.
 *
 * Renders nothing until the GLB exists at `public/laptop/gaming_laptop.glb` —
 * the binary is not committed, so a missing model degrades to the same empty
 * scene as the Laptop placeholder instead of crashing the page.
 */
export default function RiggedLaptop({ content }: { content?: VoiceScreenContent }): JSX.Element | null {
  const [modelAvailable, setModelAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(LAPTOP_GLB_URL, { method: 'HEAD' })
      .then((res) => {
        if (!cancelled) setModelAvailable(res.ok);
      })
      .catch(() => {
        if (!cancelled) setModelAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!modelAvailable) return null;
  return (
    <Suspense fallback={null}>
      <RiggedLaptopModel content={content} />
    </Suspense>
  );
}

function RiggedLaptopModel({ content }: { content?: VoiceScreenContent }): JSX.Element | null {
  const gltf = useLoader(GLTFLoader, LAPTOP_GLB_URL);
  const invalidate = useThree((state) => state.invalidate);
  const contentRef = useRef(content);
  contentRef.current = content;
  const liveRef = useRef<LiveRig | null>(null);

  useEffect(() => {
    const rig = buildLaptopRig(gltf.scene);
    let screenMaterial: THREE.MeshBasicMaterial | null = null;
    let screenTexture: THREE.CanvasTexture | null = null;
    let previousMaterial: THREE.Material | THREE.Material[] | null = null;

    if (rig.screenMesh) {
      previousMaterial = rig.screenMesh.material;
      screenTexture = createVoiceScreenTexture(contentRef.current);
      screenMaterial = new THREE.MeshBasicMaterial({ map: screenTexture });
      rig.screenMesh.material = screenMaterial;
    }

    liveRef.current = { rig, screenMaterial, screenTexture, previousMaterial };
    invalidate();

    return () => {
      const live = liveRef.current;
      liveRef.current = null;
      if (!live) return;
      if (live.rig.screenMesh && live.previousMaterial) {
        live.rig.screenMesh.material = live.previousMaterial;
      }
      live.screenMaterial?.dispose();
      live.screenTexture?.dispose();
      live.rig.dispose();
    };
  }, [gltf, invalidate]);

  useFrame(() => {
    const live = liveRef.current;
    if (!live) return;
    const film = sampleTimeline(filmDriver.currentT);
    live.rig.setOpenness(film.lidOpen);
    if (live.screenMaterial) {
      live.screenMaterial.color.setScalar(0.35 + 0.65 * film.screenGlow);
    }
  });

  return <primitive object={gltf.scene} />;
}
