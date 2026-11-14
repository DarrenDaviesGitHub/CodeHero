import { LANGUAGES, type Language } from '../game/logic/keywords';

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch { }
}

const HIGH_SCORE_KEY = 'code-hero:high-score';
const LANGUAGES_KEY = 'code-hero:languages';
const MUTED_KEY = 'code-hero:muted';

export function loadHighScore(): number {
  const n = Number(read(HIGH_SCORE_KEY));
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export function saveHighScore(score: number): void {
  write(HIGH_SCORE_KEY, String(Math.floor(score)));
}

export function loadLanguages(): Language[] {
  try {
    const parsed: unknown = JSON.parse(read(LANGUAGES_KEY) ?? 'null');
    if (Array.isArray(parsed)) {
      const valid = LANGUAGES.filter((l) => parsed.includes(l));
      if (valid.length > 0) return valid;
    }
  } catch { }
  return [...LANGUAGES];
}

export function saveLanguages(languages: readonly Language[]): void {
  write(LANGUAGES_KEY, JSON.stringify(languages));
}

export function loadMuted(): boolean {
  return read(MUTED_KEY) === '1';
}

export function saveMuted(muted: boolean): void {
  write(MUTED_KEY, muted ? '1' : '0');
}
