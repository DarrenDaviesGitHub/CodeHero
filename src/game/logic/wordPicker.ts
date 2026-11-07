import { ALL_KEYWORDS, type Keyword, type Language } from './keywords';
import type { LevelConfig } from './levels';

export type Rng = () => number;

const RECENT_LIMIT = 15;
const MIN_POOL = 6;

/**
 * Picks keywords suited to the current level, avoiding recent repeats and
 * first letters already on screen (so the first key press is never ambiguous).
 */
export class WordPicker {
  private readonly recent: string[] = [];
  private readonly languages: ReadonlySet<Language>;
  private readonly rng: Rng;
  private readonly source: readonly Keyword[];

  constructor(languages: ReadonlySet<Language>, rng: Rng = Math.random, source: readonly Keyword[] = ALL_KEYWORDS) {
    this.languages = languages;
    this.rng = rng;
    this.source = source;
  }

  pick(config: LevelConfig, blockedFirstChars: ReadonlySet<string>): Keyword {
    const byLanguage = this.source.filter((k) => this.languages.has(k.language));
    const base = byLanguage.length > 0 ? byLanguage : this.source;

    const fresh = (k: Keyword) => !this.recent.includes(k.text);
    const unblocked = (k: Keyword) => !blockedFirstChars.has(k.text[0].toLowerCase());

    // Progressively relax the constraints until we find a usable pool.
    let min = config.minDifficulty;
    let max = config.maxDifficulty;
    let pool: Keyword[] = [];
    for (let attempt = 0; attempt < 12 && pool.length < MIN_POOL; attempt++) {
      pool = base.filter((k) => k.difficulty >= min && k.difficulty <= max && fresh(k) && unblocked(k));
      min -= 1;
      max += 1;
    }
    if (pool.length === 0) pool = base.filter(unblocked);
    if (pool.length === 0) pool = [...base];

    const choice = pool[Math.floor(this.rng() * pool.length) % pool.length];
    this.recent.push(choice.text);
    if (this.recent.length > RECENT_LIMIT) this.recent.shift();
    return choice;
  }
}
