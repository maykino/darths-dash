import * as Phaser from "phaser";
import { GameCallbacks } from "../config/gameConfig";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload(): void {
    // Nothing to preload in boot scene
  }

  create(): void {
    // Set up any game-wide settings
    this.scale.refresh();

    // Get callbacks from registry
    const callbacks = this.registry.get("callbacks") as GameCallbacks | undefined;
    const playerName = callbacks?.getPlayerName?.() || "PLAYER";

    // Move to preload scene with data
    this.scene.start("PreloadScene", { callbacks, playerName });
  }
}
