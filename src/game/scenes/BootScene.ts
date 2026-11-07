import * as Phaser from 'phaser';
import { createTextures } from '../effects';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create(): void {
    createTextures(this);
    this.scene.start('play');
  }
}
