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
  eyebrow: 'ECOSYSTEM · AI CODING TUTOR',
  title: 'Master code with your voice.',
  subtitle: 'Talk through bugs. Ship faster.',
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
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Renders real product content to a live CanvasTexture for the laptop display. */
export function createVoiceScreenTexture(content: VoiceScreenContent = DEFAULT_VOICE_SCREEN_CONTENT): THREE.CanvasTexture {
  const width = 1024;
  const height = 640;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2D canvas context is unavailable for the laptop display.');
  }

  ctx.fillStyle = '#0B0B0F';
  ctx.fillRect(0, 0, width, height);

  const accent = ctx.createLinearGradient(0, 0, width, 0);
  accent.addColorStop(0, '#F97316');
  accent.addColorStop(1, '#EA580C');
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, width, 10);

  ctx.fillStyle = '#71717A';
  ctx.font = '600 22px ui-monospace, monospace';
  ctx.fillText(content.eyebrow, 56, 72);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 64px ui-sans-serif, system-ui, sans-serif';
  const titleLines = content.title.split('. ');
  titleLines.forEach((line, index) => {
    ctx.fillText(index < titleLines.length - 1 ? `${line}.` : line, 56, 150 + index * 72);
  });

  ctx.fillStyle = '#A1A1AA';
  ctx.font = '400 28px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText(content.subtitle, 56, 150 + titleLines.length * 72);

  let y = 150 + titleLines.length * 72 + 56;
  content.courses.slice(0, 2).forEach((course) => {
    ctx.fillStyle = '#18181B';
    roundRect(ctx, 56, y, width - 112, 84, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 30px ui-sans-serif, system-ui, sans-serif';
    ctx.fillText(course.name.slice(0, 34), 84, y + 52);
    ctx.fillStyle = '#F97316';
    ctx.font = '600 24px ui-sans-serif, system-ui, sans-serif';
    ctx.fillText(course.tag, width - 240, y + 52);
    y += 104;
  });

  ctx.fillStyle = '#09090B';
  roundRect(ctx, 56, y, width - 112, 150, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(249,115,22,0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = '400 24px ui-monospace, monospace';
  content.code.slice(0, 3).forEach((line, index) => {
    ctx.fillStyle = index === 0 ? '#FDBA74' : '#D4D4D8';
    ctx.fillText(line.slice(0, 52), 84, y + 48 + index * 36);
  });

  ctx.fillStyle = '#52525B';
  ctx.font = '600 20px ui-monospace, monospace';
  ctx.fillText(content.footer, 56, height - 36);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
