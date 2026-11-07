export const WORDS_PER_LEVEL = 10;
export const MAX_LIVES = 5;

export interface LevelConfig {
  readonly level: number;
  /** Seconds a keyword takes to travel from the horizon to the strike line. */
  readonly fallSeconds: number;
  /** Seconds between keyword spawns. */
  readonly spawnSeconds: number;
  /** Maximum keywords on screen at once. */
  readonly maxWords: number;
  readonly minDifficulty: number;
  readonly maxDifficulty: number;
}

export function getLevelConfig(level: number): LevelConfig {
  const l = Math.max(1, Math.floor(level));
  const step = l - 1;
  return {
    level: l,
    fallSeconds: Math.max(3.2, 10 * 0.9 ** step),
    spawnSeconds: Math.max(0.7, 2.4 * 0.9 ** step),
    maxWords: Math.min(8, 3 + Math.floor(step / 2)),
    minDifficulty: Math.min(8, step * 1.5),
    maxDifficulty: 4 + step * 2,
  };
}
