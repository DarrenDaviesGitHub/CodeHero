import { MAX_LIVES, WORDS_PER_LEVEL } from './levels';

export interface SessionSnapshot {
  readonly score: number;
  readonly lives: number;
  readonly maxLives: number;
  readonly level: number;
  readonly levelProgress: number;
  readonly wordsPerLevel: number;
  readonly combo: number;
  readonly bestCombo: number;
  readonly multiplier: number;
  readonly wordsCompleted: number;
  readonly accuracy: number;
}

export function multiplierFor(combo: number): number {
  if (combo >= 20) return 4;
  if (combo >= 10) return 3;
  if (combo >= 5) return 2;
  return 1;
}

export class GameSession {
  score = 0;
  lives = MAX_LIVES;
  level = 1;
  levelProgress = 0;
  combo = 0;
  bestCombo = 0;
  wordsCompleted = 0;
  correctKeys = 0;
  wrongKeys = 0;

  get multiplier(): number {
    return multiplierFor(this.combo);
  }

  get isOver(): boolean {
    return this.lives <= 0;
  }

  keyCorrect(): void {
    this.correctKeys++;
  }

  keyWrong(): void {
    this.wrongKeys++;
    this.combo = 0;
  }

  wordCompleted(text: string): { points: number; leveledUp: boolean } {
    this.combo++;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    const points = (text.length * 10 + this.level * 5) * this.multiplier;
    this.score += points;
    this.wordsCompleted++;
    this.levelProgress++;
    const leveledUp = this.levelProgress >= WORDS_PER_LEVEL;
    if (leveledUp) {
      this.level++;
      this.levelProgress = 0;
    }
    return { points, leveledUp };
  }

  wordMissed(): { gameOver: boolean } {
    this.lives = Math.max(0, this.lives - 1);
    this.combo = 0;
    return { gameOver: this.isOver };
  }

  snapshot(): SessionSnapshot {
    const total = this.correctKeys + this.wrongKeys;
    return {
      score: this.score,
      lives: this.lives,
      maxLives: MAX_LIVES,
      level: this.level,
      levelProgress: this.levelProgress,
      wordsPerLevel: WORDS_PER_LEVEL,
      combo: this.combo,
      bestCombo: this.bestCombo,
      multiplier: this.multiplier,
      wordsCompleted: this.wordsCompleted,
      accuracy: total === 0 ? 1 : this.correctKeys / total,
    };
  }
}
