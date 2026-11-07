import type { CSSProperties } from 'react';
import { LANGUAGES, LANGUAGE_INFO, type Language } from '../game/logic/keywords';
import { KeyCap, NoFocusButton } from './KeyCap';

interface Props {
  ready: boolean;
  languages: readonly Language[];
  highScore: number;
  muted: boolean;
  onToggleLanguage: (language: Language) => void;
  onStart: () => void;
}

export function IntroScreen({ ready, languages, highScore, muted, onToggleLanguage, onStart }: Props) {
  const canStart = ready && languages.length > 0;
  return (
    <div className="screen intro">
      <div className="logo" aria-label="Code Hero">
        <span className="logo-code" data-text="CODE">
          CODE
        </span>
        <span className="logo-hero" data-text="HERO">
          HERO
        </span>
      </div>
      <p className="tagline">
        <span className="caret">&gt;</span> type fast. strike hard. save the build.
      </p>

      <section className="panel" aria-label="Languages">
        <h2>Pick your languages</h2>
        <div className="chips">
          {LANGUAGES.map((lang, i) => {
            const info = LANGUAGE_INFO[lang];
            const on = languages.includes(lang);
            return (
              <NoFocusButton
                key={lang}
                className={`chip ${on ? 'on' : ''}`}
                style={{ '--c': info.css } as CSSProperties}
                aria-pressed={on}
                onClick={() => onToggleLanguage(lang)}
              >
                <KeyCap>{i + 1}</KeyCap>
                {info.label}
              </NoFocusButton>
            );
          })}
        </div>
      </section>

      <NoFocusButton className="start" disabled={!canStart} onClick={onStart}>
        {!ready ? 'LOADING…' : languages.length === 0 ? 'PICK A LANGUAGE' : 'PRESS ENTER TO START'}
      </NoFocusButton>

      <ul className="howto">
        <li>Type each falling keyword before it hits the strike line</li>
        <li>5 lives &middot; clear 10 keywords to level up &middot; chain words for up to 4x score</li>
        <li>
          <KeyCap>Backspace</KeyCap> switch target <KeyCap>Esc</KeyCap> pause <KeyCap>M</KeyCap>{' '}
          {muted ? 'unmute' : 'mute'}
        </li>
      </ul>

      {highScore > 0 && <p className="best">HIGH SCORE {highScore.toLocaleString()}</p>}
    </div>
  );
}
