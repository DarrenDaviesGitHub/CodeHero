import * as Phaser from 'phaser';
import { audio } from '../audio';
import { floatingText, prefersReducedMotion, shockwave, sparkBurst, strikeLightning } from '../effects';
import { gameBus, type StartOptions } from '../events';
import { LANGUAGES, type Language } from '../logic/keywords';
import { getLevelConfig, type LevelConfig } from '../logic/levels';
import { GameSession } from '../logic/session';
import { TypingEngine } from '../logic/typing';
import { WordPicker } from '../logic/wordPicker';
import { WordSprite } from '../WordSprite';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

const CX = GAME_WIDTH / 2;
const HORIZON_Y = 150;
const SPAWN_Y = 185;
const STRIKE_Y = 630;
const TOP_WIDTH = 380;
const STRIKE_WIDTH = 1040;
const LANES = 5;
const LANE_COLORS = [0x5cff6a, 0xff3d6e, 0xffe03d, 0x3d9bff, 0xff7a3d];

type Mode = 'attract' | 'playing' | 'over';

/** Highway width at a given screen y (linear perspective). */
const widthAt = (y: number) => TOP_WIDTH + ((y - HORIZON_Y) / (STRIKE_Y - HORIZON_Y)) * (STRIKE_WIDTH - TOP_WIDTH);
const laneX = (lane: number, y: number) => CX + ((lane + 0.5) / LANES - 0.5) * widthAt(y);

export class PlayScene extends Phaser.Scene {
  private mode: Mode = 'attract';
  private words: WordSprite[] = [];
  private nextId = 1;
  private session = new GameSession();
  private engine = new TypingEngine();
  private picker = new WordPicker(new Set(LANGUAGES));
  private config: LevelConfig = getLevelConfig(2);
  private spawnTimer = 0;
  private spawnHold = 0;
  private ghostTimer = 0;
  private startedAt = 0;
  private scroll = 0;
  private reducedMotion = false;

  private grid!: Phaser.GameObjects.Graphics;
  private strikeLine!: Phaser.GameObjects.Graphics;
  private danger = 0;
  private unsubscribers: Array<() => void> = [];

  constructor() {
    super('play');
  }

