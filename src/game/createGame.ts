import * as Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GAME_HEIGHT, GAME_WIDTH, PlayScene } from './scenes/PlayScene';

async function loadFonts(): Promise<void> {
  if (!document.fonts) return;
  await Promise.allSettled([
    document.fonts.load('900 48px Orbitron'),
    document.fonts.load('700 48px Orbitron'),
    document.fonts.load('700 26px "JetBrains Mono"'),
  ]);
}

export async function createGame(parent: HTMLElement): Promise<Phaser.Game> {
  await loadFonts();
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#05010f',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: { antialias: true },
    banner: false,
    audio: { noAudio: true },
    scene: [BootScene, PlayScene],
  });
}
