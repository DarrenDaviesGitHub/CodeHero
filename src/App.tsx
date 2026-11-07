import { useCallback, useEffect, useRef, useState } from 'react';
import { audio } from './game/audio';
import { gameBus, type GameOverSummary } from './game/events';
import { LANGUAGES, type Language } from './game/logic/keywords';
import type { SessionSnapshot } from './game/logic/session';
import { GameCanvas } from './ui/GameCanvas';
import { Hud } from './ui/Hud';
import { IntroScreen } from './ui/IntroScreen';
import { GameOverScreen, PauseOverlay } from './ui/Overlays';
import { loadHighScore, loadLanguages, loadMuted, saveHighScore, saveLanguages, saveMuted } from './ui/storage';

type Phase = 'intro' | 'playing' | 'paused' | 'gameover';

export default function App() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [ready, setReady] = useState(false);
  const [languages, setLanguages] = useState<Language[]>(loadLanguages);
  const [hud, setHud] = useState<SessionSnapshot | null>(null);
  const [summary, setSummary] = useState<GameOverSummary | null>(null);
  const [highScore, setHighScore] = useState(loadHighScore);
  const [newHighScore, setNewHighScore] = useState(false);
  const [muted, setMuted] = useState(loadMuted);
  const highScoreRef = useRef(highScore);

  useEffect(() => {
    audio.setMuted(muted);
    saveMuted(muted);
  }, [muted]);

  useEffect(() => saveLanguages(languages), [languages]);

  // Events coming from the Phaser scene.
  useEffect(() => {
    const offs = [
      gameBus.on('ready', () => setReady(true)),
      gameBus.on('hud', setHud),
      gameBus.on('gameOver', (s) => {
        const isBest = s.score > highScoreRef.current;
        if (isBest) {
          highScoreRef.current = s.score;
          setHighScore(s.score);
          saveHighScore(s.score);
        }
        setNewHighScore(isBest);
        setSummary(s);
        setPhase('gameover');
      }),
    ];
    return () => offs.forEach((off) => off());
  }, []);

  const start = useCallback(() => {
    if (!ready || languages.length === 0) return;
    audio.unlock();
    setSummary(null);
    setPhase('playing');
    gameBus.emit('start', { languages });
  }, [ready, languages]);

  const toMenu = useCallback(() => {
    audio.stopMusic();
    setHud(null);
    setPhase('intro');
    gameBus.emit('quit');
  }, []);

  const toggleLanguage = useCallback((lang: Language) => {
    setLanguages((cur) => (cur.includes(lang) ? cur.filter((l) => l !== lang) : LANGUAGES.filter((l) => l === lang || cur.includes(l))));
  }, []);

  // Keyboard controls for menus. Typing during play is handled by Phaser.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (phase !== 'playing' && key === 'm') {
        audio.unlock();
        setMuted((m) => !m);
        return;
      }
      switch (phase) {
        case 'intro': {
          if (key === 'enter') start();
          const n = Number(e.key);
          if (n >= 1 && n <= LANGUAGES.length) toggleLanguage(LANGUAGES[n - 1]);
          break;
        }
        case 'playing':
          if (key === 'escape') {
            setPhase('paused');
            audio.stopMusic();
            gameBus.emit('pause');
          }
          break;
        case 'paused':
          if (key === 'escape' || key === 'enter') {
            setPhase('playing');
            audio.startMusic();
            gameBus.emit('resume');
          } else if (key === 'q') toMenu();
          break;
        case 'gameover':
          if (key === 'enter') start();
          else if (key === 'escape') toMenu();
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, start, toMenu, toggleLanguage]);

  return (
    <main className={`app phase-${phase}`}>
      <GameCanvas />
      <div className="overlay">
        {phase === 'intro' && (
          <IntroScreen
            ready={ready}
            languages={languages}
            highScore={highScore}
            muted={muted}
            onToggleLanguage={toggleLanguage}
            onStart={start}
          />
        )}
        {(phase === 'playing' || phase === 'paused') && hud && <Hud hud={hud} />}
        {phase === 'paused' && <PauseOverlay />}
        {phase === 'gameover' && summary && <GameOverScreen summary={summary} newHighScore={newHighScore} />}
        {muted && <div className="muted-badge">MUTED</div>}
      </div>
    </main>
  );
}