  create(): void {
    this.reducedMotion = prefersReducedMotion();
    this.drawBackdrop();
    this.grid = this.add.graphics().setDepth(2);
    this.strikeLine = this.add.graphics().setDepth(5);

    this.input.keyboard?.on('keydown', this.onKeyDown, this);

    this.unsubscribers = [
      gameBus.on('start', (opts) => this.startGame(opts)),
      gameBus.on('pause', () => this.scene.pause()),
      gameBus.on('resume', () => this.scene.resume()),
      gameBus.on('quit', () => this.enterAttract()),
    ];
    const cleanup = () => {
      this.unsubscribers.forEach((u) => u());
      this.unsubscribers = [];
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
    this.events.once(Phaser.Scenes.Events.DESTROY, cleanup);

    this.enterAttract();
    gameBus.emit('ready');
  }

  private clearWords(): void {
    for (const w of this.words) w.destroy();
    this.words = [];
    this.engine.reset();
  }

  private enterAttract(): void {
    if (this.scene.isPaused()) this.scene.resume();
    this.mode = 'attract';
    this.clearWords();
    this.picker = new WordPicker(new Set(LANGUAGES));
    this.config = getLevelConfig(3);
    this.spawnTimer = 0;
    this.spawnHold = 0.5;
  }

  private startGame(opts: StartOptions): void {
    if (this.scene.isPaused()) this.scene.resume();
    this.clearWords();
    const languages = new Set<Language>(opts.languages.length ? opts.languages : LANGUAGES);
    this.picker = new WordPicker(languages);
    this.session = new GameSession();
    this.config = getLevelConfig(1);
    this.mode = 'playing';
    this.spawnTimer = 0;
    this.spawnHold = 1.2;
    this.startedAt = this.time.now;
    this.cameras.main.flash(400, 120, 60, 255);
    this.showBanner('LEVEL 1', 'TYPE THE KEYWORDS!');
    audio.startMusic(112);
    this.emitHud();
  }

  private endGame(): void {
    this.mode = 'over';
    for (const w of this.words) {
      sparkBurst(this, w.x, w.y, w.color, 25);
      w.destroy();
    }
    this.words = [];
    this.engine.reset();
    audio.stopMusic();
    audio.gameOver();
    if (!this.reducedMotion) this.cameras.main.shake(500, 0.015);
    this.cameras.main.flash(600, 255, 0, 80);
    gameBus.emit('gameOver', {
      ...this.session.snapshot(),
      durationSeconds: Math.round((this.time.now - this.startedAt) / 1000),
    });
  }

  private emitHud(): void {
    gameBus.emit('hud', this.session.snapshot());
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (this.mode !== 'playing' || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;

    if (event.key === 'Backspace') {
      event.preventDefault();
      (this.engine.release() as WordSprite | null)?.refresh();
      return;
    }
    if (event.key.length !== 1 || event.key === ' ') {
      if (event.key === ' ') event.preventDefault();
      return;
    }
    
    event.preventDefault();
    this.typeChar(event.key);
  }

  private typeChar(char: string): void {
    const result = this.engine.handleChar(char, this.words);
    const playing = this.mode === 'playing';
    switch (result.kind) {
      case 'progress': {
        const w = result.word as WordSprite;
        w.refresh();
        if (playing) this.session.keyCorrect();
        if (playing) audio.key(w.typed - 1);
        break;
      }
      case 'complete': {
        const w = result.word as WordSprite;
        if (playing) this.session.keyCorrect();
        this.completeWord(w);
        break;
      }
      case 'wrong': {
        if (!playing) return;
        const hadCombo = this.session.combo >= 5;
        this.session.keyWrong();
        (result.word as WordSprite | null)?.flashWrong();
        audio.wrong();
        if (hadCombo) floatingText(this, CX, STRIKE_Y - 40, 'COMBO BROKEN', '#ff4d6d', 26);
        this.emitHud();
        break;
      }
    }
  }

  private completeWord(w: WordSprite): void {
    w.refresh();
    strikeLightning(this, w.x, w.y, w.color);
    sparkBurst(this, w.x, w.y, w.color);
    shockwave(this, w.x, w.y, w.color);
    if (this.mode === 'playing') {
      audio.zap(w.text.length);
      if (!this.reducedMotion) this.cameras.main.shake(90, 0.004);
    }
    this.words = this.words.filter((o) => o !== w);
    this.tweens.add({
      targets: w,
      scale: w.scale * 1.5,
      alpha: 0,
      duration: 180,
      onComplete: () => w.destroy(),
    });

    if (this.mode !== 'playing') return;

    const prevMultiplier = this.session.multiplier;
    const { points, leveledUp } = this.session.wordCompleted(w.text);
    floatingText(this, w.x, w.y - 20, `+${points}`, '#ffffff', 26);
    if (this.session.multiplier > prevMultiplier) {
      floatingText(this, CX, 480, `${this.session.multiplier}x MULTIPLIER!`, '#ffe14d', 44, 90);
    } else if (this.session.combo > 0 && this.session.combo % 10 === 0) {
      floatingText(this, CX, 480, `${this.session.combo} COMBO!`, '#ff3df0', 40, 90);
    }
    if (leveledUp) this.levelUp();
    this.emitHud();
  }

  private levelUp(): void {
    const level = this.session.level;
    this.config = getLevelConfig(level);
    this.spawnHold = 2;
    audio.levelUp();
    audio.setTempo(Math.min(168, 112 + (level - 1) * 7));
    this.cameras.main.flash(350, 255, 225, 80);
    this.showBanner(`LEVEL ${level}`, 'FASTER  •  HARDER');
    gameBus.emit('levelUp', level);
  }

  private missWord(w: WordSprite): void {
    this.engine.forget(w.id);
    this.words = this.words.filter((o) => o !== w);
    sparkBurst(this, w.x, STRIKE_Y, 0xff2a4d, 30);
    w.destroy();
    if (this.mode !== 'playing') return;

    const { gameOver } = this.session.wordMissed();
    audio.lifeLost();
    floatingText(this, w.x, STRIKE_Y - 30, 'MISS', '#ff2a4d', 32);
    if (!this.reducedMotion) this.cameras.main.shake(250, 0.012);
    this.cameras.main.flash(220, 255, 0, 60);
    this.emitHud();
    if (gameOver) this.endGame();
  }

  private spawnWord(): boolean {
    const busy = new Set<number>();
    for (const w of this.words) {
      if (w.progress < 0.28) for (const l of [w.lane - 1, w.lane, w.lane + 1]) busy.add(l);
    }
    const free = [...Array(LANES).keys()].filter((l) => !busy.has(l));
    if (free.length === 0) return false;
    const lane = free[Math.floor(Math.random() * free.length)];

    const blocked = new Set(this.words.map((w) => w.text[0].toLowerCase()));
    const keyword = this.picker.pick(this.config, blocked);
    const sprite = new WordSprite(this, this.nextId++, keyword, lane);
    sprite.setAlpha(0);
    this.positionWord(sprite);
    this.words.push(sprite);
    return true;
  }

  private positionWord(w: WordSprite): void {
    const y = SPAWN_Y + (STRIKE_Y - SPAWN_Y) * w.progress;
    w.setPosition(laneX(w.lane, y) + w.shake, y);
    w.setScale(0.55 + 0.5 * w.progress);
    w.setAlpha(Math.min(1, w.progress * 12));
    w.setDepth(10 + w.progress);
  }

  update(_time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs, 100) / 1000;
    this.scroll = (this.scroll + dt * (0.35 + this.config.level * 0.04)) % 1;

    if (this.mode !== 'over') {
      if (this.spawnHold > 0) this.spawnHold -= dt;
      else {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0 && this.words.length < this.config.maxWords) {
          this.spawnTimer = this.spawnWord() ? this.config.spawnSeconds * (0.85 + Math.random() * 0.3) : 0.15;
        }
      }
    }

    let maxProgress = 0;
    for (const w of [...this.words]) {
      w.progress += dt / this.config.fallSeconds;
      if (w.progress >= 1) {
        this.missWord(w);
        continue;
      }
      maxProgress = Math.max(maxProgress, w.progress);
      this.positionWord(w);
    }

    if (this.mode === 'attract') this.runGhostTypist(dt);

    const targetDanger = maxProgress > 0.78 ? (maxProgress - 0.78) / 0.22 : 0;
    this.danger += (targetDanger - this.danger) * Math.min(1, dt * 8);
    this.drawGrid();
    this.drawStrikeLine();
  }

