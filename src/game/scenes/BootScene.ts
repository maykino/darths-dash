import * as Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload(): void {
    // Load minimal assets needed for the loading screen
    this.load.setPath("/assets/");
  }

  create(): void {
    // Set up any game-wide settings
    this.scale.refresh();

    // Move to preload scene
    this.scene.start("PreloadScene");
  }
}
