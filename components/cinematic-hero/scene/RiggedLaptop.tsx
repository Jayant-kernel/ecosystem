import { useEffect, useRef } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import glbUrl from '../../../laptop/gaming_laptop.glb?url';
import { buildLaptopRig, type LaptopRig } from '../laptop-lab/rig';
import { filmDriver } from '../filmDriver';
import { sampleTimeline } from '../timeline';
import { createVoiceScreenTexture, type VoiceScreenContent } from './VoiceScreen';

interface LiveRig {
  rig: LaptopRig;
  screenMaterial: THREE.MeshBasicMaterial | null;
  screenTexture: THREE.CanvasTexture | null;
  previousMaterial: THREE.Material | THREE.Material[] | null;
  restrained: Array<{ mesh: THREE.Mesh; original: THREE.Material | THREE.Material[] }>;
  dimmed: THREE.Material[];
}

/**
 * Keyboard/deck materials that read blown out under studio lighting:
 * - `Material.007`: full-white emissive LED elements.
 * - `Material.009` / `Material.010`: colorful albedo textures on the deck.
 */
const EMISSIVE_LED_MATERIAL = 'Material.007';
const DECK_TEXTURE_MATERIALS = new Set(['Material.009', 'Material.010']);

/**
 * The production laptop: actual GLB + the shared LidPivot rig, driven by the
 * same scroll timeline as the camera. Openness and screen glow are pure
 * functions of film time, so reverse scrolling reverses them exactly.
 */
export default function RiggedLaptop({ content }: { content?: VoiceScreenContent }): JSX.Element | null {
  const gltf = useLoader(GLTFLoader, glbUrl);
  const invalidate = useThree((state) => state.invalidate);
  const gl = useThree((state) => state.gl);
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
      // Real renderer cap (bounded at 8) for crisp text at glancing angles.
      screenTexture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
      screenTexture.needsUpdate = true;
      screenMaterial = new THREE.MeshBasicMaterial({ map: screenTexture });
      rig.screenMesh.material = screenMaterial;
    }

    // Restrained keyboard/deck illumination, applied by clone-and-replace so
    // the shared GLTF cache (and the debug rig lab) is never mutated.
    const restrained: LiveRig['restrained'] = [];
    const dimmed: THREE.Material[] = [];
    const dimmedByName = new Map<string, THREE.Material>();
    gltf.scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh || mesh === rig.screenMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      let replaced = false;
      const next = mats.map((mat) => {
        if (!mat || mat.name === '') return mat;
        const dimmable =
          mat.name === EMISSIVE_LED_MATERIAL || DECK_TEXTURE_MATERIALS.has(mat.name);
        if (!dimmable) return mat;
        let clone = dimmedByName.get(mat.name);
        if (!clone) {
          clone = mat.clone();
          const std = clone as THREE.MeshStandardMaterial;
          if (mat.name === EMISSIVE_LED_MATERIAL) {
            std.emissiveIntensity = 0.3;
          } else if (mat.name === 'Material.009') {
            // RGB keyboard albedo: bright colorful key legends lit by the
            // studio key/rim. envMapIntensity alone cannot dim diffuse albedo,
            // so multiply the map down while keeping the legends readable.
            std.color.setScalar(0.25);
            std.envMapIntensity = 0.35;
          } else {
            std.envMapIntensity = 0.35;
          }
          dimmedByName.set(mat.name, clone);
          dimmed.push(clone);
        }
        replaced = true;
        return clone;
      });
      if (replaced) {
        restrained.push({ mesh, original: mesh.material });
        mesh.material = Array.isArray(mesh.material) ? next : next[0];
      }
    });

    liveRef.current = { rig, screenMaterial, screenTexture, previousMaterial, restrained, dimmed };
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
      for (const entry of live.restrained) {
        entry.mesh.material = entry.original;
      }
      for (const clone of live.dimmed) {
        clone.dispose();
      }
      live.rig.dispose();
    };
  }, [gltf, gl, invalidate]);

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
