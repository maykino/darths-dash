import * as Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, GameStats, GameCallbacks } from "../config/gameConfig";
import { calculateScore, submitScoreUnified, CRYSTAL_POINTS, ENEMY_POINTS, CHECKPOINT_BONUS, COMPLETION_BONUS, DAMAGE_PENALTY, TIME_BONUS_BASE, TIME_PENALTY_PER_SECOND } from "@/lib/leaderboard";

interface VictoryData {
  stats: GameStats;
  playerName: string;
  callbacks?: GameCallbacks;
}

export class VictoryScene extends Phaser.Scene {
  private stats!: GameStats;
  private playerName: string = "PLAYER";
  private callbacks?: GameCallbacks;
  private stars: Phaser.GameObjects.Image[] = [];
  private isSubmitting: boolean = false;
  private rank: number = 0;
  private particles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  constructor() {
    super({ key: "VictoryScene" });
  }

  init(data: VictoryData): void {
    this.stats = data.stats || {
      crystals: 0,
      enemiesDefeated: 0,
      timeSeconds: 0,
      checkpointsReached: 0,
      damageTaken: 0,
      levelCompleted: true,
    };
    this.playerName = data.playerName || "PLAYER";
    this.callbacks = data.callbacks;
    this.isSubmitting = false;
    this.rank = 0;
  }

