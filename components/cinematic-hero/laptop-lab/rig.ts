import * as THREE from 'three';

export interface ClosureReport {
  /** Largest base-top minus closed-lid-bottom overlap, in model units. */
  maxPenetration: number;
  comparedCells: number;
  closedMinY: number;
  closedMaxX: number;
  baseFrontX: number;
}

export interface LaptopRig {
  root: THREE.Group;
  base: THREE.Group;
  lidPivot: THREE.Group;
  hingeAxis: THREE.Vector3;
  hingePivot: THREE.Vector3;
  /** Radians from base plane to the lid in the authored (fully open) pose. */
  openAngleRad: number;
  lidMeshes: THREE.Mesh[];
  baseMeshes: THREE.Mesh[];
  screenMesh: THREE.Mesh | null;
  screenInfo: { name: string; triangles: number; uvMin: [number, number]; uvMax: [number, number] } | null;
  closure: ClosureReport | null;
  setOpenness: (openness01: number) => void;
  getAngleDeg: () => number;
  dispose: () => void;
}

function meshesUnder(root: THREE.Object3D): THREE.Mesh[] {
  const out: THREE.Mesh[] = [];
  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) out.push(child as THREE.Mesh);
  });
  return out;
}

function boxOf(object: THREE.Object3D): THREE.Box3 {
  return new THREE.Box3().setFromObject(object);
}

interface Candidate {
  node: THREE.Object3D;
  meshes: THREE.Mesh[];
  box: THREE.Box3;
}

/**
 * Build the non-destructive runtime hierarchy:
 *
 *   LaptopRoot -> Base (original base meshes) + LidPivot (original lid meshes)
 *
 * LidPivot is placed at the physical hinge with identity rotation; the
 * original lid group is reparented under it via `attach`, preserving its exact
 * world transform. The GLB file on disk is never touched and no animation is
 * baked — openness is a runtime rotation only.
 */
export function buildLaptopRig(source: THREE.Object3D): LaptopRig {
  source.updateMatrixWorld(true);

  // Candidate assembly groups: no geometry of their own, 2–30 mesh descendants.
  const candidates: Candidate[] = [];
  source.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) return;
    const meshes = meshesUnder(child);
    if (meshes.length >= 2 && meshes.length <= 30) {
      candidates.push({ node: child, meshes, box: boxOf(child) });
    }
  });
  // Keep only the two innermost assembly groups (drop ancestors containing everything).
  candidates.sort(
    (a, b) => a.meshes.length - b.meshes.length || b.box.getSize(new THREE.Vector3()).y - a.box.getSize(new THREE.Vector3()).y,
  );
  const assemblies = candidates.filter((candidate) => candidate.meshes.length <= 10).slice(0, 2);
  if (assemblies.length !== 2) {
    throw new Error(
      `Expected two laptop assembly groups, found ${assemblies.length}. ` +
        `Candidates: ${candidates.map((candidate) => `${candidate.node.name || '(unnamed)'}[${candidate.meshes.length}]`).join(', ')}`,
    );
  }

  const sizeOf = (candidate: Candidate) => candidate.box.getSize(new THREE.Vector3());
  const [first, second] = assemblies;
  // The lid is tall and thin; the base is flat and wide.
  const lid = sizeOf(first).y >= sizeOf(second).y ? first : second;
  const base = lid === first ? second : first;

  if (lid.meshes.length !== 8 || base.meshes.length !== 7) {
    throw new Error(
      `Assembly mesh counts do not match this laptop (lid=${lid.meshes.length}, base=${base.meshes.length}). ` +
        `Lid group: ${lid.node.name || '(unnamed)'}, base group: ${base.node.name || '(unnamed)'}.`,
    );
  }

  const baseBox = boxOf(base.node);
  const hingePivot = new THREE.Vector3();
  lid.node.getWorldPosition(hingePivot);
  const hingeAxis = new THREE.Vector3(0, 0, 1);

  // Sanity: the authored lid-group origin must sit on the hinge line.
  if (Math.abs(hingePivot.x - baseBox.min.x) > 0.08 || hingePivot.y < baseBox.min.y - 0.05 || hingePivot.y > baseBox.max.y + 0.2) {
    throw new Error(
      `Lid group origin ${hingePivot.toArray().map((v) => v.toFixed(3)).join(', ')} ` +
        `is not on the hinge line (base back edge x=${baseBox.min.x.toFixed(3)}, base y=[${baseBox.min.y.toFixed(3)}, ${baseBox.max.y.toFixed(3)}]).`,
    );
  }

  // Current open angle: world direction of the lid's length axis (local -X).
  const lidQuat = new THREE.Quaternion();
  lid.node.getWorldQuaternion(lidQuat);
  const lidDir = new THREE.Vector3(-1, 0, 0).applyQuaternion(lidQuat);
  const openAngleRad = Math.atan2(lidDir.y, lidDir.x);

  const root = new THREE.Group();
  root.name = 'LaptopRoot';
  const baseGroup = new THREE.Group();
  baseGroup.name = 'Base';
  const lidPivot = new THREE.Group();
  lidPivot.name = 'LidPivot';
  lidPivot.position.copy(hingePivot);

  const lidOriginalParent = lid.node.parent ?? source;
  const baseOriginalParent = base.node.parent ?? source;
  const parent = lidOriginalParent;
  parent.add(root);
  root.add(baseGroup);
  root.add(lidPivot);
  baseGroup.attach(base.node);
  lidPivot.attach(lid.node);
  source.updateMatrixWorld(true);

  const lidMeshes = meshesUnder(lidPivot);
  const baseMeshes = meshesUnder(baseGroup);

  // Screen: the single-quad lid mesh carrying an image texture.
  let screenMesh: LaptopRig['screenMesh'] = null;
  let screenInfo: LaptopRig['screenInfo'] = null;
  for (const mesh of lidMeshes) {
    const position = mesh.geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const textured = mats.some((mat) => (mat as THREE.MeshStandardMaterial).map != null);
    if (position && position.count === 4 && textured) {
      const index = mesh.geometry.getIndex();
      const triangles = index ? index.count / 3 : position.count / 3;
      const uv = mesh.geometry.getAttribute('uv') as THREE.BufferAttribute | undefined;
      let uvMin: [number, number] = [0, 0];
      let uvMax: [number, number] = [0, 0];
      if (uv) {
        uvMin = [Infinity, Infinity];
        uvMax = [-Infinity, -Infinity];
        for (let i = 0; i < uv.count; i++) {
          uvMin = [Math.min(uvMin[0], uv.getX(i)), Math.min(uvMin[1], uv.getY(i))];
          uvMax = [Math.max(uvMax[0], uv.getX(i)), Math.max(uvMax[1], uv.getY(i))];
        }
      }
      screenMesh = mesh;
      screenInfo = { name: mesh.name || '(unnamed)', triangles, uvMin, uvMax };
      break;
    }
  }

  const setOpenness = (openness01: number) => {
    const clamped = Math.min(1, Math.max(0, openness01));
    lidPivot.rotation.set(0, 0, -(1 - clamped) * openAngleRad);
    lidPivot.updateMatrixWorld(true);
  };

  const rig: LaptopRig = {
    root,
    base: baseGroup,
    lidPivot,
    hingeAxis: hingeAxis.clone(),
    hingePivot: hingePivot.clone(),
    openAngleRad,
    lidMeshes,
    baseMeshes,
    screenMesh,
    screenInfo,
    closure: computeClosure(baseMeshes, lidMeshes, hingePivot, openAngleRad),
    setOpenness,
    getAngleDeg: () => THREE.MathUtils.radToDeg(openAngleRad) * opennessOf(),
    dispose: () => {
      // Restore the authored pose and parenting exactly, so a cached GLTF
      // scene can be rigged again (StrictMode remounts, route revisits).
      setOpenness(1);
      source.updateMatrixWorld(true);
      lidOriginalParent.attach(lid.node);
      baseOriginalParent.attach(base.node);
      root.removeFromParent();
      root.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry.dispose();
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const mat of mats) {
          const std = mat as THREE.MeshStandardMaterial;
          if (std.map) std.map.dispose();
          mat.dispose();
        }
      });
    },
  };

  function opennessOf(): number {
    if (openAngleRad === 0) return 1;
    return 1 + lidPivot.rotation.z / openAngleRad;
  }

  setOpenness(1);
  return rig;
}

