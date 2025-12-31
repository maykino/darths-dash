import * as Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/gameConfig";

interface GameOverData {
  score: number;
}

export class GameOverScene extends Phaser.Scene {
  private score = 0;
  private stars: Phaser.GameObjects.Image[] = [];

  constructor() {
    super({ key: "GameOverScene" });
  }

  init(data: GameOverData): void {
    this.score = data.score || 0;
  }

  create(): void {
    // Create starfield
    this.createStarfield();

    // Dark overlay
    this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.5
    );

    // Game Over text
    const gameOverText = this.add.text(
      GAME_WIDTH / 2,
      100,
      "GAME OVER",
      {
        fontFamily: "Press Start 2P, monospace",
        fontSize: "40px",
        color: "#ff0000",
        stroke: "#000000",
        strokeThickness: 4,
      }
    );
    gameOverText.setOrigin(0.5);

    // Pulsing animation
    this.tweens.add({
      targets: gameOverText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Score display
    const scoreText = this.add.text(
      GAME_WIDTH / 2,
      180,
      `FINAL SCORE: ${this.score}`,
      {
        fontFamily: "Press Start 2P, monospace",
        fontSize: "20px",
        color: "#ffff00",
      }
    );
    scoreText.setOrigin(0.5);

    // Show defeated Vader
    const vaderSprite = this.add.image(GAME_WIDTH / 2, 270, "vader");
    vaderSprite.setScale(2);
    vaderSprite.setTint(0x888888);

    // Baby Yoda victory dance
    const yoda1 = this.add.image(GAME_WIDTH / 2 - 80, 260, "babyYoda");
    const yoda2 = this.add.image(GAME_WIDTH / 2 + 80, 260, "babyYoda");
    yoda2.setFlipX(true);

    // Victory dance animation
    [yoda1, yoda2].forEach((yoda, index) => {
      this.tweens.add({
        targets: yoda,
        y: yoda.y - 20,
        angle: index === 0 ? -10 : 10,
        duration: 300,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });

    // Retry button
    const retryButton = this.add.text(
      GAME_WIDTH / 2,
      360,
      "PRESS SPACE TO RETRY",
      {
        fontFamily: "Press Start 2P, monospace",
        fontSize: "14px",
        color: "#00ff00",
      }
    );
    retryButton.setOrigin(0.5);

    // Blink animation
    this.tweens.add({
      targets: retryButton,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Menu option
    const menuText = this.add.text(
      GAME_WIDTH / 2,
      400,
      "PRESS M FOR MENU",
      {
        fontFamily: "Press Start 2P, monospace",
        fontSize: "10px",
        color: "#888888",
      }
    );
    menuText.setOrigin(0.5);

    // Input handling
    this.input.keyboard?.on("keydown-SPACE", () => {
      this.scene.start("GameScene");
    });

    this.input.keyboard?.on("keydown-M", () => {
      this.scene.start("MenuScene");
    });

    this.input.keyboard?.on("keydown-ENTER", () => {
      this.scene.start("GameScene");
    });
  }

  update(): void {
    // Animate stars
    this.stars.forEach((star, index) => {
      star.x -= 0.2 + (index % 3) * 0.1;
      if (star.x < -10) {
        star.x = GAME_WIDTH + 10;
      }
    });
  }

  private createStarfield(): void {
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const star = this.add.image(x, y, "star");
      star.setScale(0.3 + Math.random() * 0.4);
      star.setAlpha(0.2 + Math.random() * 0.5);
      star.setDepth(-1);
      this.stars.push(star);
    }
  }
}
