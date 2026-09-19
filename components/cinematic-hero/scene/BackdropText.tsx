import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { filmDriver } from '../filmDriver';
import { sampleTimeline, smoothstep } from '../timeline';

const COPY = 'SCROLL TO START YOUR JOURNEY';
const FONT_STACK = 'Manrope, Inter, system-ui, sans-serif';

/** Center of the laptop screen volume the text sits behind. */
const POSITION: [number, number, number] = [-3.6, 0.8, 0];
const TEXT_W = 4.6;
const TEXT_H = 1.15;
const GLOW_W = 5.4;
const GLOW_H = 1.35;

/**
 * Glow presence: subtle at rest, rising with the opening lid, then stable.
 * Driven by a smooth S-curve of lid openness — no flicker, no pulsing.
 */
const GLOW_BASE = 0.3;
const GLOW_GAIN = 0.3;

function fitFont(ctx: CanvasRenderingContext2D, maxWidth: number): string {
  let size = 150;
  ctx.letterSpacing = '18px';
  const weight = 600;
  while (size > 40) {
    ctx.font = `${weight} ${size}px ${FONT_STACK}`;
    if (ctx.measureText(COPY).width <= maxWidth) break;
    size -= 4;
  }
  return ctx.font;
}

function drawSharp(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = fitFont(ctx, w * 0.92);
  const gradient = ctx.createLinearGradient(0, h * 0.2, 0, h * 0.8);
  gradient.addColorStop(0, '#f2f4f8');
  gradient.addColorStop(1, '#c6ccd8');
  ctx.fillStyle = gradient;
  // Soft baked halo keeps the letterforms luminous without neon harshness.
  ctx.shadowColor = 'rgba(160, 180, 230, 0.5)';
  ctx.shadowBlur = 26;
  ctx.fillText(COPY, w / 2, h / 2);
  ctx.fillText(COPY, w / 2, h / 2);
}

function drawGlow(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = fitFont(ctx, w * 0.9);
  // Dim, ultra-soft wash: reads as atmosphere around the sharp copy,
  // never as a second legible layer.
  ctx.fillStyle = 'rgba(150, 175, 235, 0.32)';
  ctx.shadowColor = 'rgba(150, 175, 235, 0.55)';
  ctx.shadowBlur = 110;
  ctx.fillText(COPY, w / 2, h / 2);
  ctx.fillText(COPY, w / 2, h / 2);
}

/**
 * Backdrop copy physically placed behind the laptop.
 *
 * Two unlit planes (sharp text + additive glow) sit beyond the laptop along
 * the camera path. Normal depth testing lets the opening screen occlude the
 * text for real — the copy is never faded, moved, or removed. Only the glow
 * plane's opacity breathes with lid openness, and it is the only thing that
 * ever changes here.
 */
export default function BackdropText(): JSX.Element {
  const invalidate = useThree((s) => s.invalidate);

  const layers = useMemo(() => {
    const sharpCanvas = document.createElement('canvas');
    sharpCanvas.width = 2048;
    sharpCanvas.height = 512;
    drawSharp(sharpCanvas);
    const sharpTexture = new THREE.CanvasTexture(sharpCanvas);
    sharpTexture.colorSpace = THREE.SRGBColorSpace;
    sharpTexture.anisotropy = 4;

    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 1024;
    glowCanvas.height = 256;
    drawGlow(glowCanvas);
    const glowTexture = new THREE.CanvasTexture(glowCanvas);
    glowTexture.colorSpace = THREE.SRGBColorSpace;

    const sharpMaterial = new THREE.MeshBasicMaterial({
      map: sharpTexture,
      transparent: true,
      depthWrite: false,
      fog: false,
    });
    const glowMaterial = new THREE.MeshBasicMaterial({
      map: glowTexture,
      transparent: true,
      opacity: GLOW_BASE,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    const sharpGeometry = new THREE.PlaneGeometry(TEXT_W, TEXT_H);
    const glowGeometry = new THREE.PlaneGeometry(GLOW_W, GLOW_H);
    return { sharpCanvas, sharpTexture, glowCanvas, glowTexture, sharpMaterial, glowMaterial, sharpGeometry, glowGeometry };
  }, []);

  // Redraw once webfonts arrive so the canvas uses the real Manrope/Inter.
  useEffect(() => {
    let alive = true;
    document.fonts?.ready
      .then(() => {
        if (!alive) return;
        drawSharp(layers.sharpCanvas);
        drawGlow(layers.glowCanvas);
        layers.sharpTexture.needsUpdate = true;
        layers.glowTexture.needsUpdate = true;
        invalidate();
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [layers, invalidate]);

  useEffect(() => {
    return () => {
      layers.sharpGeometry.dispose();
      layers.glowGeometry.dispose();
      layers.sharpMaterial.dispose();
      layers.glowMaterial.dispose();
      layers.sharpTexture.dispose();
      layers.glowTexture.dispose();
    };
  }, [layers]);

  // Glow follows the opening lid inside the existing demand-rendered loop.
  useFrame(() => {
    const material = layers.glowMaterial;
    const lidOpen = sampleTimeline(filmDriver.currentT).lidOpen;
    const target = GLOW_BASE + GLOW_GAIN * smoothstep(0.1, 0.95, lidOpen);
    if (Math.abs(material.opacity - target) > 0.002) {
      material.opacity = target;
      invalidate();
    }
  });

  return (
    <group position={POSITION} rotation-y={Math.PI / 2}>
      <mesh
        geometry={layers.glowGeometry}
        material={layers.glowMaterial}
        position={[0, 0, -0.03]}
        renderOrder={1}
      />
      <mesh geometry={layers.sharpGeometry} material={layers.sharpMaterial} renderOrder={2} />
    </group>
  );
}
