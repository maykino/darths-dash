import * as Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, GameStats, GameCallbacks } from "../config/gameConfig";
import { calculateScore, submitScoreUnified, CRYSTAL_POINTS, ENEMY_POINTS, CHECKPOINT_BONUS, COMPLETION_BONUS, DAMAGE_PENALTY } from "@/lib/supabase";

interface GameOverData {
  stats: GameStats;
  playerName: string;
  callbacks?: GameCallbacks;
}

export class GameOverScene extends Phaser.Scene {
  private stats!: GameStats;
  private playerName: string = "PLAYER";
  private callbacks?: GameCallbacks;
  private stars: Phaser.GameObjects.Image[] = [];
  private isSubmitting: boolean = false;
  private rank: number = 0;

  constructor() {
    super({ key: "GameOverScene" });
  }

  init(data: GameOverData): void {
    this.stats = data.stats || {
      crystals: 0,
      enemiesDefeated: 0,
      timeSeconds: 0,
      checkpointsReached: 0,
      damageTaken: 0,
      levelCompleted: false,
    };
    this.playerName = data.playerName || "PLAYER";
    this.callbacks = data.callbacks;
    this.isSubmitting = false;
    this.rank = 0;
  }

  create(): void {
    // Create background
    this.createBackground();

    // Dark overlay
    this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.7
    );

    // Game Over text
    const gameOverText = this.add.text(
      GAME_WIDTH / 2,
      60,
      "GAME OVER",
      {
        fontFamily: "Press Start 2P, monospace",
        fontSize: "48px",
        color: "#ff0000",
        stroke: "#000000",
        strokeThickness: 6,
      }
    );
    gameOverText.setOrigin(0.5);

    // Pulsing animation
    this.tweens.add({
      targets: gameOverText,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Calculate final score
    const finalScore = calculateScore(
      this.stats.crystals,
      this.stats.enemiesDefeated,
      this.stats.timeSeconds,
      this.stats.checkpointsReached,
      this.stats.damageTaken,
      this.stats.levelCompleted
    );

    // Player name display
    this.add.text(GAME_WIDTH / 2, 120, this.playerName, {
      fontFamily: "Press Start 2P, monospace",
      fontSize: "16px",
      color: "#00ffff",
    }).setOrigin(0.5);

    // Stats panel
    this.createStatsPanel(finalScore);

    // Defeated Vader
    const vader = this.add.image(GAME_WIDTH / 2 - 150, 450, "vader");
    vader.setScale(2);
    vader.setTint(0x666666);
    vader.setAngle(-20);

    // Victory dance Baby Yodas
    const yoda1 = this.add.image(GAME_WIDTH / 2 + 100, 440, "babyYodaCar");
    const yoda2 = this.add.image(GAME_WIDTH / 2 + 180, 460, "babyYodaCar");
    yoda2.setFlipX(true);

    [yoda1, yoda2].forEach((yoda, index) => {
      this.tweens.add({
        targets: yoda,
        y: yoda.y - 15,
        angle: index === 0 ? 5 : -5,
        duration: 400,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });

    // Credits
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 100, "Designed by Tatus and Jacob", {
      fontFamily: "Press Start 2P, monospace",
      fontSize: "10px",
      color: "#ffff00",
    }).setOrigin(0.5);

    // Retry/Menu buttons
    this.createButtons();

    // Submit score
    this.submitGameScore(finalScore);
  }

  private createBackground(): void {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0a0a2e).setOrigin(0);

    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const star = this.add.image(x, y, "star");
      star.setScale(0.3 + Math.random() * 0.4);
      star.setAlpha(0.2 + Math.random() * 0.5);
      star.setDepth(-1);
      this.stars.push(star);
    }
  }

  private createStatsPanel(finalScore: number): void {
    const panelX = GAME_WIDTH / 2;
    const panelY = 280;

    // Panel background
    this.add.rectangle(panelX, panelY, 500, 240, 0x000000, 0.8)
      .setStrokeStyle(3, 0xff0000);

    // Final Score (large)
    this.add.text(panelX, panelY - 90, "FINAL SCORE", {
      fontFamily: "Press Start 2P, monospace",
      fontSize: "14px",
      color: "#888888",
    }).setOrigin(0.5);

    const scoreText = this.add.text(panelX, panelY - 55, finalScore.toLocaleString(), {
      fontFamily: "Press Start 2P, monospace",
      fontSize: "32px",
      color: "#ffff00",
    }).setOrigin(0.5);

    // Animate score counting up
    this.tweens.addCounter({
      from: 0,
      to: finalScore,
      duration: 1500,
      ease: "Power2",
      onUpdate: (tween) => {
        const value = tween.getValue();
        if (value !== null) {
          scoreText.setText(Math.floor(value).toLocaleString());
        }
      },
    });

    // Stats breakdown
    const statsY = panelY - 10;
    const leftX = panelX - 200;
    const rightX = panelX + 50;

    const statsData = [
      { label: "Crystals:", value: `${this.stats.crystals} x ${CRYSTAL_POINTS}`, color: "#00ffff" },
      { label: "Enemies:", value: `${this.stats.enemiesDefeated} x ${ENEMY_POINTS}`, color: "#ff6600" },
      { label: "Checkpoints:", value: `${this.stats.checkpointsReached} x ${CHECKPOINT_BONUS}`, color: "#00ff00" },
      { label: "Damage:", value: `-${this.stats.damageTaken} x ${DAMAGE_PENALTY}`, color: "#ff0000" },
      { label: "Time:", value: `${Math.floor(this.stats.timeSeconds)}s`, color: "#ffffff" },
    ];

    statsData.forEach((stat, i) => {
      const y = statsY + i * 22;
      this.add.text(leftX, y, stat.label, {
        fontFamily: "Press Start 2P, monospace",
        fontSize: "10px",
        color: "#888888",
      });
      this.add.text(rightX, y, stat.value, {
        fontFamily: "Press Start 2P, monospace",
        fontSize: "10px",
        color: stat.color,
      });
    });

    // Rank display (will be updated after submission)
    this.add.text(panelX, panelY + 100, "Submitting score...", {
      fontFamily: "Press Start 2P, monospace",
      fontSize: "10px",
      color: "#888888",
    }).setOrigin(0.5).setName("rankText");
  }

