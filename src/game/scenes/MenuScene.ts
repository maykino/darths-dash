import * as Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/gameConfig";

export class MenuScene extends Phaser.Scene {
  private stars: Phaser.GameObjects.Image[] = [];

  constructor() {
    super({ key: "MenuScene" });
  }

  create(): void {
    // Create starfield background
    this.createStarfield();

    // Title
    const title = this.add.text(GAME_WIDTH / 2, 80, "DARTH'S DASH", {
      fontFamily: "Press Start 2P, monospace",
      fontSize: "32px",
      color: "#ff0000",
      stroke: "#000000",
      strokeThickness: 4,
    });
    title.setOrigin(0.5);

    // Add glow effect to title
    this.tweens.add({
      targets: title,
      alpha: { from: 1, to: 0.7 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    // Subtitle
    const subtitle = this.add.text(
      GAME_WIDTH / 2,
      130,
      "Dodge the Baby Yodas!",
      {
        fontFamily: "Press Start 2P, monospace",
        fontSize: "12px",
        color: "#9acd32",
      }
    );
    subtitle.setOrigin(0.5);

    // Show Vader preview
    const vaderPreview = this.add.image(GAME_WIDTH / 2, 220, "vader");
    vaderPreview.setScale(2);

    // Floating animation for vader
    this.tweens.add({
      targets: vaderPreview,
      y: vaderPreview.y - 10,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Show Baby Yoda preview
    const yodaPreview = this.add.image(GAME_WIDTH / 2 + 100, 200, "babyYoda");
    yodaPreview.setScale(1.5);

    // Flying animation for baby yoda
    this.tweens.add({
      targets: yodaPreview,
      x: yodaPreview.x + 30,
      y: yodaPreview.y - 15,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Instructions
    const instructions = [
      "ARROW KEYS - Move",
      "UP or SPACE - Jump",
      "ESC - Pause",
    ];

    instructions.forEach((text, index) => {
      this.add
        .text(GAME_WIDTH / 2, 300 + index * 25, text, {
          fontFamily: "Press Start 2P, monospace",
          fontSize: "10px",
          color: "#ffffff",
        })
        .setOrigin(0.5);
    });

    // Start prompt
    const startText = this.add.text(
      GAME_WIDTH / 2,
      400,
      "PRESS SPACE TO START",
      {
        fontFamily: "Press Start 2P, monospace",
        fontSize: "14px",
        color: "#ffff00",
      }
    );
    startText.setOrigin(0.5);

    // Blink effect
    this.tweens.add({
      targets: startText,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Input handling
    this.input.keyboard?.on("keydown-SPACE", () => {
      this.scene.start("GameScene");
    });

    // Also allow Enter key
    this.input.keyboard?.on("keydown-ENTER", () => {
      this.scene.start("GameScene");
    });
  }

  update(): void {
    // Move stars for parallax effect
    this.stars.forEach((star, index) => {
      star.x -= 0.2 + (index % 3) * 0.1;
      if (star.x < -10) {
        star.x = GAME_WIDTH + 10;
      }
    });
  }

  private createStarfield(): void {
    // Create random stars
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const star = this.add.image(x, y, "star");
      star.setScale(0.5 + Math.random() * 0.5);
      star.setAlpha(0.3 + Math.random() * 0.7);
      this.stars.push(star);
    }
  }
}
