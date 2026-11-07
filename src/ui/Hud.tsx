import type { SessionSnapshot } from '../game/logic/session';

function Heart({ full }: { full: boolean }) {
  return (
    <svg className={`heart ${full ? 'full' : 'empty'}`} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21s-7.5-4.6-10-9.3C.3 8.3 2.4 4 6.4 4c2.3 0 3.9 1.3 5.6 3.3C13.7 5.3 15.3 4 17.6 4c4 0 6.1 4.3 4.4 7.7C19.5 16.4 12 21 12 21z" />
    </svg>
  );
}

export function Hud({ hud }: { hud: SessionSnapshot }) {
  return (
    <div className="hud" role="status" aria-live="polite">
      <div className="hud-left">
        <div className="hud-label">SCORE</div>
        <div className="hud-score">{hud.score.toLocaleString()}</div>
        <div className={`hud-mult m${hud.multiplier}`}>
          {hud.multiplier}x <span>combo {hud.combo}</span>
        </div>
      </div>

      <div className="hud-center">
        <div className="hud-label">LEVEL</div>
        <div className="hud-level">{hud.level}</div>
        <div className="pips" aria-label={`${hud.levelProgress} of ${hud.wordsPerLevel} keywords this level`}>
          {Array.from({ length: hud.wordsPerLevel }, (_, i) => (
            <span key={i} className={i < hud.levelProgress ? 'pip on' : 'pip'} />
          ))}
        </div>
      </div>

      <div className="hud-right">
        <div className="hud-label">LIVES</div>
        <div className="hearts" aria-label={`${hud.lives} lives left`}>
          {Array.from({ length: hud.maxLives }, (_, i) => (
            <Heart key={i} full={i < hud.lives} />
          ))}
        </div>
      </div>
    </div>
  );
}
