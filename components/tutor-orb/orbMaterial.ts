import * as THREE from 'three';
import { ORB_TUNING as T } from './tuning';

/**
 * 3D simplex noise (Ashima / Stefan Gustavson, public domain) plus the
 * two-octave "field" that drives the liquid surface. Every name is orb-prefixed
 * so it can never collide with a Three.js shader chunk.
 */
const ORB_NOISE_GLSL = [
  'vec3 orbMod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }',
  'vec4 orbMod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }',
  'vec4 orbPermute(vec4 x) { return orbMod289(((x * 34.0) + 1.0) * x); }',
  'vec4 orbTaylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }',
  'float orbSnoise(vec3 v) {',
  '  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);',
  '  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);',
  '  vec3 i = floor(v + dot(v, C.yyy));',
  '  vec3 x0 = v - i + dot(i, C.xxx);',
  '  vec3 g = step(x0.yzx, x0.xyz);',
  '  vec3 l = 1.0 - g;',
  '  vec3 i1 = min(g.xyz, l.zxy);',
  '  vec3 i2 = max(g.xyz, l.zxy);',
  '  vec3 x1 = x0 - i1 + C.xxx;',
  '  vec3 x2 = x0 - i2 + C.yyy;',
  '  vec3 x3 = x0 - D.yyy;',
  '  i = orbMod289(i);',
  '  vec4 p = orbPermute(orbPermute(orbPermute(',
  '      i.z + vec4(0.0, i1.z, i2.z, 1.0))',
  '    + i.y + vec4(0.0, i1.y, i2.y, 1.0))',
  '    + i.x + vec4(0.0, i1.x, i2.x, 1.0));',
  '  float n_ = 0.142857142857;',
  '  vec3 ns = n_ * D.wyz - D.xzx;',
  '  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);',
  '  vec4 x_ = floor(j * ns.z);',
  '  vec4 y_ = floor(j - 7.0 * x_);',
  '  vec4 x = x_ * ns.x + ns.yyyy;',
  '  vec4 y = y_ * ns.x + ns.yyyy;',
  '  vec4 h = 1.0 - abs(x) - abs(y);',
  '  vec4 b0 = vec4(x.xy, y.xy);',
  '  vec4 b1 = vec4(x.zw, y.zw);',
  '  vec4 s0 = floor(b0) * 2.0 + 1.0;',
  '  vec4 s1 = floor(b1) * 2.0 + 1.0;',
  '  vec4 sh = -step(h, vec4(0.0));',
  '  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;',
  '  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;',
  '  vec3 p0 = vec3(a0.xy, h.x);',
  '  vec3 p1 = vec3(a0.zw, h.y);',
  '  vec3 p2 = vec3(a1.xy, h.z);',
  '  vec3 p3 = vec3(a1.zw, h.w);',
  '  vec4 norm = orbTaylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));',
  '  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;',
  '  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);',
  '  m = m * m;',
  '  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));',
  '}',
].join('\n');

const ORB_UNIFORM_GLSL = [
  'uniform float uTime;',
  'uniform float uAudio;',
  'uniform float uNoiseScale;',
  'uniform float uNoiseStrength;',
  'uniform float uAudioStrength;',
  'uniform float uSpeed;',
].join('\n');

const ORB_FIELD_GLSL = [
  'float orbField(vec3 p) {',
  '  vec3 q = p * uNoiseScale;',
  '  float t = uTime * uSpeed;',
  '  float n1 = orbSnoise(q + vec3(0.0, t, 0.0));',
  '  float n2 = orbSnoise(q * 2.17 + vec3(t * 1.6, 0.0, t * 0.8));',
  '  return n1 * 0.65 + n2 * 0.35;',
  '}',
].join('\n');

/**
 * Declares the noise plus the per-vertex displacement. The gradient is sampled
 * with two extra noise reads along the surface tangents so the displaced
 * normals keep the lighting believable instead of looking inflated.
 */
const ORB_BEGIN_NORMAL = [
  'vec3 objectNormal = vec3( normal );',
  'float orbN = orbField(position);',
  'float orbEps = 0.035;',
  'vec3 orbT = normalize(cross(normal, vec3(0.0, 1.0, 0.0) + vec3(0.0001)));',
  'vec3 orbB = normalize(cross(normal, orbT));',
  'float orbNt = orbField(position + orbT * orbEps);',
  'float orbNb = orbField(position + orbB * orbEps);',
  'float orbAmp = uNoiseStrength + uAudio * uAudioStrength;',
  'vec3 orbGrad = (orbT * (orbNt - orbN) + orbB * (orbNb - orbN)) / orbEps;',
  'objectNormal = normalize(objectNormal - orbGrad * orbAmp * 0.35);',
  'float orbDisp = orbN * orbAmp;',
].join('\n');

const ORB_BEGIN_VERTEX = 'vec3 transformed = vec3( position ) + normal * orbDisp;';

export interface OrbUniforms {
  uTime: { value: number };
  uAudio: { value: number };
  uNoiseScale: { value: number };
  uNoiseStrength: { value: number };
  uAudioStrength: { value: number };
  uSpeed: { value: number };
}

export interface OrbMaterial {
  material: THREE.MeshPhysicalMaterial;
  uniforms: OrbUniforms;
}

/**
 * Liquid-glass material: transmission + iridescence + clearcoat, with the
 * simplex-noise displacement injected into the standard vertex shader.
 */
export function createOrbMaterial(): OrbMaterial {
  const uniforms: OrbUniforms = {
    uTime: { value: 0 },
    uAudio: { value: 0 },
    uNoiseScale: { value: T.noiseScale },
    uNoiseStrength: { value: T.noiseStrength },
    uAudioStrength: { value: T.audioStrength },
    uSpeed: { value: T.speed.idle },
  };

  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(T.color),
    roughness: T.roughness,
    metalness: T.metalness,
    transmission: T.transmission,
    thickness: T.thickness,
    ior: T.ior,
    clearcoat: T.clearcoat,
    clearcoatRoughness: T.clearcoatRoughness,
    iridescence: T.iridescence,
    iridescenceIOR: T.iridescenceIOR,
    iridescenceThicknessRange: [
      T.iridescenceThicknessRange[0],
      T.iridescenceThicknessRange[1],
    ] as [number, number],
    dispersion: T.dispersion,
    emissive: new THREE.Color(T.glow.idle.emissive),
    emissiveIntensity: T.glowIntensity,
    side: THREE.FrontSide,
  });

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${ORB_NOISE_GLSL}\n${ORB_UNIFORM_GLSL}\n${ORB_FIELD_GLSL}`)
      .replace('#include <beginnormal_vertex>', ORB_BEGIN_NORMAL)
      .replace('#include <begin_vertex>', ORB_BEGIN_VERTEX);
  };

  // Distinct cache key so this variant is never reused by another physical material.
  material.customProgramCacheKey = () => 'tutor-orb-v1';

  return { material, uniforms };
}