/** One-time closed-pose clearance check on real vertices (no rendering needed). */
function computeClosure(
  baseMeshes: THREE.Mesh[],
  lidMeshes: THREE.Mesh[],
  hingePivot: THREE.Vector3,
  openAngleRad: number,
): ClosureReport | null {
  try {
    const baseTop = new Map<string, number>();
    const step = 0.05;
    const zStep = 0.1;
    let baseMinX = Infinity;
    let baseMaxX = -Infinity;
    const v = new THREE.Vector3();
    for (const mesh of baseMeshes) {
      const position = mesh.geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
      if (!position) continue;
      for (let i = 0; i < position.count; i++) {
        v.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
        baseMinX = Math.min(baseMinX, v.x);
        baseMaxX = Math.max(baseMaxX, v.x);
        const key = `${Math.floor(v.x / step)},${Math.floor(v.z / zStep)}`;
        const prev = baseTop.get(key);
        if (prev === undefined || v.y > prev) baseTop.set(key, v.y);
      }
    }

    const cos = Math.cos(-openAngleRad);
    const sin = Math.sin(-openAngleRad);
    let closedMinY = Infinity;
    let closedMaxX = -Infinity;
    const lidBottom = new Map<string, number>();
    for (const mesh of lidMeshes) {
      const position = mesh.geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
      if (!position) continue;
      for (let i = 0; i < position.count; i++) {
        v.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
        const dx = v.x - hingePivot.x;
        const dy = v.y - hingePivot.y;
        const cx = hingePivot.x + dx * cos - dy * sin;
        const cy = hingePivot.y + dx * sin + dy * cos;
        closedMinY = Math.min(closedMinY, cy);
        closedMaxX = Math.max(closedMaxX, cx);
        const key = `${Math.floor(cx / step)},${Math.floor(v.z / zStep)}`;
        const prev = lidBottom.get(key);
        if (prev === undefined || cy < prev) lidBottom.set(key, cy);
      }
    }

    let maxPenetration = -Infinity;
    for (const [key, top] of baseTop) {
      const bottom = lidBottom.get(key);
      if (bottom !== undefined) maxPenetration = Math.max(maxPenetration, top - bottom);
    }
    return {
      maxPenetration: maxPenetration === -Infinity ? 0 : maxPenetration,
      comparedCells: [...baseTop.keys()].filter((key) => lidBottom.has(key)).length,
      closedMinY,
      closedMaxX,
      baseFrontX: baseMaxX,
    };
  } catch {
    return null;
  }
}
