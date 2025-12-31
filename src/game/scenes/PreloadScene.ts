import * as Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/gameConfig";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: "PreloadScene" });
  }

  preload(): void {
    // Create loading bar
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(GAME_WIDTH / 2 - 160, GAME_HEIGHT / 2 - 25, 320, 50);

    const loadingText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 50,
      "Loading...",
      {
        fontFamily: "Press Start 2P, monospace",
        fontSize: "16px",
        color: "#ff0000",
      }
    );
    loadingText.setOrigin(0.5, 0.5);

    // Update progress bar
    this.load.on("progress", (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xff0000, 1);
      progressBar.fillRect(
        GAME_WIDTH / 2 - 150,
        GAME_HEIGHT / 2 - 15,
        300 * value,
        30
      );
    });

    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Load game assets
    this.load.setPath("/assets/sprites/");

    // Generate placeholder graphics for now (will be replaced with actual sprites)
    this.createPlaceholderAssets();
  }

  create(): void {
    // Create animations
    this.createAnimations();

    // Go to menu
    this.scene.start("MenuScene");
  }

  private createPlaceholderAssets(): void {
    // Create Darth Vader placeholder (will be replaced with actual sprite)
    const vaderGraphics = this.make.graphics({ x: 0, y: 0 });

    // Body (black cape/robe)
    vaderGraphics.fillStyle(0x1a1a1a);
    vaderGraphics.fillRoundedRect(8, 20, 32, 40, 4);

    // Helmet
    vaderGraphics.fillStyle(0x2a2a2a);
    vaderGraphics.fillRoundedRect(10, 4, 28, 20, 8);

    // Helmet details
    vaderGraphics.fillStyle(0x3a3a3a);
    vaderGraphics.fillTriangle(24, 8, 18, 18, 30, 18);

    // Eyes (red glow for cartoon effect)
    vaderGraphics.fillStyle(0xff0000);
    vaderGraphics.fillCircle(18, 12, 3);
    vaderGraphics.fillCircle(30, 12, 3);

    // Chest panel
    vaderGraphics.fillStyle(0x444444);
    vaderGraphics.fillRect(18, 28, 12, 8);
    vaderGraphics.fillStyle(0xff0000);
    vaderGraphics.fillRect(20, 30, 3, 2);
    vaderGraphics.fillStyle(0x00ff00);
    vaderGraphics.fillRect(25, 30, 3, 2);

    // Lightsaber (held)
    vaderGraphics.fillStyle(0x888888);
    vaderGraphics.fillRect(40, 25, 4, 12);
    vaderGraphics.fillStyle(0xff0000);
    vaderGraphics.fillRect(41, 10, 2, 16);

    vaderGraphics.generateTexture("vader", 48, 64);
    vaderGraphics.destroy();

    // Create Baby Yoda in car placeholder
    const yodaGraphics = this.make.graphics({ x: 0, y: 0 });

    // Hover car body
    yodaGraphics.fillStyle(0x666666);
    yodaGraphics.fillRoundedRect(4, 24, 56, 20, 6);

    // Car details
    yodaGraphics.fillStyle(0x444444);
    yodaGraphics.fillEllipse(32, 44, 48, 8);

    // Baby Yoda body
    yodaGraphics.fillStyle(0x9acd32);
    yodaGraphics.fillRoundedRect(20, 8, 24, 20, 8);

    // Baby Yoda ears
    yodaGraphics.fillStyle(0x9acd32);
    yodaGraphics.fillEllipse(12, 12, 12, 6);
    yodaGraphics.fillEllipse(52, 12, 12, 6);

    // Baby Yoda eyes (big and cute)
    yodaGraphics.fillStyle(0x000000);
    yodaGraphics.fillCircle(26, 14, 5);
    yodaGraphics.fillCircle(38, 14, 5);
    yodaGraphics.fillStyle(0xffffff);
    yodaGraphics.fillCircle(27, 13, 2);
    yodaGraphics.fillCircle(39, 13, 2);

    // Baby Yoda robe
    yodaGraphics.fillStyle(0x8b7355);
    yodaGraphics.fillRoundedRect(22, 22, 20, 8, 2);

    // Hover effect glow
    yodaGraphics.fillStyle(0x00ffff, 0.5);
    yodaGraphics.fillEllipse(32, 48, 40, 6);

    yodaGraphics.generateTexture("babyYoda", 64, 52);
    yodaGraphics.destroy();

    // Create crystal collectible
    const crystalGraphics = this.make.graphics({ x: 0, y: 0 });
    crystalGraphics.fillStyle(0x00bfff);
    crystalGraphics.fillTriangle(12, 0, 0, 16, 24, 16);
    crystalGraphics.fillTriangle(0, 16, 24, 16, 12, 28);
    crystalGraphics.fillStyle(0x87ceeb, 0.6);
    crystalGraphics.fillTriangle(12, 4, 4, 14, 12, 14);
    crystalGraphics.generateTexture("crystal", 24, 28);
    crystalGraphics.destroy();

    // Create ground tiles
    const groundGraphics = this.make.graphics({ x: 0, y: 0 });
    groundGraphics.fillStyle(0x4a4a4a);
    groundGraphics.fillRect(0, 0, 64, 32);
    groundGraphics.fillStyle(0x3a3a3a);
    groundGraphics.fillRect(0, 0, 64, 4);
    groundGraphics.lineStyle(1, 0x5a5a5a);
    groundGraphics.strokeRect(0, 4, 32, 28);
    groundGraphics.strokeRect(32, 4, 32, 28);
    groundGraphics.generateTexture("ground", 64, 32);
    groundGraphics.destroy();

    // Create platform
    const platformGraphics = this.make.graphics({ x: 0, y: 0 });
    platformGraphics.fillStyle(0x654321);
    platformGraphics.fillRoundedRect(0, 0, 96, 20, 4);
    platformGraphics.fillStyle(0x8b4513);
    platformGraphics.fillRect(4, 4, 88, 4);
    platformGraphics.generateTexture("platform", 96, 20);
    platformGraphics.destroy();

    // Create background stars
    const starGraphics = this.make.graphics({ x: 0, y: 0 });
    starGraphics.fillStyle(0xffffff);
    starGraphics.fillCircle(2, 2, 2);
    starGraphics.generateTexture("star", 4, 4);
    starGraphics.destroy();
  }

  private createAnimations(): void {
    // Player idle animation (single frame for now)
    this.anims.create({
      key: "vader-idle",
      frames: [{ key: "vader" }],
      frameRate: 1,
      repeat: -1,
    });

    // Player run animation (single frame for now)
    this.anims.create({
      key: "vader-run",
      frames: [{ key: "vader" }],
      frameRate: 8,
      repeat: -1,
    });

    // Baby Yoda flying animation
    this.anims.create({
      key: "yoda-fly",
      frames: [{ key: "babyYoda" }],
      frameRate: 4,
      repeat: -1,
    });

    // Crystal sparkle
    this.anims.create({
      key: "crystal-sparkle",
      frames: [{ key: "crystal" }],
      frameRate: 4,
      repeat: -1,
    });
  }
}
