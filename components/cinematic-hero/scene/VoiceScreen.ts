import * as THREE from 'three';

export interface VoiceScreenCourse {
  name: string;
  tag: string;
}

export interface VoiceScreenContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  courses: VoiceScreenCourse[];
  code: string[];
  footer: string;
}

/**
 * Default on-screen content. These mirror the real product (course catalog
 * titles and landing copy) so the display shows actual VoiceCode UI content,
 * not an unrelated image. Callers may override via props.
 */
export const DEFAULT_VOICE_SCREEN_CONTENT: VoiceScreenContent = {
  eyebrow: 'Ecosystem · AI Coding Tutor',
  title: 'Talk. Code. Understand.',
  subtitle:
    'An AI-powered coding companion that helps you learn concepts, debug errors, and build with confidence — all through your voice.',
  courses: [
    { name: 'JavaScript Mastery', tag: 'Continue →' },
    { name: 'Cloud & Big Data Engineering', tag: 'Start →' },
  ],
  code: [
    'const greeting = "Hello, Ecosystem!";',
    'await tutor.explain(closure);',
    'run(tests); // all green',
  ],
  footer: 'VOICE SESSION · LIVE',
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x, y, r);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(trial).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = trial;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Renders real product content to a live CanvasTexture for the laptop display.
 *
 * Rendered at 2048x1280 (2x the logical 1024x640 layout via ctx.scale, so all
 * drawing coordinates below are unchanged) to keep text crisp when the camera
 * is close to the screen. Aspect ratio is preserved exactly.
 */
export function createVoiceScreenTexture(content: VoiceScreenContent = DEFAULT_VOICE_SCREEN_CONTENT): THREE.CanvasTexture {
  const width = 2048;
  const height = 1280;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2D canvas context is unavailable for the laptop display.');
  }
  ctx.scale(2, 2);

  // Logical layout units under the 2x scale above (canvas is 2048x1280).
  // Width-anchored geometry uses these so cards and tags stay on-canvas.
  const LW = 1024;
  const LH = 640;

  ctx.fillStyle = '#0B0B0F';
  ctx.fillRect(0, 0, LW, LH);

  const accent = ctx.createLinearGradient(0, 0, LW, 0);
  accent.addColorStop(0, '#F97316');
  accent.addColorStop(1, '#EA580C');
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, LW, 10);

  ctx.fillStyle = '#71717A';
  ctx.font = '600 22px ui-monospace, monospace';
  ctx.fillText(content.eyebrow, 56, 72);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 64px ui-sans-serif, system-ui, sans-serif';
  const titleLines = content.title.split('. ');
  titleLines.forEach((line, index) => {
    ctx.fillText(index < titleLines.length - 1 ? `${line}.` : line, 56, 150 + index * 72);
  });

  // The hero subheadline wraps to two lines; layout below flows from it.
  ctx.fillStyle = '#A1A1AA';
  ctx.font = '400 28px ui-sans-serif, system-ui, sans-serif';
  const subY = 150 + titleLines.length * 72;
  const subLines = wrapText(ctx, content.subtitle, LW - 112);
  subLines.slice(0, 2).forEach((line, index) => {
    ctx.fillText(line, 56, subY + index * 38);
  });

  let y = subY + (Math.min(subLines.length, 2) - 1) * 38 + 56;
  content.courses.slice(0, 2).forEach((course) => {
    ctx.fillStyle = '#18181B';
    roundRect(ctx, 56, y, LW - 112, 80, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 30px ui-sans-serif, system-ui, sans-serif';
    ctx.fillText(course.name.slice(0, 34), 84, y + 50);
    ctx.fillStyle = '#F97316';
    ctx.font = '600 24px ui-sans-serif, system-ui, sans-serif';
    ctx.fillText(course.tag, LW - 240, y + 50);
    y += 96;
  });

  // No code-snippet card: the hero messaging above now fills the display and
  // the course cards remain as the on-screen product UI.

  ctx.fillStyle = '#52525B';
  ctx.font = '600 20px ui-monospace, monospace';
  ctx.fillText(content.footer, 56, LH - 36);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  // Trilinear filtering with mipmaps for minification; anisotropy is raised
  // to the renderer maximum (capped) by the caller for glancing angles.
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  return texture;
}
