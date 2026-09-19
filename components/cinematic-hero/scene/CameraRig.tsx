import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { filmDriver } from '../filmDriver';
import { CAMERA_DAMP_LAMBDA, RENDER_EPSILON, sampleTimeline } from '../timeline';

const desiredPosition = new THREE.Vector3();
const desiredTarget = new THREE.Vector3();

/**
 * Checkpoint 1 — laptop fully open.
 *
 * Derived from the film itself (first `t` with a fully open lid), so the
 * lid thresholds in timeline.ts stay the single source of truth.
 */
function findFullyOpenT(): number {
  for (let i = 0; i <= 2000; i++) {
    const t = i / 2000;
    if (sampleTimeline(t).lidOpen >= 1) return t;
  }
  return 1;
}
const FULLY_OPEN_T = findFullyOpenT();
/** Settle band that counts as "arrived" at the checkpoint. */
const CHECKPOINT_SETTLE_EPS = 0.002;
/** Scroll back below this gap re-arms the checkpoint for the next approach. */
const CHECKPOINT_REARM_GAP = 0.08;
/** How long the open laptop is held before the film may proceed. */
const CHECKPOINT_DWELL_MS = 1000;

interface CheckpointState {
  armed: boolean;
  dwelling: boolean;
  timer: ReturnType<typeof setTimeout> | null;
}

/**
 * Applies the deterministic film timeline to the physical camera.
 *
 * Fast or large scroll input can only move `targetT`; the visible camera
 * always approaches that target exponentially, so the film cannot jump.
 */
export default function CameraRig(): null {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const checkpoint = useRef<CheckpointState>({ armed: true, dwelling: false, timer: null });

  useEffect(() => {
    filmDriver.notify = () => invalidate();
    invalidate();
    return () => {
      if (filmDriver.notify) {
        filmDriver.notify = null;
      }
    };
  }, [invalidate]);

  useEffect(() => {
    const state = checkpoint.current;
    return () => {
      if (state.timer !== null) {
        clearTimeout(state.timer);
        state.timer = null;
      }
    };
  }, []);

  useFrame((_, rawDelta) => {
    const delta = Math.min(Math.max(rawDelta, 0), 0.05);
    const cp = checkpoint.current;
    const movingForward = filmDriver.targetT > filmDriver.currentT;

    // Scrolling back well below the checkpoint re-arms it for the next approach.
    if (filmDriver.currentT < FULLY_OPEN_T - CHECKPOINT_REARM_GAP) {
      cp.armed = true;
    }
    // Reversing hands control straight back: cancel any pending dwell.
    if (!movingForward && cp.dwelling) {
      if (cp.timer !== null) {
        clearTimeout(cp.timer);
        cp.timer = null;
      }
      cp.dwelling = false;
    }

    // Checkpoint 1: an aggressive fling toward the open state eases into the
    // fully-open pose and holds there instead of flying past it.
    let effectiveTarget = filmDriver.targetT;
    if (
      cp.armed &&
      movingForward &&
      filmDriver.targetT > FULLY_OPEN_T &&
      filmDriver.currentT < FULLY_OPEN_T
    ) {
      effectiveTarget = FULLY_OPEN_T;
    }

    filmDriver.currentT = THREE.MathUtils.damp(
      filmDriver.currentT,
      effectiveTarget,
      CAMERA_DAMP_LAMBDA,
      delta,
    );

    // Once settled into the checkpoint, dwell so the open laptop registers,
    // then release toward the true target. A one-shot timer (not a loop)
    // wakes the demand renderer when the hold ends.
    if (
      effectiveTarget === FULLY_OPEN_T &&
      !cp.dwelling &&
      Math.abs(filmDriver.currentT - FULLY_OPEN_T) <= CHECKPOINT_SETTLE_EPS
    ) {
      cp.dwelling = true;
      cp.timer = setTimeout(() => {
        cp.dwelling = false;
        cp.armed = false;
        cp.timer = null;
        filmDriver.notify?.();
      }, CHECKPOINT_DWELL_MS);
    }

    const film = sampleTimeline(filmDriver.currentT);
    desiredPosition.set(
      film.camera.position[0],
      film.camera.position[1],
      film.camera.position[2],
    );
    desiredTarget.set(film.camera.target[0], film.camera.target[1], film.camera.target[2]);

    camera.position.copy(desiredPosition);
    camera.lookAt(desiredTarget);
    if (camera instanceof THREE.PerspectiveCamera && Math.abs(camera.fov - film.camera.fov) > 0.001) {
      camera.fov = film.camera.fov;
      camera.updateProjectionMatrix();
    }

    // Settle against the effective target so a held checkpoint is exact and
    // the demand loop sleeps until scroll input or the dwell timer wakes it.
    if (Math.abs(effectiveTarget - filmDriver.currentT) > RENDER_EPSILON) {
      invalidate();
    } else {
      filmDriver.currentT = effectiveTarget;
    }
  });

  return null;
}