  private createButtons(): void {
    const isMobile = this.detectMobile();

    // Retry button
    const retryLabel = isMobile ? "TAP - RETRY" : "SPACE - RETRY";
    const retryText = this.add.text(
      GAME_WIDTH / 2 - 150,
      GAME_HEIGHT - 50,
      retryLabel,
      {
        fontFamily: "Press Start 2P, monospace",
        fontSize: "14px",
        color: "#00ff00",
      }
    ).setOrigin(0.5);

    this.tweens.add({
      targets: retryText,
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Menu button
    const menuLabel = isMobile ? "MENU" : "M - MENU";
    const menuText = this.add.text(
      GAME_WIDTH / 2 + 150,
      GAME_HEIGHT - 50,
      menuLabel,
      {
        fontFamily: "Press Start 2P, monospace",
        fontSize: "14px",
        color: "#888888",
      }
    ).setOrigin(0.5);

    // Input handling - keyboard
    this.input.keyboard?.on("keydown-SPACE", () => {
      this.scene.start("GameScene", {
        playerName: this.playerName,
        callbacks: this.callbacks
      });
    });

    this.input.keyboard?.on("keydown-ENTER", () => {
      this.scene.start("GameScene", {
        playerName: this.playerName,
        callbacks: this.callbacks
      });
    });

    this.input.keyboard?.on("keydown-M", () => {
      this.scene.start("MenuScene", {
        playerName: this.playerName,
        callbacks: this.callbacks
      });
    });

    // Touch handling
    if (isMobile) {
      // Retry button touch
      const retryBtn = this.add.rectangle(
        GAME_WIDTH / 2 - 150,
        GAME_HEIGHT - 50,
        250,
        60,
        0x00ff00,
        0.2
      ).setInteractive();
      retryBtn.on('pointerdown', () => {
        this.scene.start("GameScene", {
          playerName: this.playerName,
          callbacks: this.callbacks
        });
      });

      // Menu button touch
      const menuBtn = this.add.rectangle(
        GAME_WIDTH / 2 + 150,
        GAME_HEIGHT - 50,
        150,
        60,
        0x888888,
        0.2
      ).setInteractive();
      menuBtn.on('pointerdown', () => {
        this.scene.start("MenuScene", {
          playerName: this.playerName,
          callbacks: this.callbacks
        });
      });
    }
  }

  private detectMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0);
  }

  private async submitGameScore(score: number): Promise<void> {
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    try {
      const result = await submitScoreUnified({
        playerName: this.playerName,
        score: score,
        crystals: this.stats.crystals,
        enemiesDefeated: this.stats.enemiesDefeated,
        timeSeconds: Math.round(this.stats.timeSeconds),
        checkpointsReached: this.stats.checkpointsReached,
        damageTaken: this.stats.damageTaken,
        levelCompleted: this.stats.levelCompleted,
      });

      const rankText = this.children.getByName("rankText") as Phaser.GameObjects.Text;
      if (rankText) {
        if (result.success && result.rank) {
          this.rank = result.rank;
          rankText.setText(`RANK: #${this.rank}`);
          rankText.setColor("#ffd700");
        } else {
          rankText.setText("Score saved!");
          rankText.setColor("#00ff00");
        }
      }

      // Notify callback
      if (this.callbacks?.onGameOver) {
        this.callbacks.onGameOver(score);
      }
    } catch (error) {
      console.error("Failed to submit score:", error);
      const rankText = this.children.getByName("rankText") as Phaser.GameObjects.Text;
      if (rankText) {
        rankText.setText("Failed to save score");
        rankText.setColor("#ff0000");
      }
    }
  }

  update(): void {
    this.stars.forEach((star, index) => {
      star.x -= 0.1 + (index % 3) * 0.05;
      if (star.x < -10) {
        star.x = GAME_WIDTH + 10;
      }
    });
  }
}
