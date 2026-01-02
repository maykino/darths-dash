import * as Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, COLORS, GameCallbacks } from "../config/gameConfig";

interface PreloadData {
  callbacks?: GameCallbacks;
  playerName?: string;
}

export class PreloadScene extends Phaser.Scene {
  private callbacks?: GameCallbacks;
  private playerName: string = "PLAYER";

  constructor() {
    super({ key: "PreloadScene" });
  }

  init(data: PreloadData): void {
    this.callbacks = data.callbacks;
    this.playerName = data.playerName || "PLAYER";
  }

  preload(): void {
    // Create loading bar
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222244, 0.8);
    progressBox.fillRoundedRect(GAME_WIDTH / 2 - 200, GAME_HEIGHT / 2 - 20, 400, 40, 10);

    const loadingText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, "LOADING...", {
      fontFamily: "Arial, sans-serif",
      fontSize: "24px",
      color: "#00d4ff",
    });
    loadingText.setOrigin(0.5);

    this.load.on("progress", (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(COLORS.neonBlue, 1);
      progressBar.fillRoundedRect(GAME_WIDTH / 2 - 190, GAME_HEIGHT / 2 - 10, 380 * value, 20, 5);
    });

    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Generate all assets procedurally
    this.createAllAssets();
  }

  create(): void {
    this.createAnimations();
    this.scene.start("MenuScene", {
      callbacks: this.callbacks,
      playerName: this.playerName
    });
  }

  private createAllAssets(): void {
    this.createPlayerAssets();
    this.createEnemyAssets();
    this.createEnvironmentAssets();
    this.createEffectAssets();
    this.createUIAssets();
  }

  private createPlayerAssets(): void {
    // Darth Vader - Modern neon sci-fi style (64x80)
    const vader = this.make.graphics({ x: 0, y: 0 });

    // Body/Cape - dark with neon red trim
    vader.fillStyle(0x1a1a2e);
    vader.fillRoundedRect(16, 30, 32, 45, 6);

    // Cape glow outline
    vader.lineStyle(2, COLORS.neonRed, 0.6);
    vader.strokeRoundedRect(16, 30, 32, 45, 6);

    // Helmet - iconic shape
    vader.fillStyle(0x2a2a3e);
    vader.fillRoundedRect(14, 8, 36, 28, 10);

    // Helmet visor/eyes - menacing red glow
    vader.fillStyle(COLORS.neonRed);
    vader.fillTriangle(32, 18, 22, 28, 42, 28);

    // Eye slits with glow
    vader.fillStyle(COLORS.neonRed);
    vader.fillRect(22, 20, 8, 4);
    vader.fillRect(34, 20, 8, 4);

    // Chest panel with neon lights
    vader.fillStyle(0x333344);
    vader.fillRoundedRect(22, 38, 20, 14, 3);
    vader.fillStyle(COLORS.neonRed);
    vader.fillCircle(27, 43, 3);
    vader.fillStyle(COLORS.neonGreen);
    vader.fillCircle(32, 43, 3);
    vader.fillStyle(COLORS.neonBlue);
    vader.fillCircle(37, 43, 3);

    // Belt
    vader.fillStyle(0x444455);
    vader.fillRect(18, 55, 28, 6);
    vader.fillStyle(0x666677);
    vader.fillRect(28, 54, 8, 8);

    // Legs
    vader.fillStyle(0x1a1a2e);
    vader.fillRect(20, 62, 10, 16);
    vader.fillRect(34, 62, 10, 16);

    // Boots with glow
    vader.fillStyle(0x222233);
    vader.fillRoundedRect(18, 72, 14, 8, 2);
    vader.fillRoundedRect(32, 72, 14, 8, 2);

    vader.generateTexture("vader", 64, 80);
    vader.destroy();

    // Vader jumping frame
    const vaderJump = this.make.graphics({ x: 0, y: 0 });
    vaderJump.fillStyle(0x1a1a2e);
    vaderJump.fillRoundedRect(16, 30, 32, 40, 6);
    vaderJump.lineStyle(2, COLORS.neonRed, 0.6);
    vaderJump.strokeRoundedRect(16, 30, 32, 40, 6);
    vaderJump.fillStyle(0x2a2a3e);
    vaderJump.fillRoundedRect(14, 8, 36, 28, 10);
    vaderJump.fillStyle(COLORS.neonRed);
    vaderJump.fillTriangle(32, 18, 22, 28, 42, 28);
    vaderJump.fillRect(22, 20, 8, 4);
    vaderJump.fillRect(34, 20, 8, 4);
    vaderJump.fillStyle(0x333344);
    vaderJump.fillRoundedRect(22, 38, 20, 14, 3);
    vaderJump.fillStyle(COLORS.neonRed);
    vaderJump.fillCircle(27, 43, 3);
    vaderJump.fillStyle(COLORS.neonGreen);
    vaderJump.fillCircle(32, 43, 3);
    vaderJump.fillStyle(COLORS.neonBlue);
    vaderJump.fillCircle(37, 43, 3);
    // Legs bent
    vaderJump.fillStyle(0x1a1a2e);
    vaderJump.fillRect(18, 58, 12, 10);
    vaderJump.fillRect(34, 58, 12, 10);
    vaderJump.fillStyle(0x222233);
    vaderJump.fillRoundedRect(16, 64, 14, 8, 2);
    vaderJump.fillRoundedRect(34, 64, 14, 8, 2);
    vaderJump.generateTexture("vader_jump", 64, 80);
    vaderJump.destroy();

    // Lightsaber (separate for animation)
    const saber = this.make.graphics({ x: 0, y: 0 });
    // Handle
    saber.fillStyle(0x555566);
    saber.fillRoundedRect(0, 40, 8, 24, 2);
    saber.fillStyle(0x777788);
    saber.fillRect(2, 42, 4, 4);
    saber.fillRect(2, 50, 4, 4);
    // Blade with glow
    saber.fillStyle(0xff0000, 0.3);
    saber.fillRect(-2, 0, 12, 42);
    saber.fillStyle(COLORS.neonRed, 0.6);
    saber.fillRoundedRect(1, 2, 6, 38, 3);
    saber.fillStyle(0xffffff, 0.8);
    saber.fillRoundedRect(2, 4, 4, 34, 2);
    saber.generateTexture("lightsaber", 16, 64);
    saber.destroy();

    // Saber slash effect
    const slash = this.make.graphics({ x: 0, y: 0 });
    slash.lineStyle(6, COLORS.neonRed, 0.8);
    slash.beginPath();
    slash.arc(60, 60, 50, Phaser.Math.DegToRad(-60), Phaser.Math.DegToRad(60), false);
    slash.strokePath();
    slash.lineStyle(3, 0xffffff, 0.9);
    slash.beginPath();
    slash.arc(60, 60, 50, Phaser.Math.DegToRad(-50), Phaser.Math.DegToRad(50), false);
    slash.strokePath();
    slash.generateTexture("saber_slash", 120, 120);
    slash.destroy();
  }

  private createEnemyAssets(): void {
    // Baby Yoda in hover car (patrol enemy)
    const yodaCar = this.make.graphics({ x: 0, y: 0 });

    // Hover car body - sleek sci-fi design
    yodaCar.fillStyle(0x444466);
    yodaCar.fillRoundedRect(4, 30, 72, 24, 8);
    yodaCar.lineStyle(2, COLORS.neonBlue, 0.6);
    yodaCar.strokeRoundedRect(4, 30, 72, 24, 8);

    // Hover glow
    yodaCar.fillStyle(COLORS.neonBlue, 0.3);
    yodaCar.fillEllipse(40, 58, 60, 12);
    yodaCar.fillStyle(COLORS.neonBlue, 0.6);
    yodaCar.fillEllipse(40, 56, 40, 6);

    // Baby Yoda
    yodaCar.fillStyle(0x88aa66);
    yodaCar.fillRoundedRect(26, 8, 28, 26, 10);

    // Ears
    yodaCar.fillStyle(0x88aa66);
    yodaCar.fillEllipse(14, 16, 16, 8);
    yodaCar.fillEllipse(66, 16, 16, 8);
    yodaCar.fillStyle(0x99bb77);
    yodaCar.fillEllipse(14, 16, 10, 5);
    yodaCar.fillEllipse(66, 16, 10, 5);

    // Eyes - big and cute
    yodaCar.fillStyle(0x000000);
    yodaCar.fillCircle(34, 18, 6);
    yodaCar.fillCircle(46, 18, 6);
    yodaCar.fillStyle(0xffffff);
    yodaCar.fillCircle(35, 17, 3);
    yodaCar.fillCircle(47, 17, 3);

    // Robe
    yodaCar.fillStyle(0x8b7355);
    yodaCar.fillRoundedRect(28, 28, 24, 10, 3);

    yodaCar.generateTexture("yoda_car", 80, 64);
    yodaCar.destroy();

    // Flying droid enemy
    const droid = this.make.graphics({ x: 0, y: 0 });
    droid.fillStyle(0x555577);
    droid.fillCircle(24, 24, 20);
    droid.lineStyle(2, COLORS.neonPurple, 0.8);
    droid.strokeCircle(24, 24, 20);
    // Eye
    droid.fillStyle(COLORS.neonRed);
    droid.fillCircle(24, 24, 8);
    droid.fillStyle(0xffffff, 0.5);
    droid.fillCircle(22, 22, 3);
    // Antenna
    droid.fillStyle(0x666688);
    droid.fillRect(22, 0, 4, 8);
    droid.fillStyle(COLORS.neonRed);
    droid.fillCircle(24, 4, 4);
    droid.generateTexture("droid", 48, 48);
    droid.destroy();

    // Laser turret (stationary hazard)
    const turret = this.make.graphics({ x: 0, y: 0 });
    turret.fillStyle(0x444455);
    turret.fillRect(8, 32, 32, 32);
    turret.fillStyle(0x555566);
    turret.fillRoundedRect(12, 16, 24, 20, 4);
    turret.fillStyle(COLORS.neonRed);
    turret.fillCircle(24, 24, 6);
    turret.lineStyle(2, COLORS.neonRed, 0.5);
    turret.strokeRect(8, 32, 32, 32);
    turret.generateTexture("turret", 48, 64);
    turret.destroy();

    // Laser beam
    const laser = this.make.graphics({ x: 0, y: 0 });
    laser.fillStyle(COLORS.neonRed, 0.3);
    laser.fillRect(0, 0, 200, 12);
    laser.fillStyle(COLORS.neonRed, 0.7);
    laser.fillRect(0, 3, 200, 6);
    laser.fillStyle(0xffffff, 0.9);
    laser.fillRect(0, 5, 200, 2);
    laser.generateTexture("laser_beam", 200, 12);
    laser.destroy();

    // Spike hazard
    const spike = this.make.graphics({ x: 0, y: 0 });
    spike.fillStyle(0x666677);
    spike.fillTriangle(16, 0, 0, 40, 32, 40);
    spike.lineStyle(2, COLORS.neonRed, 0.6);
    spike.strokeTriangle(16, 0, 0, 40, 32, 40);
    spike.generateTexture("spike", 32, 40);
    spike.destroy();

    // Flying witch (Baba Yaga) on broomstick
    const witch = this.make.graphics({ x: 0, y: 0 });
    // Broomstick
    witch.fillStyle(0x8B4513);
    witch.fillRect(4, 36, 56, 6);
    witch.fillStyle(0x654321);
    witch.fillRect(52, 32, 12, 14);
    // Broom bristles
    witch.fillStyle(0xDAA520);
    witch.fillTriangle(64, 32, 64, 46, 80, 39);
    // Witch body/robe - dark purple
    witch.fillStyle(0x2a1a3a);
    witch.fillRoundedRect(16, 18, 24, 22, 4);
    // Witch head - green skin
    witch.fillStyle(0x5a8a4a);
    witch.fillCircle(28, 12, 10);
    // Witch hat - pointy black hat
    witch.fillStyle(0x1a1a2a);
    witch.fillTriangle(28, -8, 16, 8, 40, 8);
    witch.fillRect(14, 6, 28, 6);
    // Hat band with neon glow
    witch.fillStyle(COLORS.neonPurple);
    witch.fillRect(16, 6, 24, 3);
    // Witch face - glowing eyes and crooked nose
    witch.fillStyle(COLORS.neonGreen);
    witch.fillCircle(24, 10, 3);
    witch.fillCircle(32, 10, 3);
    witch.fillStyle(0x4a7a3a);
    witch.fillTriangle(28, 12, 26, 18, 30, 18);
    // Witch hair - stringy
    witch.fillStyle(0x333333);
    witch.fillRect(18, 4, 3, 14);
    witch.fillRect(35, 4, 3, 14);
    // Arms holding broom
    witch.fillStyle(0x5a8a4a);
    witch.fillRect(12, 28, 8, 4);
    witch.fillRect(36, 28, 8, 4);
    // Magical trail/glow
    witch.fillStyle(COLORS.neonPurple, 0.4);
    witch.fillCircle(8, 39, 8);
    witch.fillCircle(0, 39, 5);
    witch.generateTexture("witch", 80, 48);
    witch.destroy();
  }

  private createEnvironmentAssets(): void {
    // Ground tile - metallic sci-fi platform
    const ground = this.make.graphics({ x: 0, y: 0 });
    ground.fillStyle(0x2a2a3e);
    ground.fillRect(0, 0, 64, 64);
    ground.fillStyle(0x3a3a4e);
    ground.fillRect(0, 0, 64, 8);
    ground.lineStyle(1, COLORS.neonBlue, 0.3);
    ground.strokeRect(0, 8, 32, 56);
    ground.strokeRect(32, 8, 32, 56);
    ground.fillStyle(COLORS.neonBlue, 0.2);
    ground.fillRect(4, 4, 8, 2);
    ground.fillRect(52, 4, 8, 2);
    ground.generateTexture("ground", 64, 64);
    ground.destroy();

    // Platform - floating sci-fi platform
    const platform = this.make.graphics({ x: 0, y: 0 });
    platform.fillStyle(0x3a3a4e);
    platform.fillRoundedRect(0, 0, 128, 24, 4);
    platform.fillStyle(0x4a4a5e);
    platform.fillRoundedRect(4, 0, 120, 8, 2);
    platform.lineStyle(2, COLORS.neonBlue, 0.5);
    platform.strokeRoundedRect(0, 0, 128, 24, 4);
    // Glow underneath
    platform.fillStyle(COLORS.neonBlue, 0.2);
    platform.fillRoundedRect(8, 20, 112, 8, 2);
    platform.generateTexture("platform", 128, 32);
    platform.destroy();

    // Moving platform
    const movingPlatform = this.make.graphics({ x: 0, y: 0 });
    movingPlatform.fillStyle(0x3a4a3e);
    movingPlatform.fillRoundedRect(0, 0, 96, 20, 4);
    movingPlatform.fillStyle(0x4a5a4e);
    movingPlatform.fillRoundedRect(4, 0, 88, 6, 2);
    movingPlatform.lineStyle(2, COLORS.neonGreen, 0.6);
    movingPlatform.strokeRoundedRect(0, 0, 96, 20, 4);
    movingPlatform.fillStyle(COLORS.neonGreen, 0.3);
    movingPlatform.fillRoundedRect(8, 16, 80, 6, 2);
    movingPlatform.generateTexture("moving_platform", 96, 24);
    movingPlatform.destroy();

    // Crystal collectible
    const crystal = this.make.graphics({ x: 0, y: 0 });
    crystal.fillStyle(COLORS.neonBlue, 0.3);
    crystal.fillRect(8, 4, 16, 32);
    crystal.fillStyle(COLORS.neonBlue, 0.7);
    crystal.beginPath();
    crystal.moveTo(16, 0);
    crystal.lineTo(4, 12);
    crystal.lineTo(4, 28);
    crystal.lineTo(16, 40);
    crystal.lineTo(28, 28);
    crystal.lineTo(28, 12);
    crystal.closePath();
    crystal.fillPath();
    crystal.fillStyle(0xffffff, 0.5);
    crystal.beginPath();
    crystal.moveTo(16, 4);
    crystal.lineTo(8, 12);
    crystal.lineTo(8, 20);
    crystal.lineTo(16, 24);
    crystal.closePath();
    crystal.fillPath();
    crystal.generateTexture("crystal", 32, 40);
    crystal.destroy();

    // Checkpoint flag
    const checkpoint = this.make.graphics({ x: 0, y: 0 });
    checkpoint.fillStyle(0x666677);
    checkpoint.fillRect(4, 0, 8, 80);
    checkpoint.fillStyle(COLORS.neonGreen, 0.8);
    checkpoint.fillTriangle(12, 8, 12, 40, 48, 24);
    checkpoint.lineStyle(2, COLORS.neonGreen);
    checkpoint.strokeTriangle(12, 8, 12, 40, 48, 24);
    checkpoint.generateTexture("checkpoint", 56, 80);
    checkpoint.destroy();

    // Checkpoint activated
    const checkpointActive = this.make.graphics({ x: 0, y: 0 });
    checkpointActive.fillStyle(0x888899);
    checkpointActive.fillRect(4, 0, 8, 80);
    checkpointActive.fillStyle(COLORS.neonYellow, 0.9);
    checkpointActive.fillTriangle(12, 8, 12, 40, 48, 24);
    checkpointActive.lineStyle(3, COLORS.neonYellow);
    checkpointActive.strokeTriangle(12, 8, 12, 40, 48, 24);
    checkpointActive.generateTexture("checkpoint_active", 56, 80);
    checkpointActive.destroy();

    // End portal
    const portal = this.make.graphics({ x: 0, y: 0 });
    portal.fillStyle(COLORS.neonPurple, 0.2);
    portal.fillEllipse(48, 64, 80, 120);
    portal.fillStyle(COLORS.neonPurple, 0.4);
    portal.fillEllipse(48, 64, 60, 90);
    portal.fillStyle(COLORS.neonPurple, 0.6);
    portal.fillEllipse(48, 64, 40, 60);
    portal.fillStyle(0xffffff, 0.3);
    portal.fillEllipse(48, 64, 20, 30);
    portal.lineStyle(4, COLORS.neonPurple, 0.8);
    portal.strokeEllipse(48, 64, 80, 120);
    portal.generateTexture("portal", 96, 128);
    portal.destroy();

    // Parallax backgrounds
    this.createParallaxLayers();
  }

  private createParallaxLayers(): void {
    // Stars layer (furthest)
    const stars = this.make.graphics({ x: 0, y: 0 });
    stars.fillStyle(COLORS.darkBg);
    stars.fillRect(0, 0, 1280, 720);
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 1280;
      const y = Math.random() * 720;
      const size = Math.random() * 2 + 1;
      const alpha = Math.random() * 0.5 + 0.3;
      stars.fillStyle(0xffffff, alpha);
      stars.fillCircle(x, y, size);
    }
    stars.generateTexture("bg_stars", 1280, 720);
    stars.destroy();

    // Nebula layer
    const nebula = this.make.graphics({ x: 0, y: 0 });
    nebula.fillStyle(COLORS.neonPurple, 0.1);
    nebula.fillEllipse(300, 200, 400, 200);
    nebula.fillStyle(COLORS.neonBlue, 0.08);
    nebula.fillEllipse(900, 400, 500, 250);
    nebula.fillStyle(COLORS.neonRed, 0.06);
    nebula.fillEllipse(600, 600, 350, 180);
    nebula.generateTexture("bg_nebula", 1280, 720);
    nebula.destroy();

    // Distant cityscape
    const city = this.make.graphics({ x: 0, y: 0 });
    const cityY = 400;
    for (let i = 0; i < 20; i++) {
      const x = i * 100 + Math.random() * 40;
      const height = 100 + Math.random() * 200;
      const width = 30 + Math.random() * 40;
      city.fillStyle(0x1a1a2a, 0.8);
      city.fillRect(x, cityY + (320 - height), width, height);
      // Windows
      city.fillStyle(COLORS.neonYellow, 0.3);
      for (let wy = cityY + (320 - height) + 10; wy < cityY + 300; wy += 20) {
        for (let wx = x + 5; wx < x + width - 5; wx += 12) {
          if (Math.random() > 0.3) {
            city.fillRect(wx, wy, 6, 8);
          }
        }
      }
    }
    city.generateTexture("bg_city", 2000, 720);
    city.destroy();
  }

  private createEffectAssets(): void {
    // Particle for various effects
    const particle = this.make.graphics({ x: 0, y: 0 });
    particle.fillStyle(0xffffff);
    particle.fillCircle(8, 8, 8);
    particle.generateTexture("particle", 16, 16);
    particle.destroy();

    // Hit spark (4-pointed star)
    const spark = this.make.graphics({ x: 0, y: 0 });
    spark.fillStyle(COLORS.neonYellow);
    // Draw 4-pointed star using triangles
    spark.fillTriangle(16, 0, 12, 16, 20, 16); // top
    spark.fillTriangle(32, 16, 16, 12, 16, 20); // right
    spark.fillTriangle(16, 32, 20, 16, 12, 16); // bottom
    spark.fillTriangle(0, 16, 16, 20, 16, 12); // left
    spark.fillCircle(16, 16, 6); // center
    spark.generateTexture("spark", 32, 32);
    spark.destroy();

    // Health heart
    const heart = this.make.graphics({ x: 0, y: 0 });
    heart.fillStyle(COLORS.neonRed);
    heart.fillCircle(10, 12, 10);
    heart.fillCircle(26, 12, 10);
    heart.fillTriangle(0, 14, 36, 14, 18, 36);
    heart.generateTexture("heart", 36, 36);
    heart.destroy();

    // Empty heart
    const heartEmpty = this.make.graphics({ x: 0, y: 0 });
    heartEmpty.lineStyle(2, COLORS.neonRed, 0.5);
    heartEmpty.strokeCircle(10, 12, 10);
    heartEmpty.strokeCircle(26, 12, 10);
    heartEmpty.strokeTriangle(0, 14, 36, 14, 18, 36);
    heartEmpty.generateTexture("heart_empty", 36, 36);
    heartEmpty.destroy();
  }

  private createUIAssets(): void {
    // Single star for menu/scene backgrounds
    const star = this.make.graphics({ x: 0, y: 0 });
    star.fillStyle(0xffffff);
    star.fillCircle(4, 4, 4);
    star.generateTexture("star", 8, 8);
    star.destroy();

    // Single nebula cloud for scene backgrounds
    const nebula = this.make.graphics({ x: 0, y: 0 });
    nebula.fillStyle(COLORS.neonPurple, 0.3);
    nebula.fillCircle(50, 50, 50);
    nebula.fillStyle(COLORS.neonBlue, 0.2);
    nebula.fillCircle(60, 40, 30);
    nebula.generateTexture("nebula", 100, 100);
    nebula.destroy();

    // Saber slash effect (alias)
    const saberSlash = this.make.graphics({ x: 0, y: 0 });
    saberSlash.lineStyle(6, COLORS.neonRed, 0.8);
    saberSlash.beginPath();
    saberSlash.arc(50, 50, 40, Phaser.Math.DegToRad(-60), Phaser.Math.DegToRad(60), false);
    saberSlash.strokePath();
    saberSlash.lineStyle(3, 0xffffff, 0.9);
    saberSlash.beginPath();
    saberSlash.arc(50, 50, 40, Phaser.Math.DegToRad(-50), Phaser.Math.DegToRad(50), false);
    saberSlash.strokePath();
    saberSlash.generateTexture("saberSlash", 100, 100);
    saberSlash.destroy();

    // Baby Yoda Car (alias for menu display)
    const babyYodaCar = this.make.graphics({ x: 0, y: 0 });
    // Hover car body
    babyYodaCar.fillStyle(0x444466);
    babyYodaCar.fillRoundedRect(4, 30, 72, 24, 8);
    babyYodaCar.lineStyle(2, COLORS.neonBlue, 0.6);
    babyYodaCar.strokeRoundedRect(4, 30, 72, 24, 8);
    // Hover glow
    babyYodaCar.fillStyle(COLORS.neonBlue, 0.3);
    babyYodaCar.fillEllipse(40, 58, 60, 12);
    // Baby Yoda
    babyYodaCar.fillStyle(0x88aa66);
    babyYodaCar.fillRoundedRect(26, 8, 28, 26, 10);
    // Ears
    babyYodaCar.fillEllipse(14, 16, 16, 8);
    babyYodaCar.fillEllipse(66, 16, 16, 8);
    // Eyes
    babyYodaCar.fillStyle(0x000000);
    babyYodaCar.fillCircle(34, 18, 6);
    babyYodaCar.fillCircle(46, 18, 6);
    babyYodaCar.fillStyle(0xffffff);
    babyYodaCar.fillCircle(35, 17, 3);
    babyYodaCar.fillCircle(47, 17, 3);
    babyYodaCar.generateTexture("babyYodaCar", 80, 64);
    babyYodaCar.destroy();

    // Button background
    const button = this.make.graphics({ x: 0, y: 0 });
    button.fillStyle(0x2a2a4a, 0.9);
    button.fillRoundedRect(0, 0, 200, 50, 10);
    button.lineStyle(2, COLORS.neonBlue, 0.8);
    button.strokeRoundedRect(0, 0, 200, 50, 10);
    button.generateTexture("button", 200, 50);
    button.destroy();

    // Panel background
    const panel = this.make.graphics({ x: 0, y: 0 });
    panel.fillStyle(0x1a1a2a, 0.95);
    panel.fillRoundedRect(0, 0, 400, 300, 15);
    panel.lineStyle(3, COLORS.neonPurple, 0.6);
    panel.strokeRoundedRect(0, 0, 400, 300, 15);
    panel.generateTexture("panel", 400, 300);
    panel.destroy();
  }

  private createAnimations(): void {
    // Player animations
    this.anims.create({
      key: "vader_idle",
      frames: [{ key: "vader" }],
      frameRate: 1,
      repeat: -1,
    });

    this.anims.create({
      key: "vader_run",
      frames: [{ key: "vader" }],
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: "vader_jump",
      frames: [{ key: "vader_jump" }],
      frameRate: 1,
      repeat: 0,
    });

    // Enemy animations
    this.anims.create({
      key: "yoda_fly",
      frames: [{ key: "yoda_car" }],
      frameRate: 4,
      repeat: -1,
    });

    this.anims.create({
      key: "droid_hover",
      frames: [{ key: "droid" }],
      frameRate: 4,
      repeat: -1,
    });

    // Crystal animation
    this.anims.create({
      key: "crystal_sparkle",
      frames: [{ key: "crystal" }],
      frameRate: 4,
      repeat: -1,
    });
  }
}