  create(): void {
    // Create background
    this.createBackground();

    // Victory celebration particles
    this.createCelebration();

    // Victory text
    const victoryText = this.add.text(
      GAME_WIDTH / 2,
      50,
      "VICTORY!",
      {
        fontFamily: "Press Start 2P, monospace",
        fontSize: "56px",
        color: "#ffd700",
        stroke: "#000000",
        strokeThickness: 8,
      }
    );
    victoryText.setOrigin(0.5);

    // Rainbow glow animation
    this.tweens.add({
      targets: victoryText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Level Complete subtitle
    this.add.text(GAME_WIDTH / 2, 105, "LEVEL COMPLETE!", {
      fontFamily: "Press Start 2P, monospace",
      fontSize: "16px",
      color: "#00ff00",
    }).setOrigin(0.5);

    // Player name
    this.add.text(GAME_WIDTH / 2, 135, this.playerName, {
      fontFamily: "Press Start 2P, monospace",
      fontSize: "14px",
      color: "#00ffff",
    }).setOrigin(0.5);

    // Calculate final score
    const finalScore = calculateScore(
      this.stats.crystals,
      this.stats.enemiesDefeated,
      this.stats.timeSeconds,
      this.stats.checkpointsReached,
      this.stats.damageTaken,
      true // Level completed!
    );

    // Stats panel
    this.createStatsPanel(finalScore);

    // Victorious Vader
    const vader = this.add.image(GAME_WIDTH / 2, 530, "vader");
    vader.setScale(3);

    this.tweens.add({
      targets: vader,
      y: vader.y - 10,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Lightsaber effect
    const saber = this.add.image(GAME_WIDTH / 2 + 50, 510, "saberSlash");
    saber.setScale(1.2);

    this.tweens.add({
      targets: saber,
      alpha: { from: 0.5, to: 1 },
      scaleX: { from: 1, to: 1.3 },
      duration: 300,
      yoyo: true,
      repeat: -1,
    });

    // Credits
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 90, "Designed by Tatus and Jacob", {
      fontFamily: "Press Start 2P, monospace",
      fontSize: "12px",
      color: "#ffff00",
    }).setOrigin(0.5);

    // Buttons
    this.createButtons();

    // Submit score
    this.submitGameScore(finalScore);
  }

  private createBackground(): void {
    // Gradient background
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0a0a2e).setOrigin(0);

    // Stars with more colors
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const star = this.add.image(x, y, "star");
      star.setScale(0.3 + Math.random() * 0.6);
      star.setAlpha(0.4 + Math.random() * 0.6);
      star.setTint(Phaser.Math.RND.pick([0xffffff, 0xffd700, 0x00ffff, 0xff00ff]));
      star.setDepth(-1);
      this.stars.push(star);
    }
  }

  private createCelebration(): void {
    // Create particle explosion effect
    if (this.textures.exists("particle")) {
      this.particles = this.add.particles(GAME_WIDTH / 2, 100, "particle", {
        speed: { min: 100, max: 300 },
        angle: { min: 0, max: 360 },
        scale: { start: 1, end: 0 },
        lifespan: 2000,
        tint: [0xffd700, 0xff0000, 0x00ff00, 0x00ffff, 0xff00ff],
        frequency: 100,
        quantity: 3,
      });
    }
  }

  private createStatsPanel(finalScore: number): void {
    const panelX = GAME_WIDTH / 2;
    const panelY = 300;

    // Panel background with gold border
    this.add.rectangle(panelX, panelY, 600, 280, 0x000000, 0.85)
      .setStrokeStyle(4, 0xffd700);

    // Final Score
    this.add.text(panelX, panelY - 110, "FINAL SCORE", {
      fontFamily: "Press Start 2P, monospace",
      fontSize: "12px",
      color: "#888888",
    }).setOrigin(0.5);

    const scoreText = this.add.text(panelX, panelY - 70, "0", {
      fontFamily: "Press Start 2P, monospace",
      fontSize: "40px",
      color: "#ffd700",
    }).setOrigin(0.5);

    // Animate score counting up
    this.tweens.addCounter({
      from: 0,
      to: finalScore,
      duration: 2000,
      ease: "Power2",
      onUpdate: (tween) => {
        const value = tween.getValue();
        if (value !== null) {
          scoreText.setText(Math.floor(value).toLocaleString());
        }
      },
    });

    // Stats breakdown - two columns
    const leftX = panelX - 250;
    const rightX = panelX + 20;
    const startY = panelY - 30;

    const timeBonus = Math.max(0, TIME_BONUS_BASE - this.stats.timeSeconds * TIME_PENALTY_PER_SECOND);

    const leftStats = [
      { label: "Crystals:", value: `${this.stats.crystals} x ${CRYSTAL_POINTS} = ${this.stats.crystals * CRYSTAL_POINTS}`, color: "#00ffff" },
      { label: "Enemies:", value: `${this.stats.enemiesDefeated} x ${ENEMY_POINTS} = ${this.stats.enemiesDefeated * ENEMY_POINTS}`, color: "#ff6600" },
      { label: "Checkpoints:", value: `${this.stats.checkpointsReached} x ${CHECKPOINT_BONUS} = ${this.stats.checkpointsReached * CHECKPOINT_BONUS}`, color: "#00ff00" },
    ];

    const rightStats = [
      { label: "Completion:", value: `+${COMPLETION_BONUS}`, color: "#ffd700" },
      { label: "Time Bonus:", value: `+${timeBonus}`, color: "#ffffff" },
      { label: "Damage:", value: `-${this.stats.damageTaken * DAMAGE_PENALTY}`, color: "#ff0000" },
    ];

    leftStats.forEach((stat, i) => {
      const y = startY + i * 28;
      this.add.text(leftX, y, stat.label, {
        fontFamily: "Press Start 2P, monospace",
        fontSize: "10px",
        color: "#888888",
      });
      this.add.text(leftX + 130, y, stat.value, {
        fontFamily: "Press Start 2P, monospace",
        fontSize: "10px",
        color: stat.color,
      });
    });

    rightStats.forEach((stat, i) => {
      const y = startY + i * 28;
      this.add.text(rightX, y, stat.label, {
        fontFamily: "Press Start 2P, monospace",
        fontSize: "10px",
        color: "#888888",
      });
      this.add.text(rightX + 130, y, stat.value, {
        fontFamily: "Press Start 2P, monospace",
        fontSize: "10px",
        color: stat.color,
      });
    });

    // Time display
    const minutes = Math.floor(this.stats.timeSeconds / 60);
    const seconds = Math.floor(this.stats.timeSeconds % 60);
    this.add.text(panelX, panelY + 80, `TIME: ${minutes}:${seconds.toString().padStart(2, "0")}`, {
      fontFamily: "Press Start 2P, monospace",
      fontSize: "14px",
      color: "#ffffff",
    }).setOrigin(0.5);

    // Rank display
    this.add.text(panelX, panelY + 115, "Submitting score...", {
      fontFamily: "Press Start 2P, monospace",
      fontSize: "12px",
      color: "#888888",
    }).setOrigin(0.5).setName("rankText");
  }

  private createButtons(): void {
    const isMobile = this.detectMobile();

    // Play Again button
    const playAgainLabel = isMobile ? "TAP - PLAY AGAIN" : "SPACE - PLAY AGAIN";
    const playAgainText = this.add.text(
      GAME_WIDTH / 2 - 180,
      GAME_HEIGHT - 45,
      playAgainLabel,
      {
        fontFamily: "Press Start 2P, monospace",
        fontSize: "12px",
        color: "#00ff00",
      }
    ).setOrigin(0.5);

    this.tweens.add({
      targets: playAgainText,
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Menu button
    const menuLabel = isMobile ? "MENU" : "M - MENU";
    this.add.text(
      GAME_WIDTH / 2 + 180,
      GAME_HEIGHT - 45,
      menuLabel,
      {
        fontFamily: "Press Start 2P, monospace",
        fontSize: "12px",
        color: "#888888",
      }
    ).setOrigin(0.5);

    // Input handling - keyboard
    this.input.keyboard?.on("keydown-SPACE", () => {
      this.cleanUp();
      this.scene.start("GameScene", {
        playerName: this.playerName,
        callbacks: this.callbacks
      });
    });

    this.input.keyboard?.on("keydown-ENTER", () => {
      this.cleanUp();
      this.scene.start("GameScene", {
        playerName: this.playerName,
        callbacks: this.callbacks
      });
    });

    this.input.keyboard?.on("keydown-M", () => {
      this.cleanUp();
      this.scene.start("MenuScene", {
        playerName: this.playerName,
        callbacks: this.callbacks
      });
    });

    // Touch handling
    if (isMobile) {
      // Play again button touch
      const playAgainBtn = this.add.rectangle(
        GAME_WIDTH / 2 - 180,
        GAME_HEIGHT - 45,
        300,
        60,
        0x00ff00,
        0.2
      ).setInteractive();
      playAgainBtn.on('pointerdown', () => {
        this.cleanUp();
        this.scene.start("GameScene", {
          playerName: this.playerName,
          callbacks: this.callbacks
        });
      });

      // Menu button touch
      const menuBtn = this.add.rectangle(
        GAME_WIDTH / 2 + 180,
        GAME_HEIGHT - 45,
        150,
        60,
        0x888888,
        0.2
      ).setInteractive();
      menuBtn.on('pointerdown', () => {
        this.cleanUp();
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

  private cleanUp(): void {
    if (this.particles) {
      this.particles.stop();
    }
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
        levelCompleted: true,
      });

      const rankText = this.children.getByName("rankText") as Phaser.GameObjects.Text;
      if (rankText) {
        if (result.success && result.rank) {
          this.rank = result.rank;
          rankText.setText(`YOUR RANK: #${this.rank}`);
          rankText.setColor("#ffd700");

          if (this.rank <= 3) {
            rankText.setFontSize(16);
            this.tweens.add({
              targets: rankText,
              scaleX: 1.1,
              scaleY: 1.1,
              duration: 500,
              yoyo: true,
              repeat: -1,
            });
          }
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
    // Animate stars with more movement
    this.stars.forEach((star, index) => {
      star.x -= 0.15 + (index % 4) * 0.05;
      star.y += Math.sin(this.time.now * 0.001 + index) * 0.1;
      if (star.x < -10) {
        star.x = GAME_WIDTH + 10;
        star.y = Phaser.Math.Between(0, GAME_HEIGHT);
      }
    });
  }
}
