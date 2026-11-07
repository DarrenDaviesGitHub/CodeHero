import * as Phaser from 'phaser';
import { LANGUAGE_INFO, type Keyword } from './logic/keywords';
import type { TypableWord } from './logic/typing';

export const WORD_FONT = '"JetBrains Mono", "Cascadia Mono", Consolas, Menlo, monospace';
const BASE_COLOR = '#d9d4ff';
const TYPED_COLOR = '#ffe14d';
const HEIGHT = 44;

/** A falling keyword: a neon pill with a language badge and per-letter highlighting. */
export class WordSprite extends Phaser.GameObjects.Container implements TypableWord {
  readonly id: number;
  readonly text: string;
  readonly keyword: Keyword;
  readonly lane: number;
  readonly color: number;
  typed = 0;
  progress = 0;
  /** Horizontal shake offset, tweened on a wrong key. */
  shake = 0;

  private readonly bg: Phaser.GameObjects.Graphics;
  private readonly typedText: Phaser.GameObjects.Text;
  private readonly cursor: Phaser.GameObjects.Rectangle;
  private readonly textX: number;
  private readonly charWidth: number;
  private readonly pillWidth: number;
  private readonly badgeWidth: number;
  private targeted = false;

  constructor(scene: Phaser.Scene, id: number, keyword: Keyword, lane: number) {
    super(scene, 0, 0);
    this.id = id;
    this.keyword = keyword;
    this.text = keyword.text;
    this.lane = lane;
    const info = LANGUAGE_INFO[keyword.language];
    this.color = info.color;

    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: WORD_FONT,
      fontSize: '26px',
      fontStyle: 'bold',
      color: BASE_COLOR,
    };
    const base = scene.add.text(0, 0, keyword.text, style).setOrigin(0, 0.5).setResolution(2);
    this.typedText = scene.add
      .text(0, 0, '', { ...style, color: TYPED_COLOR })
      .setOrigin(0, 0.5)
      .setResolution(2)
      .setShadow(0, 0, TYPED_COLOR, 10, false, true);
    const badge = scene.add
      .text(0, 0, info.badge, {
        fontFamily: 'Orbitron, "Segoe UI", sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#120526',
      })
      .setOrigin(0.5)
      .setResolution(2);

    this.charWidth = base.width / keyword.text.length;
    this.badgeWidth = Math.max(30, badge.width + 12);
    this.pillWidth = 12 + this.badgeWidth + 10 + base.width + 16;
    const left = -this.pillWidth / 2;
    this.textX = left + 12 + this.badgeWidth + 10;
    base.setX(this.textX);
    this.typedText.setX(this.textX);
    badge.setPosition(left + 12 + this.badgeWidth / 2, 0);

    this.bg = scene.add.graphics();
    this.cursor = scene.add.rectangle(this.textX, 15, this.charWidth - 2, 3, 0xffe14d).setOrigin(0, 0.5).setVisible(false);
    this.add([this.bg, badge, base, this.typedText, this.cursor]);
    this.drawPill();
    scene.add.existing(this);
  }

  private drawPill(flashColor?: number): void {
    const g = this.bg;
    const w = this.pillWidth;
    const left = -w / 2;
    const top = -HEIGHT / 2;
    const stroke = flashColor ?? (this.targeted ? 0xffffff : this.color);
    g.clear();
    // Outer glow.
    g.lineStyle(this.targeted ? 12 : 8, flashColor ?? this.color, this.targeted ? 0.35 : 0.2);
    g.strokeRoundedRect(left, top, w, HEIGHT, HEIGHT / 2);
    g.fillStyle(0x0d0424, 0.9);
    g.fillRoundedRect(left, top, w, HEIGHT, HEIGHT / 2);
    g.lineStyle(this.targeted ? 3 : 2, stroke, 1);
    g.strokeRoundedRect(left, top, w, HEIGHT, HEIGHT / 2);
    // Badge.
    g.fillStyle(this.color, 1);
    g.fillRoundedRect(left + 8, top + 8, this.badgeWidth + 4, HEIGHT - 16, (HEIGHT - 16) / 2);
  }

  /** Refreshes highlighted letters and the cursor after typing changes. */
  refresh(): void {
    const targeted = this.typed > 0;
    if (targeted !== this.targeted) {
      this.targeted = targeted;
      this.drawPill();
    }
    this.typedText.setText(this.text.slice(0, this.typed));
    this.cursor.setVisible(targeted && this.typed < this.text.length);
    this.cursor.setX(this.textX + this.typed * this.charWidth + 1);
  }

  /** Red flash and shake for a wrong key. */
  flashWrong(): void {
    this.drawPill(0xff2a4d);
    this.scene.tweens.add({
      targets: this,
      shake: { from: 10, to: 0 },
      duration: 260,
      ease: 'Elastic.easeOut',
      onComplete: () => this.drawPill(),
    });
  }
}
