import type { GameOverSummary } from '../game/events';
import { KeyCap } from './KeyCap';

export function PauseOverlay() {
  return (
    <div className="screen dim">
      <h1 className="title">PAUSED</h1>
      <p className="hint">
        <KeyCap>Esc</KeyCap> resume &nbsp; <KeyCap>Q</KeyCap> quit to menu &nbsp; <KeyCap>M</KeyCap> mute
      </p>
    </div>
  );
}

export function GameOverScreen({ summary, newHighScore }: { summary: GameOverSummary; newHighScore: boolean }) {
  const stats: Array<[string, string]> = [
    ['Level', String(summary.level)],
    ['Keywords', String(summary.wordsCompleted)],
    ['Best combo', String(summary.bestCombo)],
    ['Accuracy', `${Math.round(summary.accuracy * 100)}%`],
    ['Time', `${Math.floor(summary.durationSeconds / 60)}:${String(summary.durationSeconds % 60).padStart(2, '0')}`],
  ];
  return (
    <div className="screen dim">
      <h1 className="title gameover">GAME OVER</h1>
      {newHighScore && <div className="new-best">NEW HIGH SCORE!</div>}
      <div className="final-score">{summary.score.toLocaleString()}</div>
      <dl className="stats">
        {stats.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <p className="hint">
        <KeyCap>Enter</KeyCap> play again &nbsp; <KeyCap>Esc</KeyCap> menu
      </p>
    </div>
  );
}
