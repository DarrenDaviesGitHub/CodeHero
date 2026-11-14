import { useEffect, useRef } from 'react';
import type * as Phaser from 'phaser';
import { createGame } from '../game/createGame';

export function GameCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let game: Phaser.Game | null = null;
    let cancelled = false;
    void createGame(host).then((g) => {
      if (cancelled) g.destroy(true);
      else {
        game = g;
        if (import.meta.env.DEV) (window as unknown as { __codeHeroGame?: Phaser.Game }).__codeHeroGame = g;
      }
    });
    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, []);

  return <div ref={hostRef} className="game-canvas" aria-hidden="true" />;
}
