import * as Phaser from 'phaser';

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

type Pt = { x: number; y: number };

function boltPath(a: Pt, b: Pt, displacement: number, detail = 6): Pt[] {
  if (displacement < detail) return [a, b];
  const mid = {
    x: (a.x + b.x) / 2 + (Math.random() - 0.5) * displacement,
    y: (a.y + b.y) / 2 + (Math.random() - 0.5) * displacement * 0.3,
  };
  const left = boltPath(a, mid, displacement / 2, detail);
  const right = boltPath(mid, b, displacement / 2, detail);
  return [...left, ...right.slice(1)];
}

function strokePath(g: Phaser.GameObjects.Graphics, pts: Pt[], width: number, color: number, alpha: number) {
  g.lineStyle(width, color, alpha);
  g.beginPath();
  g.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
  g.strokePath();
}

function drawBolt(g: Phaser.GameObjects.Graphics, from: Pt, to: Pt, color: number) {
  const main = boltPath(from, to, Math.max(120, Math.abs(to.y - from.y) * 0.45));
  const branches: Pt[][] = [];
  for (let i = 0; i < 3; i++) {
    const start = main[Math.floor(main.length * (0.2 + Math.random() * 0.6))];
    const end = { x: start.x + (Math.random() - 0.5) * 220, y: start.y + 40 + Math.random() * 120 };
    branches.push(boltPath(start, end, 80));
  }
  for (const pts of [main, ...branches]) {
    const isMain = pts === main;
    strokePath(g, pts, isMain ? 18 : 8, color, 0.12);
    strokePath(g, pts, isMain ? 7 : 3, color, 0.55);
    strokePath(g, pts, isMain ? 2.5 : 1.2, 0xffffff, 1);
  }
}

export function strikeLightning(scene: Phaser.Scene, x: number, y: number, color: number): void {
  const g = scene.add.graphics().setDepth(60).setBlendMode(Phaser.BlendModes.ADD);
  const from = { x: x + (Math.random() - 0.5) * 260, y: -20 };
  const to = { x, y };
  drawBolt(g, from, to, color);
  scene.time.addEvent({
    delay: 45,
    repeat: 3,
    callback: () => {
      g.clear();
      drawBolt(g, from, to, color);
    },
  });
  scene.tweens.add({ targets: g, alpha: 0, delay: 140, duration: 260, onComplete: () => g.destroy() });

  const glow = scene.add.image(x, y, 'glow').setDepth(59).setBlendMode(Phaser.BlendModes.ADD).setTint(color).setScale(2.5);
  scene.tweens.add({ targets: glow, alpha: 0, scale: 5, duration: 450, onComplete: () => glow.destroy() });
}

export function sparkBurst(scene: Phaser.Scene, x: number, y: number, color: number, count = 40): void {
  const emitter = scene.add.particles(x, y, 'spark', {
    speed: { min: 120, max: 480 },
    angle: { min: 0, max: 360 },
    lifespan: { min: 350, max: 800 },
    scale: { start: 0.7, end: 0 },
    alpha: { start: 1, end: 0 },
    tint: [color, 0xffffff, color],
    gravityY: 400,
    blendMode: Phaser.BlendModes.ADD,
    emitting: false,
  });
  emitter.setDepth(55);
  emitter.explode(count);
  scene.time.delayedCall(900, () => emitter.destroy());
}

export function shockwave(scene: Phaser.Scene, x: number, y: number, color: number): void {
  const ring = scene.add.graphics().setDepth(54).setBlendMode(Phaser.BlendModes.ADD);
  ring.lineStyle(6, color, 1).strokeCircle(0, 0, 40);
  ring.lineStyle(2, 0xffffff, 1).strokeCircle(0, 0, 40);
  ring.setPosition(x, y).setScale(0.3);
  scene.tweens.add({ targets: ring, scale: 3, alpha: 0, duration: 500, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
}

export function floatingText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  color: string,
  size = 28,
  rise = 70,
): void {
  const t = scene.add
    .text(x, y, text, {
      fontFamily: 'Orbitron, "Segoe UI", system-ui, sans-serif',
      fontSize: `${size}px`,
      fontStyle: 'bold',
      color,
      stroke: '#1a0533',
      strokeThickness: 6,
    })
    .setOrigin(0.5)
    .setDepth(70)
    .setShadow(0, 0, color, 16, true, true);
  t.setResolution(2);
  scene.tweens.add({
    targets: t,
    y: y - rise,
    alpha: { from: 1, to: 0 },
    scale: { from: 0.6, to: 1.15 },
    duration: 900,
    ease: 'Cubic.easeOut',
    onComplete: () => t.destroy(),
  });
}

export function createTextures(scene: Phaser.Scene): void {
  const g = scene.make.graphics({}, false);

  for (let r = 16; r > 0; r--) {
    g.fillStyle(0xffffff, (1 - r / 16) ** 1.6);
    g.fillCircle(16, 16, r);
  }
  g.generateTexture('spark', 32, 32);
  g.clear();

  for (let r = 64; r > 0; r -= 2) {
    g.fillStyle(0xffffff, 0.04 * (1 - r / 64) + 0.005);
    g.fillCircle(64, 64, r);
  }
  g.generateTexture('glow', 128, 128);
  g.clear();

  g.fillStyle(0xffffff, 1);
  g.fillCircle(2, 2, 2);
  g.generateTexture('star', 4, 4);
  g.destroy();
}
