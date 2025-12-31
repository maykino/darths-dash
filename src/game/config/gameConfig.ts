import Phaser from "phaser";
import { BootScene } from "../scenes/BootScene";
import { PreloadScene } from "../scenes/PreloadScene";
import { MenuScene } from "../scenes/MenuScene";
import { GameScene } from "../scenes/GameScene";
import { GameOverScene } from "../scenes/GameOverScene";

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 450;

export const createGameConfig = (
  parent: HTMLElement,
  onGameOver?: (score: number) => void
): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent,
  backgroundColor: "#0a0a2e",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 800 },
      debug: false,
    },
  },
  scene: [BootScene, PreloadScene, MenuScene, GameScene, GameOverScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    pixelArt: true,
    antialias: false,
  },
  callbacks: {
    postBoot: (game) => {
      // Store callback in game registry for scenes to access
      if (onGameOver) {
        game.registry.set("onGameOver", onGameOver);
      }
    },
  },
});

// Game constants
export const PLAYER_SPEED = 200;
export const PLAYER_JUMP_VELOCITY = -400;
export const ENEMY_SPEED = 150;
export const CRYSTAL_POINTS = 100;
export const SURVIVAL_POINTS_PER_SECOND = 10;