  private runGhostTypist(dt: number): void {
    this.ghostTimer -= dt;
    if (this.ghostTimer > 0) return;
    this.ghostTimer = 0.09 + Math.random() * 0.08;
    const targetId = this.engine.targetId;
    const target = targetId !== null ? this.words.find((w) => w.id === targetId) : undefined;
    if (target) {
      this.typeChar(target.text[target.typed]);
      return;
    }
    const candidate = this.words
      .filter((w) => w.progress > 0.3)
      .sort((a, b) => b.progress - a.progress)[0];
    if (candidate) {
      this.typeChar(candidate.text[0]);
      this.ghostTimer += 0.25;
    }
  }

  private showBanner(title: string, subtitle: string): void {
    const big = this.add
      .text(CX, 300, title, {
        fontFamily: 'Orbitron, "Segoe UI", sans-serif',
        fontSize: '84px',
        fontStyle: '900',
        color: '#ffffff',
        stroke: '#ff3df0',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(80)
      .setShadow(0, 0, '#ff3df0', 30, true, true)
      .setResolution(2);
    const small = this.add
      .text(CX, 370, subtitle, {
        fontFamily: 'Orbitron, "Segoe UI", sans-serif',
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#5ff7ff',
      })
      .setOrigin(0.5)
      .setDepth(80)
      .setShadow(0, 0, '#5ff7ff', 14, false, true)
      .setResolution(2);
    big.setScale(3).setAlpha(0);
    small.setAlpha(0);
    this.tweens.add({ targets: big, scale: 1, alpha: 1, duration: 380, ease: 'Back.easeOut' });
    this.tweens.add({ targets: small, alpha: 1, duration: 300, delay: 250 });
    this.tweens.add({
      targets: [big, small],
      alpha: 0,
      y: '-=40',
      delay: 1500,
      duration: 400,
      onComplete: () => {
        big.destroy();
        small.destroy();
      },
    });
  }

  private drawBackdrop(): void {
    const g = this.add.graphics().setDepth(0);
    g.fillGradientStyle(0x080120, 0x080120, 0x3a0a5e, 0x3a0a5e, 1);
    g.fillRect(0, 0, GAME_WIDTH, HORIZON_Y);
    g.fillGradientStyle(0x14032e, 0x14032e, 0x05010f, 0x05010f, 1);
    g.fillRect(0, HORIZON_Y, GAME_WIDTH, GAME_HEIGHT - HORIZON_Y);

    const sun = this.add.graphics().setDepth(1);
    const r = 120;
    const cy = HORIZON_Y - 8;
    for (let y = cy - r; y < HORIZON_Y; y += 2) {
      const dy = y - cy;
      const t = (y - (cy - r)) / r; // 0 top -> ~1 at centre
      const gapEvery = t > 0.45 ? Math.max(3, Math.floor(14 - t * 10)) : 0;
      if (gapEvery && Math.floor((y - (cy - r)) / 2) % gapEvery === 0) continue;
      const half = Math.sqrt(Math.max(0, r * r - dy * dy));
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(0xffe14d),
        Phaser.Display.Color.ValueToColor(0xff2a8a),
        100,
        Math.min(100, t * 100),
      );
      sun.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
      sun.fillRect(CX - half, y, half * 2, 2);
    }
    const sunGlow = this.add.image(CX, cy, 'glow').setDepth(0).setBlendMode(Phaser.BlendModes.ADD).setTint(0xff2a8a).setScale(4.5).setAlpha(0.8);
    this.tweens.add({ targets: sunGlow, alpha: 0.5, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    for (let i = 0; i < 90; i++) {
      const star = this.add
        .image(Math.random() * GAME_WIDTH, Math.random() * (HORIZON_Y - 10), 'star')
        .setDepth(0)
        .setAlpha(0.2 + Math.random() * 0.8)
        .setScale(0.3 + Math.random() * 0.7);
      this.tweens.add({
        targets: star,
        alpha: 0.1,
        duration: 600 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 2000,
      });
    }

    const hw = this.add.graphics().setDepth(1);
    const bottomW = widthAt(GAME_HEIGHT);
    hw.fillStyle(0x0a0220, 0.92);
    hw.fillPoints(
      [
        new Phaser.Math.Vector2(CX - TOP_WIDTH / 2, HORIZON_Y),
        new Phaser.Math.Vector2(CX + TOP_WIDTH / 2, HORIZON_Y),
        new Phaser.Math.Vector2(CX + bottomW / 2, GAME_HEIGHT),
        new Phaser.Math.Vector2(CX - bottomW / 2, GAME_HEIGHT),
      ],
      true,
    );
    for (let i = 0; i <= LANES; i++) {
      const edge = i === 0 || i === LANES;
      const x1 = CX + (i / LANES - 0.5) * TOP_WIDTH;
      const x2 = CX + (i / LANES - 0.5) * bottomW;
      for (const [w, a] of edge ? [[10, 0.15], [4, 0.5], [2, 1]] : [[4, 0.12], [1.5, 0.5]]) {
        hw.lineStyle(w, edge ? 0xff3df0 : 0x7a5cff, a);
        hw.lineBetween(x1, HORIZON_Y, x2, GAME_HEIGHT);
      }
    }
    // Horizon glow line.
    hw.lineStyle(3, 0xff3df0, 0.9).lineBetween(0, HORIZON_Y, GAME_WIDTH, HORIZON_Y);
    hw.lineStyle(10, 0xff3df0, 0.2).lineBetween(0, HORIZON_Y, GAME_WIDTH, HORIZON_Y);
  }

  private drawGrid(): void {
    const g = this.grid;
    g.clear();
    const lines = 12;
    for (let k = 0; k < lines; k++) {
      const z = (k + this.scroll) / lines;
      const y = HORIZON_Y + (GAME_HEIGHT - HORIZON_Y) * z * z;
      const alpha = 0.08 + z * 0.5;
      // Ground grid (outside highway).
      g.lineStyle(1.5, 0x2ad4ff, alpha * 0.5);
      g.lineBetween(0, y, GAME_WIDTH, y);
      // Highway fret.
      const w = widthAt(y);
      g.lineStyle(2 + z * 2, 0xb15cff, alpha);
      g.lineBetween(CX - w / 2, y, CX + w / 2, y);
    }

    for (let i = -10; i <= 10; i++) {
      const x2 = CX + i * 170;
      g.lineStyle(1, 0x2ad4ff, 0.18);
      g.lineBetween(CX + i * 40, HORIZON_Y, x2, GAME_HEIGHT);
    }
  }

  private drawStrikeLine(): void {
    const g = this.strikeLine;
    g.clear();
    const w = widthAt(STRIKE_Y);
    const pulse = 0.5 + 0.5 * Math.sin(this.time.now / 120);
    const base = this.danger > 0.05 ? 0xff2a4d : 0xffffff;
    g.lineStyle(16, this.danger > 0.05 ? 0xff2a4d : 0xff3df0, 0.15 + this.danger * 0.35 * pulse);
    g.lineBetween(CX - w / 2, STRIKE_Y, CX + w / 2, STRIKE_Y);
    g.lineStyle(3, base, 0.9);
    g.lineBetween(CX - w / 2, STRIKE_Y, CX + w / 2, STRIKE_Y);
    for (let l = 0; l < LANES; l++) {
      const x = laneX(l, STRIKE_Y);
      g.fillStyle(LANE_COLORS[l], 0.25);
      g.fillCircle(x, STRIKE_Y, 22);
      g.lineStyle(3, LANE_COLORS[l], 1);
      g.strokeCircle(x, STRIKE_Y, 16);
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(x, STRIKE_Y, 4);
    }
  }
}
