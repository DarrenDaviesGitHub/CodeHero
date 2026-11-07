export interface TypableWord {
  readonly id: number;
  readonly text: string;
  /** Number of characters typed correctly so far. */
  typed: number;
  /** 0 at the horizon, 1 at the strike line — used to prioritise targets. */
  progress: number;
}

export type KeyResult =
  | { kind: 'progress'; word: TypableWord }
  | { kind: 'complete'; word: TypableWord }
  | { kind: 'wrong'; word: TypableWord | null };

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/**
 * Pure typing state machine. The first key locks on to the matching keyword
 * closest to the strike line; following keys must continue that keyword.
 */
export class TypingEngine {
  private target: TypableWord | null = null;

  get targetId(): number | null {
    return this.target?.id ?? null;
  }

  handleChar(char: string, words: readonly TypableWord[]): KeyResult {
    if (char.length !== 1) return { kind: 'wrong', word: this.target };

    if (!this.target) {
      let best: TypableWord | null = null;
      for (const w of words) {
        if (w.typed === 0 && same(w.text[0], char) && (!best || w.progress > best.progress)) best = w;
      }
      if (!best) return { kind: 'wrong', word: null };
      this.target = best;
    } else if (!same(this.target.text[this.target.typed], char)) {
      return { kind: 'wrong', word: this.target };
    }

    const word = this.target;
    word.typed++;
    if (word.typed >= word.text.length) {
      this.target = null;
      return { kind: 'complete', word };
    }
    return { kind: 'progress', word };
  }

  /** Abandons the current target (Backspace), resetting its progress. */
  release(): TypableWord | null {
    const word = this.target;
    if (word) word.typed = 0;
    this.target = null;
    return word;
  }

  /** Call when a word leaves play so a stale target is never kept. */
  forget(id: number): void {
    if (this.target?.id === id) this.target = null;
  }

  reset(): void {
    this.target = null;
  }
}
