import { describe, expect, it } from 'vitest';
import { ALL_KEYWORDS, KEYWORDS, LANGUAGES, difficultyOf } from '../keywords';
import { getLevelConfig, MAX_LIVES, WORDS_PER_LEVEL } from '../levels';
import { GameSession, multiplierFor } from '../session';
import { TypingEngine, type TypableWord } from '../typing';
import { WordPicker } from '../wordPicker';

const word = (id: number, text: string, progress = 0): TypableWord => ({ id, text, typed: 0, progress });

describe('keywords', () => {
  it('covers every required language with unique, space-free keywords', () => {
    for (const lang of LANGUAGES) {
      const list = KEYWORDS[lang];
      expect(list.length).toBeGreaterThan(20);
      expect(new Set(list).size).toBe(list.length);
      for (const k of list) expect(k).toMatch(/^\S+$/);
    }
  });

  it('rates symbols as harder than letters', () => {
    expect(difficultyOf('if')).toBe(2);
    expect(difficultyOf('@media')).toBe(8);
  });
});

describe('levels', () => {
  it('gets faster and harder every level', () => {
    for (let l = 1; l < 15; l++) {
      const a = getLevelConfig(l);
      const b = getLevelConfig(l + 1);
      expect(b.fallSeconds).toBeLessThanOrEqual(a.fallSeconds);
      expect(b.spawnSeconds).toBeLessThanOrEqual(a.spawnSeconds);
      expect(b.maxDifficulty).toBeGreaterThan(a.maxDifficulty);
    }
    expect(getLevelConfig(2).fallSeconds).toBeLessThan(getLevelConfig(1).fallSeconds);
  });
});

describe('WordPicker', () => {
  it('only uses selected languages and level-appropriate words', () => {
    const picker = new WordPicker(new Set(['go']), () => 0.5);
    const cfg = getLevelConfig(1);
    for (let i = 0; i < 30; i++) {
      const k = picker.pick(cfg, new Set());
      expect(k.language).toBe('go');
    }
  });

  it('avoids first letters already on screen when possible', () => {
    const picker = new WordPicker(new Set(LANGUAGES));
    const blocked = new Set('abcdefghijklmnopqrs'.split(''));
    for (let i = 0; i < 50; i++) {
      expect(blocked.has(picker.pick(getLevelConfig(3), blocked).text[0].toLowerCase())).toBe(false);
    }
  });

  it('always returns something for very high levels', () => {
    const picker = new WordPicker(new Set(['python']));
    expect(ALL_KEYWORDS).toContainEqual(picker.pick(getLevelConfig(99), new Set()));
  });
});

describe('TypingEngine', () => {
  it('locks onto the matching word closest to the strike line', () => {
    const e = new TypingEngine();
    const words = [word(1, 'for', 0.2), word(2, 'func', 0.7)];
    const r = e.handleChar('f', words);
    expect(r).toMatchObject({ kind: 'progress', word: { id: 2 } });
    expect(e.targetId).toBe(2);
  });

  it('completes a word case-insensitively, including symbols', () => {
    const e = new TypingEngine();
    const words = [word(1, '@Media')];
    for (const c of '@medi') expect(e.handleChar(c, words).kind).toBe('progress');
    expect(e.handleChar('A', words).kind).toBe('complete');
    expect(e.targetId).toBeNull();
  });

  it('reports wrong keys without losing progress', () => {
    const e = new TypingEngine();
    const words = [word(1, 'var')];
    e.handleChar('v', words);
    expect(e.handleChar('x', words)).toMatchObject({ kind: 'wrong', word: { id: 1 } });
    expect(words[0].typed).toBe(1);
    expect(e.handleChar('z', [word(5, 'abc')])).toMatchObject({ kind: 'wrong' });
  });

  it('releases and forgets targets', () => {
    const e = new TypingEngine();
    const words = [word(1, 'let')];
    e.handleChar('l', words);
    expect(e.release()?.typed).toBe(0);
    e.handleChar('l', words);
    e.forget(1);
    expect(e.targetId).toBeNull();
  });
});

describe('GameSession', () => {
  it('levels up after the configured number of keywords', () => {
    const s = new GameSession();
    for (let i = 0; i < WORDS_PER_LEVEL - 1; i++) expect(s.wordCompleted('if').leveledUp).toBe(false);
    expect(s.wordCompleted('if').leveledUp).toBe(true);
    expect(s.level).toBe(2);
    expect(s.levelProgress).toBe(0);
  });

  it('ends the game after losing every life', () => {
    const s = new GameSession();
    for (let i = 0; i < MAX_LIVES - 1; i++) expect(s.wordMissed().gameOver).toBe(false);
    expect(s.wordMissed().gameOver).toBe(true);
    expect(s.lives).toBe(0);
  });

  it('builds and breaks combo multipliers', () => {
    expect([0, 5, 10, 20].map(multiplierFor)).toEqual([1, 2, 3, 4]);
    const s = new GameSession();
    for (let i = 0; i < 5; i++) s.wordCompleted('abc');
    expect(s.multiplier).toBe(2);
    s.keyWrong();
    expect(s.combo).toBe(0);
    expect(s.bestCombo).toBe(5);
  });

  it('tracks accuracy', () => {
    const s = new GameSession();
    s.keyCorrect();
    s.keyCorrect();
    s.keyCorrect();
    s.keyWrong();
    expect(s.snapshot().accuracy).toBe(0.75);
  });
});
