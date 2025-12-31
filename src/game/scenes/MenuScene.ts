import * as Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, GameCallbacks } from "../config/gameConfig";

interface LeaderboardEntry {
  player_name: string;
  score: number;
}

export class MenuScene extends Phaser.Scene {
  private stars: Phaser.GameObjects.Image[] = [];
  private nebulae: Phaser.GameObjects.Image[] = [];
  private playerName: string = "";
  private nameInput?: HTMLInputElement;
  private callbacks?: GameCallbacks;
  private leaderboard: LeaderboardEntry[] = [];

  constructor() {
    super({ key: "MenuScene" });
  }

  init(data: { callbacks?: GameCallbacks; playerName?: string }): void {
    this.callbacks = data.callbacks;
    this.playerName = data.playerName || "";
  }

  create(): void {
    // Create parallax background
    this.createBackground();

    // Title with glow
    const title = this.add.text(GAME_WIDTH / 2, 70, "DARTH'S DASH", {
      fontFamily: "Press Start 2P, monospace",
      fontSize: "56px",
      color: "#ff0000",
      stroke: "#000000",
      strokeThickness: 8,
    });
    title.setOrigin(0.5);

    // Glow effect
    this.tweens.add({
      targets: title,
      alpha: { from: 1, to: 0.8 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
    });

    // Subtitle
    const subtitle = this.add.text(
      GAME_WIDTH / 2,
      135,
      "A Side-Scrolling Adventure",
      {
        fontFamily: "Press Start 2P, monospace",
        fontSize: "18px",
        color: "#00ffff",
      }
    );
    subtitle.setOrigin(0.5);

    // Credits
    const credits = this.add.text(
      GAME_WIDTH / 2,
      170,
      "Designed by Tatus and Jacob",
      {
        fontFamily: "Press Start 2P, monospace",
        fontSize: "16px",
        color: "#ffff00",
      }
    );
    credits.setOrigin(0.5);

    // Character previews
    this.createCharacterPreviews();

    // Instructions panel
    this.createInstructionsPanel();

    // Player name input
    this.createNameInput();

    // Leaderboard panel
    this.createLeaderboardPanel();

    // Start button
    const startText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 50,
      "PRESS ENTER TO START",
      {
        fontFamily: "Press Start 2P, monospace",
        fontSize: "24px",
        color: "#00ff00",
      }
    );
    startText.setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Input handling
    this.input.keyboard?.on("keydown-ENTER", () => {
      this.startGame();
    });

    this.input.keyboard?.on("keydown-SPACE", () => {
      this.startGame();
    });

    // Fetch leaderboard
    this.fetchLeaderboard();
  }

  private createBackground(): void {
    // Solid background
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0a0a2e).setOrigin(0);

