import * as Phaser from "phaser";
import { BootScene } from "../scenes/BootScene";
import { PreloadScene } from "../scenes/PreloadScene";
import { MenuScene } from "../scenes/MenuScene";
import { GameScene } from "../scenes/GameScene";
import { GameOverScene } from "../scenes/GameOverScene";
import { VictoryScene } from "../scenes/VictoryScene";

// Fullscreen game dimensions
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// Level dimensions (scrolling world)
export const LEVEL_WIDTH = 8000;
export const LEVEL_HEIGHT = 720;

// Player constants
export const PLAYER_SPEED = 280;
export const PLAYER_JUMP_VELOCITY = -550; // Increased for better platform reach
export const PLAYER_DOUBLE_JUMP_VELOCITY = -450; // Increased for better platform reach
export const COYOTE_TIME = 120; // ms
export const JUMP_BUFFER_TIME = 150; // ms
export const PLAYER_MAX_HEALTH = 3;

// Combat constants
export const SABER_DAMAGE = 1;
export const SABER_COOLDOWN = 400; // ms
export const SABER_RANGE = 120; // 50% longer range
export const SABER_ARC = 120; // degrees

// Enemy constants
export const PATROL_ENEMY_SPEED = 100;
export const FLYING_ENEMY_SPEED = 150;
export const ENEMY_HEALTH = 1;

// Scoring constants
export const CRYSTAL_POINTS = 150;
export const ENEMY_POINTS = 200;
export const TIME_BONUS_BASE = 5000;
export const TIME_PENALTY_PER_SECOND = 5;
export const DAMAGE_PENALTY = 100;
export const CHECKPOINT_BONUS = 500;
export const COMPLETION_BONUS = 10000;

// Camera settings
export const CAMERA_LERP = 0.08;
export const CAMERA_LOOKAHEAD = 150;
export const PLAYER_SCREEN_X_PERCENT = 0.35; // Player stays 35% from left

// Visual settings
export const PARALLAX_SPEEDS = {
  stars: 0.1,
  nebula: 0.2,
  planets: 0.3,
  mountains: 0.5,
};

// Colors
export const COLORS = {
  neonRed: 0xff0044,
  neonBlue: 0x00d4ff,
  neonPurple: 0xaa00ff,
  neonGreen: 0x00ff88,
  neonYellow: 0xffff00,
  darkBg: 0x0a0a1a,
  midBg: 0x151530,
  lightBg: 0x202050,
};

export interface GameCallbacks {
  onGameOver?: (score: number) => void;
  onVictory?: (score: number) => void;
  onNameChange?: (name: string) => void;
  getPlayerName?: () => string;
}

export interface GameStats {
  score: number;
  crystals: number;
  enemiesDefeated: number;
  timeSeconds: number;
  checkpointsReached: number;
  damageTaken: number;
  levelCompleted: boolean;
}

export const createGameConfig = (
  parent: HTMLElement,
  callbacks?: GameCallbacks
): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent,
  backgroundColor: COLORS.darkBg,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 1200 },
      debug: false,
    },
  },
  scene: [BootScene, PreloadScene, MenuScene, GameScene, GameOverScene, VictoryScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    pixelArt: false,
    antialias: true,
    roundPixels: false,
  },
  callbacks: {
    postBoot: (game) => {
      if (callbacks) {
        game.registry.set("callbacks", callbacks);
      }
    },
  },
});
