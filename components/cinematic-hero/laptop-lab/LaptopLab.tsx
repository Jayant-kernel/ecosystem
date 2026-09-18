import { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import glbUrl from '../../../laptop/gaming_laptop.glb?url';
import { buildLaptopRig, type LaptopRig } from './rig';

const PRESETS = [0, 25, 50, 75, 100];

function meshLabel(mesh: THREE.Mesh): string {
  return mesh.name || '(unnamed)';
}

function RiggedModel({
  openness,
  onRig,
  onError,
}: {
  openness: number;
  onRig: (rig: LaptopRig) => void;
  onError: (message: string) => void;
}): JSX.Element | null {
  const gltf = useLoader(GLTFLoader, glbUrl);
  const invalidate = useThree((state) => state.invalidate);
  const [rig, setRig] = useState<LaptopRig | null>(null);

  useEffect(() => {
    try {
      const built = buildLaptopRig(gltf.scene);
      built.setOpenness(openness);
      onRig(built);
      setRig(built);
    } catch (error) {
      onError(error instanceof Error ? error.message : String(error));
    }
    return () => {
      setRig(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gltf]);

  useEffect(() => {
    if (!rig) return;
    rig.setOpenness(openness);
    invalidate();
  }, [rig, openness, invalidate]);

  useEffect(
    () => () => {
      rig?.dispose();
    },
    [rig],
  );

  if (!rig) return null;
  return <primitive object={rig.root} />;
}

function FitCamera({ rig }: { rig: LaptopRig | null }): null {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    if (!rig) return;
    const box = new THREE.Box3().setFromObject(rig.root);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const radius = Math.max(size.x, size.y, size.z);
    const direction = new THREE.Vector3(1, 0.55, 1.35).normalize();
    camera.position.copy(center).addScaledVector(direction, radius * 2.1);
    camera.lookAt(center);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 40;
      camera.updateProjectionMatrix();
    }
    invalidate();
  }, [rig, camera, invalidate]);

  return null;
}

/**
 * Debug-only laptop rig lab. Mounted only when `?laptop-debug=1` is present.
 * Loads the actual GLB, applies the non-destructive LidPivot rig, and exposes
 * manual openness control plus the rig's measured hinge metadata.
 */
export default function LaptopLab(): JSX.Element | null {
  const [visible, setVisible] = useState(true);
  const [openness, setOpenness] = useState(1);
  const [rig, setRig] = useState<LaptopRig | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => {
    if (!rig) return null;
    const sum = (meshes: THREE.Mesh[]) => {
      let verts = 0;
      let tris = 0;
      for (const mesh of meshes) {
        const position = mesh.geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
        if (!position) continue;
        verts += position.count;
        const index = mesh.geometry.getIndex();
        tris += index ? index.count / 3 : position.count / 3;
      }
      return { verts, tris };
    };
    return {
      lid: sum(rig.lidMeshes),
      base: sum(rig.baseMeshes),
      angleDeg: (THREE.MathUtils.radToDeg(rig.openAngleRad) * openness).toFixed(1),
    };
  }, [rig, openness]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex bg-black text-white" data-laptop-lab="true">
      <div className="relative min-w-0 flex-1">
        <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500">Loading laptop GLB…</div>}>
          <Canvas frameloop="demand" dpr={[1, 1.75]} gl={{ antialias: true }} camera={{ fov: 40, position: [6, 4, 7] }}>
            <color attach="background" args={['#0a0a0a']} />
            <ambientLight intensity={0.9} />
            <directionalLight position={[4, 6, 3]} intensity={1.2} />
            <RiggedModel openness={openness} onRig={setRig} onError={setError} />
            <FitCamera rig={rig} />
          </Canvas>
        </Suspense>
        {error ? (
          <div className="absolute left-4 top-4 max-w-md rounded-lg border border-red-500/40 bg-red-950/80 px-4 py-3 text-xs text-red-200">
            Rig failed: {error}
          </div>
        ) : null}
      </div>

      <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-l border-white/10 bg-zinc-950 p-4 text-xs">
        <div className="flex items-center justify-between">
          <h2 className="font-manrope text-sm font-bold">Laptop rig lab</h2>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="rounded-md border border-white/10 px-2 py-1 text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            Close
          </button>
        </div>

        <label className="flex flex-col gap-2">
          <span className="font-bold uppercase tracking-wider text-zinc-400">
            Lid openness: {Math.round(openness * 100)}% ({stats?.angleDeg ?? '—'}°)
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(openness * 100)}
            onChange={(event) => setOpenness(Number(event.target.value) / 100)}
            className="w-full"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setOpenness(preset / 100)}
              className={`rounded-md border px-2 py-1 font-bold ${
                Math.round(openness * 100) === preset
                  ? 'border-orange-500 bg-orange-500/20 text-orange-300'
                  : 'border-white/10 text-zinc-400 hover:bg-white/10'
              }`}
            >
              {preset}%
            </button>
          ))}
        </div>

        {rig ? (
          <dl className="space-y-2 text-zinc-300">
            <div>
              <dt className="font-bold text-zinc-500">Hinge axis</dt>
              <dd className="font-mono">[{rig.hingeAxis.toArray().map((v) => v.toFixed(1)).join(', ')}]</dd>
            </div>
            <div>
              <dt className="font-bold text-zinc-500">Hinge pivot</dt>
              <dd className="font-mono">[{rig.hingePivot.toArray().map((v) => v.toFixed(3)).join(', ')}]</dd>
            </div>
            <div>
              <dt className="font-bold text-zinc-500">Open angle</dt>
              <dd className="font-mono">{THREE.MathUtils.radToDeg(rig.openAngleRad).toFixed(2)}°</dd>
            </div>
            <div>
              <dt className="font-bold text-zinc-500">Screen</dt>
              <dd>
                {rig.screenInfo
                  ? `${rig.screenInfo.name} — quad, UV [${rig.screenInfo.uvMin.map((v) => v.toFixed(2)).join(', ')}] → [${rig.screenInfo.uvMax.map((v) => v.toFixed(2)).join(', ')}]`
                  : 'not found'}
              </dd>
            </div>
            <div>
              <dt className="font-bold text-zinc-500">Closed clearance</dt>
              <dd className="font-mono">
                {rig.closure
                  ? `max penetration ${rig.closure.maxPenetration.toFixed(4)} over ${rig.closure.comparedCells} cells`
                  : 'unavailable'}
              </dd>
            </div>
            <div>
              <dt className="font-bold text-zinc-500">Geometry</dt>
              <dd className="font-mono">
                lid {stats?.lid.tris.toLocaleString()} tris / base {stats?.base.tris.toLocaleString()} tris
              </dd>
            </div>
            <details>
              <summary className="cursor-pointer font-bold text-zinc-500">Lid meshes ({rig.lidMeshes.length})</summary>
              <ul className="mt-1 list-disc pl-4 font-mono">{rig.lidMeshes.map((mesh) => <li key={mesh.uuid}>{meshLabel(mesh)}</li>)}</ul>
            </details>
            <details>
              <summary className="cursor-pointer font-bold text-zinc-500">Base meshes ({rig.baseMeshes.length})</summary>
              <ul className="mt-1 list-disc pl-4 font-mono">{rig.baseMeshes.map((mesh) => <li key={mesh.uuid}>{meshLabel(mesh)}</li>)}</ul>
            </details>
          </dl>
        ) : (
          <p className="text-zinc-500">Building rig…</p>
        )}
      </aside>
    </div>
  );
}
