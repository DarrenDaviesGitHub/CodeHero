export interface TypableWord {
  readonly id: number;
  readonly text: string;
  typed: number;
  progress: number;
}

export type KeyResult =
  | { kind: 'progress'; word: TypableWord }
  | { kind: 'complete'; word: TypableWord }
  | { kind: 'wrong'; word: TypableWord | null };

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

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

  release(): TypableWord | null {
    const word = this.target;
    if (word) word.typed = 0;
    this.target = null;
    return word;
  }

  forget(id: number): void {
    if (this.target?.id === id) this.target = null;
  }

  reset(): void {
    this.target = null;
  }
}