    // Stars
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const star = this.add.image(x, y, "star");
      star.setScale(0.3 + Math.random() * 0.5);
      star.setAlpha(0.3 + Math.random() * 0.7);
      star.setDepth(-2);
      this.stars.push(star);
    }

    // Nebulae
    for (let i = 0; i < 5; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const nebula = this.add.image(x, y, "nebula");
      nebula.setScale(1 + Math.random() * 2);
      nebula.setAlpha(0.2 + Math.random() * 0.2);
      nebula.setDepth(-1);
      this.nebulae.push(nebula);
    }
  }

  private createCharacterPreviews(): void {
    // Vader
    const vader = this.add.image(200, 300, "vader");
    vader.setScale(2.5);

    this.tweens.add({
      targets: vader,
      y: vader.y - 10,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Lightsaber slash effect
    const slash = this.add.image(250, 280, "saberSlash");
    slash.setScale(0.8);
    slash.setAlpha(0);

    this.tweens.add({
      targets: slash,
      alpha: { from: 0, to: 1 },
      scaleX: { from: 0.5, to: 1 },
      duration: 200,
      yoyo: true,
      repeat: -1,
      repeatDelay: 2000,
    });

    // Baby Yoda enemy
    const yoda = this.add.image(320, 320, "babyYodaCar");
    yoda.setScale(1.5);

    this.tweens.add({
      targets: yoda,
      x: yoda.x + 40,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Flying droid
    const droid = this.add.image(280, 220, "droid");
    droid.setScale(1.2);

    this.tweens.add({
      targets: droid,
      y: droid.y - 20,
      x: droid.x + 30,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private createInstructionsPanel(): void {
    // Panel background
    const panelX = 170;
    const panelY = 450;

    this.add.rectangle(panelX, panelY, 300, 220, 0x000000, 0.7)
      .setStrokeStyle(3, 0x00ffff);

    this.add.text(panelX, panelY - 85, "CONTROLS", {
      fontFamily: "Press Start 2P, monospace",
      fontSize: "20px",
      color: "#00ffff",
    }).setOrigin(0.5);

    const instructions = [
      { key: "ARROWS", action: "Move" },
      { key: "SPACE", action: "Jump (2x)" },
      { key: "X / Z", action: "Lightsaber" },
      { key: "ESC", action: "Pause" },
    ];

    instructions.forEach((inst, i) => {
      this.add.text(panelX - 120, panelY - 45 + i * 38, inst.key, {
        fontFamily: "Press Start 2P, monospace",
        fontSize: "14px",
        color: "#ffff00",
      });
      this.add.text(panelX + 30, panelY - 45 + i * 38, inst.action, {
        fontFamily: "Press Start 2P, monospace",
        fontSize: "14px",
        color: "#ffffff",
      });
    });
  }

  private createNameInput(): void {
    const inputX = GAME_WIDTH / 2;
    const inputY = 580;

    this.add.text(inputX, inputY - 40, "ENTER YOUR NAME:", {
      fontFamily: "Press Start 2P, monospace",
      fontSize: "18px",
      color: "#ffff00",
    }).setOrigin(0.5);

    // Create HTML input element
    const canvas = this.game.canvas;
    const canvasRect = canvas.getBoundingClientRect();

    this.nameInput = document.createElement("input");
    this.nameInput.type = "text";
    this.nameInput.maxLength = 12;
    this.nameInput.value = this.playerName;
    this.nameInput.placeholder = "PLAYER";
    this.nameInput.style.cssText = `
      position: absolute;
      left: ${canvasRect.left + (inputX - 130) * (canvasRect.width / GAME_WIDTH)}px;
      top: ${canvasRect.top + inputY * (canvasRect.height / GAME_HEIGHT)}px;
      width: 260px;
      height: 45px;
      font-family: 'Press Start 2P', monospace;
      font-size: 18px;
      text-align: center;
      background: #1a1a2e;
      border: 3px solid #00ffff;
      color: #ffffff;
      outline: none;
      text-transform: uppercase;
      border-radius: 8px;
    `;

    this.nameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.startGame();
      }
    });

    document.body.appendChild(this.nameInput);

    // Clean up on scene change
    this.events.on("shutdown", () => {
      if (this.nameInput && this.nameInput.parentNode) {
        this.nameInput.parentNode.removeChild(this.nameInput);
      }
    });
  }

  private createLeaderboardPanel(): void {
    const panelX = GAME_WIDTH - 220;
    const panelY = 400;

    // Panel background
    this.add.rectangle(panelX, panelY, 360, 400, 0x000000, 0.7)
      .setStrokeStyle(3, 0xff0000);

    this.add.text(panelX, panelY - 170, "TOP SCORES", {
      fontFamily: "Press Start 2P, monospace",
      fontSize: "22px",
      color: "#ff0000",
    }).setOrigin(0.5);

    // Placeholder text (will be replaced when data loads)
    this.add.text(panelX, panelY, "Loading...", {
      fontFamily: "Press Start 2P, monospace",
      fontSize: "16px",
      color: "#888888",
    }).setOrigin(0.5).setName("leaderboardLoading");
  }

  private async fetchLeaderboard(): Promise<void> {
    try {
      const response = await fetch("/api/score");
      if (response.ok) {
        const data = await response.json();
        this.leaderboard = data.topScores || [];
        this.displayLeaderboard();
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    }
  }

  private displayLeaderboard(): void {
    const panelX = GAME_WIDTH - 220;
    const panelY = 400;

    // Remove loading text
    const loadingText = this.children.getByName("leaderboardLoading");
    if (loadingText) {
      loadingText.destroy();
    }

    if (this.leaderboard.length === 0) {
      this.add.text(panelX, panelY, "No scores yet!", {
        fontFamily: "Press Start 2P, monospace",
        fontSize: "16px",
        color: "#888888",
      }).setOrigin(0.5);
      return;
    }

    this.leaderboard.slice(0, 8).forEach((entry, i) => {
      const y = panelY - 130 + i * 38;
      const rank = i + 1;
      const color = rank <= 3 ? ["#ffd700", "#c0c0c0", "#cd7f32"][i] : "#ffffff";

      // Rank
      this.add.text(panelX - 150, y, `${rank}.`, {
        fontFamily: "Press Start 2P, monospace",
        fontSize: "14px",
        color: color,
      });

      // Name (truncated)
      const name = entry.player_name.slice(0, 6).toUpperCase();
      this.add.text(panelX - 110, y, name, {
        fontFamily: "Press Start 2P, monospace",
        fontSize: "14px",
        color: color,
      });

      // Score
      this.add.text(panelX + 140, y, entry.score.toLocaleString(), {
        fontFamily: "Press Start 2P, monospace",
        fontSize: "14px",
        color: color,
      }).setOrigin(1, 0);
    });
  }

  private startGame(): void {
    const name = this.nameInput?.value.trim().toUpperCase() || "PLAYER";

    // Save player name via callback
    if (this.callbacks?.onNameChange) {
      this.callbacks.onNameChange(name);
    }

    // Clean up input
    if (this.nameInput && this.nameInput.parentNode) {
      this.nameInput.parentNode.removeChild(this.nameInput);
    }

    // Start game with player name
    this.scene.start("GameScene", {
      playerName: name,
      callbacks: this.callbacks
    });
  }

  update(): void {
    // Animate stars
    this.stars.forEach((star, index) => {
      star.x -= 0.1 + (index % 3) * 0.05;
      if (star.x < -10) {
        star.x = GAME_WIDTH + 10;
      }
    });

    // Animate nebulae (slower)
    this.nebulae.forEach((nebula, index) => {
      nebula.x -= 0.02 + (index % 2) * 0.01;
      if (nebula.x < -100) {
        nebula.x = GAME_WIDTH + 100;
      }
    });
  }
}
