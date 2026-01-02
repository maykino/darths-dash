import * as Phaser from "phaser";
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  LEVEL_WIDTH,
  PLAYER_SPEED,
  PLAYER_JUMP_VELOCITY,
  PLAYER_DOUBLE_JUMP_VELOCITY,
  COYOTE_TIME,
  JUMP_BUFFER_TIME,
  PLAYER_MAX_HEALTH,
  SABER_COOLDOWN,
  SABER_RANGE,
  PATROL_ENEMY_SPEED,
  FLYING_ENEMY_SPEED,
  CAMERA_LERP,
  PLAYER_SCREEN_X_PERCENT,
  COLORS,
  CRYSTAL_POINTS,
  ENEMY_POINTS,
  TIME_BONUS_BASE,
  TIME_PENALTY_PER_SECOND,
  DAMAGE_PENALTY,
  CHECKPOINT_BONUS,
  COMPLETION_BONUS,
  GameStats,
  GameCallbacks,
} from "../config/gameConfig";

interface Checkpoint {
  x: number;
  y: number;
  activated: boolean;
  sprite: Phaser.GameObjects.Image;
}

interface Enemy {
  sprite: Phaser.Physics.Arcade.Sprite;
  type: "patrol" | "flying" | "turret" | "witch";
  health: number;
  patrolStart?: number;
  patrolEnd?: number;
  direction?: number;
}

export class GameScene extends Phaser.Scene {
  // Player
  private player!: Phaser.Physics.Arcade.Sprite;
  private lightsaber!: Phaser.GameObjects.Image;
  private health = PLAYER_MAX_HEALTH;
  private isInvulnerable = false;
  private facingRight = true;

  // Combat
  private canAttack = true;
  private isAttacking = false;
  private slashEffect!: Phaser.GameObjects.Image;

  // Jump mechanics
  private canDoubleJump = true;
  private lastGroundedTime = 0;
  private jumpBufferTime = 0;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private attackKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;

  // Level elements
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private movingPlatforms!: Phaser.Physics.Arcade.Group;
  private enemies: Enemy[] = [];
  private crystals!: Phaser.Physics.Arcade.Group;
  private checkpoints: Checkpoint[] = [];
  private spikes!: Phaser.Physics.Arcade.StaticGroup;
  private laserBeams!: Phaser.Physics.Arcade.Group;
  private portal!: Phaser.Physics.Arcade.Sprite;

  // Parallax backgrounds
  private bgStars!: Phaser.GameObjects.TileSprite;
  private bgNebula!: Phaser.GameObjects.TileSprite;
  private bgCity!: Phaser.GameObjects.TileSprite;

  // Stats
  private score = 0;
  private crystalsCollected = 0;
  private enemiesDefeated = 0;
  private checkpointsReached = 0;
  private damageTaken = 0;
  private startTime = 0;
  private lastCheckpointX = 100;
  private lastCheckpointY = 0;

  // UI
  private scoreText!: Phaser.GameObjects.Text;
  private healthDisplay!: Phaser.GameObjects.Container;
  private isPaused = false;
  private pauseOverlay!: Phaser.GameObjects.Container;

  // Touch controls
  private isMobile = false;
  private touchControls!: Phaser.GameObjects.Container;
  private joystickBase!: Phaser.GameObjects.Arc;
  private joystickThumb!: Phaser.GameObjects.Arc;
  private joystickPointer: Phaser.Input.Pointer | null = null;
  private touchMoveX = 0;
  private touchJump = false;
  private touchAttack = false;

  // Particles
  private sparkEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private crystalEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

  // Data passed from menu
  private playerName: string = "PLAYER";
  private callbacks?: GameCallbacks;

  constructor() {
    super({ key: "GameScene" });
  }

  init(data: { playerName?: string; callbacks?: GameCallbacks }): void {
    this.playerName = data.playerName || "PLAYER";
    this.callbacks = data.callbacks;
    this.health = PLAYER_MAX_HEALTH;
    this.score = 0;
    this.crystalsCollected = 0;
    this.enemiesDefeated = 0;
    this.checkpointsReached = 0;
    this.damageTaken = 0;
    this.isInvulnerable = false;
    this.canDoubleJump = true;
    this.facingRight = true;
    this.isPaused = false;
    this.enemies = [];
    this.checkpoints = [];
    this.lastCheckpointX = 100;
    this.lastCheckpointY = 0;
  }

  create(): void {
    this.startTime = Date.now();

    // Set world bounds
    this.physics.world.setBounds(0, 0, LEVEL_WIDTH, GAME_HEIGHT);

    // Create parallax backgrounds
    this.createBackgrounds();

    // Create level
    this.createLevel();

    // Create player
    this.createPlayer();

    // Create enemies and hazards
    this.createEnemies();
    this.createHazards();

    // Create collectibles
    this.createCrystals();

    // Create end portal
    this.createPortal();

    // Setup camera
    this.setupCamera();

    // Create UI
    this.createUI();

    // Create pause overlay
    this.createPauseOverlay();

    // Setup particles
    this.setupParticles();

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.attackKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // Also allow Z for attack
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z).on("down", () => this.attack());
    this.attackKey.on("down", () => this.attack());

    // Setup collisions
    this.setupCollisions();

    // Detect mobile and create touch controls
    this.isMobile = this.detectMobile();
    if (this.isMobile) {
      this.createTouchControls();
    }
  }

  private detectMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0);
  }

  private createTouchControls(): void {
    this.touchControls = this.add.container(0, 0);
    this.touchControls.setScrollFactor(0);
    this.touchControls.setDepth(150);

    // Virtual joystick (left side)
    const joystickX = 120;
    const joystickY = GAME_HEIGHT - 140;

    // Joystick base
    this.joystickBase = this.add.circle(joystickX, joystickY, 70, 0x000000, 0.4);
    this.joystickBase.setStrokeStyle(4, 0x00ffff, 0.6);
    this.touchControls.add(this.joystickBase);

    // Joystick thumb
    this.joystickThumb = this.add.circle(joystickX, joystickY, 35, 0x00ffff, 0.6);
    this.touchControls.add(this.joystickThumb);

    // Jump button (right side, bottom)
    const jumpBtn = this.add.circle(GAME_WIDTH - 100, GAME_HEIGHT - 100, 50, 0x00ff00, 0.4);
    jumpBtn.setStrokeStyle(4, 0x00ff00, 0.8);
    jumpBtn.setInteractive();
    this.touchControls.add(jumpBtn);

    const jumpText = this.add.text(GAME_WIDTH - 100, GAME_HEIGHT - 100, "JUMP", {
      fontFamily: "Arial, sans-serif",
      fontSize: "16px",
      color: "#00ff00",
    }).setOrigin(0.5);
    this.touchControls.add(jumpText);

    // Attack button (right side, top of jump)
    const attackBtn = this.add.circle(GAME_WIDTH - 180, GAME_HEIGHT - 180, 50, 0xff0000, 0.4);
    attackBtn.setStrokeStyle(4, 0xff0000, 0.8);
    attackBtn.setInteractive();
    this.touchControls.add(attackBtn);

    const attackText = this.add.text(GAME_WIDTH - 180, GAME_HEIGHT - 180, "ATK", {
      fontFamily: "Arial, sans-serif",
      fontSize: "16px",
      color: "#ff0000",
    }).setOrigin(0.5);
    this.touchControls.add(attackText);

    // Pause button (top right)
    const pauseBtn = this.add.circle(GAME_WIDTH - 50, 50, 30, 0xffffff, 0.3);
    pauseBtn.setStrokeStyle(3, 0xffffff, 0.6);
    pauseBtn.setInteractive();
    this.touchControls.add(pauseBtn);

    const pauseText = this.add.text(GAME_WIDTH - 50, 50, "II", {
      fontFamily: "Arial, sans-serif",
      fontSize: "20px",
      color: "#ffffff",
    }).setOrigin(0.5);
    this.touchControls.add(pauseText);

    // Button event handlers
    jumpBtn.on('pointerdown', () => { this.touchJump = true; });
    jumpBtn.on('pointerup', () => { this.touchJump = false; });
    jumpBtn.on('pointerout', () => { this.touchJump = false; });

    attackBtn.on('pointerdown', () => {
      this.touchAttack = true;
      this.attack();
    });
    attackBtn.on('pointerup', () => { this.touchAttack = false; });
    attackBtn.on('pointerout', () => { this.touchAttack = false; });

    pauseBtn.on('pointerdown', () => { this.togglePause(); });

    // Joystick touch handling
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Check if touch is in left half of screen (joystick area)
      if (pointer.x < GAME_WIDTH / 2 && !this.joystickPointer) {
        this.joystickPointer = pointer;
        this.updateJoystick(pointer.x, pointer.y);
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.joystickPointer && pointer.id === this.joystickPointer.id) {
        this.updateJoystick(pointer.x, pointer.y);
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.joystickPointer && pointer.id === this.joystickPointer.id) {
        this.joystickPointer = null;
        this.touchMoveX = 0;
        // Reset joystick thumb position
        this.joystickThumb.setPosition(this.joystickBase.x, this.joystickBase.y);
      }
    });
  }

  private updateJoystick(touchX: number, touchY: number): void {
    const baseX = this.joystickBase.x;
    const baseY = this.joystickBase.y;
    const maxDistance = 50;

    // Calculate distance from joystick center
    let deltaX = touchX - baseX;
    let deltaY = touchY - baseY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Clamp to max distance
    if (distance > maxDistance) {
      deltaX = (deltaX / distance) * maxDistance;
      deltaY = (deltaY / distance) * maxDistance;
    }

    // Update thumb position
    this.joystickThumb.setPosition(baseX + deltaX, baseY + deltaY);

    // Calculate horizontal movement (-1 to 1)
    this.touchMoveX = deltaX / maxDistance;

    // Check for up movement (jump) - if pushing joystick up significantly
    if (deltaY < -25) {
      this.touchJump = true;
    }
  }

  update(time: number, delta: number): void {
    if (this.isPaused) {
      if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
        this.togglePause();
      }
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.togglePause();
      return;
    }

    this.updatePlayer(time, delta);
    this.updateEnemies(delta);
    this.updateMovingPlatforms(time);
    this.updateLasers(time);
    this.updateParallax();
    this.updateUI();
  }

  private createBackgrounds(): void {
    // Stars (furthest, slowest)
    this.bgStars = this.add.tileSprite(0, 0, LEVEL_WIDTH * 2, GAME_HEIGHT, "bg_stars");
    this.bgStars.setOrigin(0, 0);
    this.bgStars.setScrollFactor(0);
    this.bgStars.setDepth(-100);

    // Nebula
    this.bgNebula = this.add.tileSprite(0, 0, LEVEL_WIDTH * 2, GAME_HEIGHT, "bg_nebula");
    this.bgNebula.setOrigin(0, 0);
    this.bgNebula.setScrollFactor(0);
    this.bgNebula.setDepth(-90);

    // City (closest background)
    this.bgCity = this.add.tileSprite(0, 0, LEVEL_WIDTH * 2, GAME_HEIGHT, "bg_city");
    this.bgCity.setOrigin(0, 0);
    this.bgCity.setScrollFactor(0);
    this.bgCity.setDepth(-80);
  }

  private createLevel(): void {
    this.platforms = this.physics.add.staticGroup();
    this.movingPlatforms = this.physics.add.group({ allowGravity: false });

    // Ground - spans the level with gaps
    const groundY = GAME_HEIGHT - 64;
    const groundSegments = [
      { start: 0, end: 800 },
      { start: 900, end: 1800 },
      { start: 2000, end: 3200 },
      { start: 3400, end: 4500 },
      { start: 4700, end: 5800 },
      { start: 6000, end: 7200 },
      { start: 7400, end: LEVEL_WIDTH },
    ];

    groundSegments.forEach((seg) => {
      for (let x = seg.start; x < seg.end; x += 64) {
        const ground = this.platforms.create(x + 32, groundY + 32, "ground");
        ground.setScale(1).refreshBody();
      }
    });

    // Floating platforms throughout the level
    // Ground is at ~656, player can jump ~180 pixels with double jump
    // So platforms should be between 480-600 for easy jumps, 400-480 for double jumps
    const lowPlatform = groundY - 100; // 556 - easy single jump
    const midPlatform = groundY - 160; // 496 - needs good timing or double jump
    const highPlatform = groundY - 220; // 436 - needs double jump

    const platformData = [
      // Section 1: Tutorial area - easy platforms
      { x: 400, y: lowPlatform, type: "static" },
      { x: 600, y: midPlatform, type: "static" },
      { x: 300, y: lowPlatform + 50, type: "static" },

      // Section 2: First challenge
      { x: 1200, y: lowPlatform, type: "static" },
      { x: 1400, y: midPlatform, type: "moving", moveY: true, range: 80 },
      { x: 1600, y: lowPlatform, type: "static" },

      // Section 3: Gap crossing
      { x: 2200, y: lowPlatform, type: "moving", moveX: true, range: 200 },
      { x: 2600, y: midPlatform, type: "static" },
      { x: 2900, y: lowPlatform, type: "static" },

      // Section 4: Vertical challenge
      { x: 3600, y: lowPlatform, type: "static" },
      { x: 3800, y: midPlatform, type: "moving", moveY: true, range: 80 },
      { x: 4000, y: highPlatform, type: "static" },
      { x: 4200, y: lowPlatform, type: "static" },

      // Section 5: Complex platforming
      { x: 4900, y: lowPlatform, type: "static" },
      { x: 5100, y: midPlatform, type: "moving", moveX: true, range: 150 },
      { x: 5400, y: highPlatform, type: "static" },
      { x: 5600, y: lowPlatform, type: "static" },

      // Section 6: Final stretch
      { x: 6200, y: lowPlatform, type: "static" },
      { x: 6500, y: midPlatform, type: "moving", moveY: true, range: 80 },
      { x: 6800, y: highPlatform, type: "static" },
      { x: 7100, y: lowPlatform, type: "static" },
    ];

    platformData.forEach((p) => {
      if (p.type === "static") {
        const platform = this.platforms.create(p.x, p.y, "platform");
        platform.setScale(1).refreshBody();
      } else if (p.type === "moving") {
        const platform = this.movingPlatforms.create(p.x, p.y, "moving_platform") as Phaser.Physics.Arcade.Sprite;
        platform.setImmovable(true);
        (platform.body as Phaser.Physics.Arcade.Body).allowGravity = false;

        const tweenConfig: Phaser.Types.Tweens.TweenBuilderConfig = {
          targets: platform,
          duration: 2000,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        };

        if (p.moveX) {
          tweenConfig.x = p.x + (p.range || 100);
        }
        if (p.moveY) {
          tweenConfig.y = p.y + (p.range || 100);
        }

        this.tweens.add(tweenConfig);
      }
    });

    // Create checkpoints
    const checkpointPositions = [
      { x: 1800, y: groundY - 40 },
      { x: 3200, y: groundY - 40 },
      { x: 5000, y: groundY - 40 },
      { x: 6800, y: groundY - 40 },
    ];

    checkpointPositions.forEach((pos) => {
      const sprite = this.add.image(pos.x, pos.y, "checkpoint").setOrigin(0.5, 1);
      this.checkpoints.push({
        x: pos.x,
        y: pos.y - 40,
        activated: false,
        sprite,
      });
    });

    // Set initial checkpoint
    this.lastCheckpointY = groundY - 80;
  }

  private createPlayer(): void {
    this.player = this.physics.add.sprite(this.lastCheckpointX, this.lastCheckpointY, "vader");
    this.player.setCollideWorldBounds(true);
    this.player.setSize(40, 70);
    this.player.setOffset(12, 8);
    this.player.setDepth(10);

    // Lightsaber
    this.lightsaber = this.add.image(0, 0, "lightsaber");
    this.lightsaber.setOrigin(0.5, 1);
    this.lightsaber.setDepth(11);
    this.lightsaber.setVisible(true);

    // Slash effect (hidden initially)
    this.slashEffect = this.add.image(0, 0, "saber_slash");
    this.slashEffect.setVisible(false);
    this.slashEffect.setDepth(12);
  }

  private createEnemies(): void {
    const enemyData = [
      // Patrol enemies (Baby Yodas in cars)
      { x: 600, y: GAME_HEIGHT - 128, type: "patrol" as const, patrolRange: 200 },
      { x: 1400, y: GAME_HEIGHT - 128, type: "patrol" as const, patrolRange: 300 },
      { x: 2400, y: GAME_HEIGHT - 128, type: "patrol" as const, patrolRange: 250 },
      { x: 3600, y: GAME_HEIGHT - 128, type: "patrol" as const, patrolRange: 200 },
      { x: 4400, y: GAME_HEIGHT - 128, type: "patrol" as const, patrolRange: 300 },
      { x: 5400, y: GAME_HEIGHT - 128, type: "patrol" as const, patrolRange: 250 },
      { x: 6400, y: GAME_HEIGHT - 128, type: "patrol" as const, patrolRange: 200 },

      // Flying droids
      { x: 1000, y: 300, type: "flying" as const },
      { x: 2200, y: 250, type: "flying" as const },
      { x: 3400, y: 280, type: "flying" as const },
      { x: 4800, y: 220, type: "flying" as const },
      { x: 5800, y: 300, type: "flying" as const },
      { x: 7000, y: 260, type: "flying" as const },

      // Flying witches (Baba Yagas)
      { x: 1600, y: 200, type: "witch" as const },
      { x: 2800, y: 180, type: "witch" as const },
      { x: 4200, y: 240, type: "witch" as const },
      { x: 5200, y: 160, type: "witch" as const },
      { x: 6600, y: 220, type: "witch" as const },
    ];

    enemyData.forEach((e) => {
      let texture: string;
      if (e.type === "patrol") {
        texture = "yoda_car";
      } else if (e.type === "witch") {
        texture = "witch";
      } else {
        texture = "droid";
      }
      const sprite = this.physics.add.sprite(e.x, e.y, texture);
      (sprite.body as Phaser.Physics.Arcade.Body).allowGravity = e.type === "patrol";
      sprite.setImmovable(e.type === "flying" || e.type === "witch");

      const enemy: Enemy = {
        sprite,
        type: e.type,
        health: 1,
        direction: 1,
      };

      if (e.type === "patrol" && e.patrolRange) {
        enemy.patrolStart = e.x - e.patrolRange / 2;
        enemy.patrolEnd = e.x + e.patrolRange / 2;
        sprite.setVelocityX(PATROL_ENEMY_SPEED);
      } else if (e.type === "flying") {
        // Flying enemies move in a sine wave pattern
        this.tweens.add({
          targets: sprite,
          y: e.y + 80,
          duration: 2000,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
        sprite.setVelocityX(-FLYING_ENEMY_SPEED);
      } else if (e.type === "witch") {
        // Witches fly in a swooping pattern and move faster
        this.tweens.add({
          targets: sprite,
          y: e.y + 120,
          duration: 2500,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
        sprite.setVelocityX(-FLYING_ENEMY_SPEED * 1.3);
      }

      this.enemies.push(enemy);
    });
  }

  private createHazards(): void {
    this.spikes = this.physics.add.staticGroup();
    this.laserBeams = this.physics.add.group({ allowGravity: false });

    // Spike positions (in gaps and on platforms)
    const spikePositions = [
      // Gap spikes
      { x: 850, y: GAME_HEIGHT - 20 },
      { x: 882, y: GAME_HEIGHT - 20 },
      { x: 1950, y: GAME_HEIGHT - 20 },
      { x: 1982, y: GAME_HEIGHT - 20 },
      { x: 3350, y: GAME_HEIGHT - 20 },
      { x: 3382, y: GAME_HEIGHT - 20 },
      { x: 4650, y: GAME_HEIGHT - 20 },
      { x: 4682, y: GAME_HEIGHT - 20 },
      { x: 5950, y: GAME_HEIGHT - 20 },
      { x: 5982, y: GAME_HEIGHT - 20 },
    ];

    spikePositions.forEach((pos) => {
      const spike = this.spikes.create(pos.x, pos.y, "spike");
      spike.setOrigin(0.5, 1);
      spike.refreshBody();
    });

    // Laser turrets
    const turretPositions = [
      { x: 1600, y: GAME_HEIGHT - 64, interval: 2000, duration: 1000 },
      { x: 3000, y: GAME_HEIGHT - 64, interval: 2500, duration: 1200 },
      { x: 5200, y: GAME_HEIGHT - 64, interval: 1800, duration: 800 },
      { x: 6600, y: GAME_HEIGHT - 64, interval: 2200, duration: 1000 },
    ];

    turretPositions.forEach((t) => {
      // Add turret sprite
      this.add.image(t.x, t.y, "turret").setOrigin(0.5, 1);

      // Create laser beam that toggles
      const laser = this.laserBeams.create(t.x + 24, t.y - 40, "laser_beam") as Phaser.Physics.Arcade.Sprite;
      laser.setOrigin(0, 0.5);
      (laser.body as Phaser.Physics.Arcade.Body).allowGravity = false;
      laser.setVisible(false);
      laser.setActive(false);

      // Store timing data
      laser.setData("interval", t.interval);
      laser.setData("duration", t.duration);
      laser.setData("nextActivation", t.interval);
      laser.setData("deactivateAt", 0);
    });
  }

  private createCrystals(): void {
    this.crystals = this.physics.add.group({ allowGravity: false });

    const crystalPositions = [
      // Section 1
      { x: 200, y: 550 }, { x: 400, y: 450 }, { x: 600, y: 350 },
      // Section 2
      { x: 1200, y: 400 }, { x: 1400, y: 300 }, { x: 1600, y: 200 },
      // Section 3
      { x: 2100, y: 550 }, { x: 2400, y: 350 }, { x: 2800, y: 300 },
      // Section 4
      { x: 3500, y: 550 }, { x: 3800, y: 330 }, { x: 4100, y: 210 },
      // Section 5
      { x: 4800, y: 550 }, { x: 5100, y: 300 }, { x: 5500, y: 230 },
      // Section 6
      { x: 6100, y: 550 }, { x: 6400, y: 370 }, { x: 6900, y: 200 },
      // Final area
      { x: 7200, y: 400 }, { x: 7400, y: 300 }, { x: 7600, y: 350 },
    ];

    crystalPositions.forEach((pos) => {
      const crystal = this.crystals.create(pos.x, pos.y, "crystal") as Phaser.Physics.Arcade.Sprite;
      (crystal.body as Phaser.Physics.Arcade.Body).allowGravity = false;

      // Floating animation
      this.tweens.add({
        targets: crystal,
        y: pos.y - 10,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });
  }

  private createPortal(): void {
    this.portal = this.physics.add.sprite(LEVEL_WIDTH - 150, GAME_HEIGHT - 192, "portal");
    (this.portal.body as Phaser.Physics.Arcade.Body).allowGravity = false;
    this.portal.setImmovable(true);

    // Portal pulsing animation
    this.tweens.add({
      targets: this.portal,
      scaleX: 1.1,
      scaleY: 1.1,
      alpha: 0.8,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private setupCamera(): void {
    this.cameras.main.setBounds(0, 0, LEVEL_WIDTH, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player, true, CAMERA_LERP, CAMERA_LERP);
    this.cameras.main.setFollowOffset(-GAME_WIDTH * (0.5 - PLAYER_SCREEN_X_PERCENT), 0);
  }

  private createUI(): void {
    // Score text (fixed to camera)
    this.scoreText = this.add.text(20, 20, "SCORE: 0", {
      fontFamily: "Arial, sans-serif",
      fontSize: "24px",
      color: "#00d4ff",
      stroke: "#000000",
      strokeThickness: 3,
    });
    this.scoreText.setScrollFactor(0);
    this.scoreText.setDepth(100);

    // Crystal counter
    const crystalIcon = this.add.image(20, 60, "crystal").setScale(0.6).setOrigin(0, 0.5);
    crystalIcon.setScrollFactor(0);
    crystalIcon.setDepth(100);

    const crystalText = this.add.text(50, 60, "x 0", {
      fontFamily: "Arial, sans-serif",
      fontSize: "20px",
      color: "#00d4ff",
    });
    crystalText.setScrollFactor(0);
    crystalText.setDepth(100);
    crystalText.setName("crystalText");

    // Health display
    this.healthDisplay = this.add.container(GAME_WIDTH - 150, 30);
    this.healthDisplay.setScrollFactor(0);
    this.healthDisplay.setDepth(100);
    this.updateHealthDisplay();

    // Controls hint
    const controlsText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, "ARROWS: Move | SPACE: Jump | X/Z: Attack | ESC: Pause", {
      fontFamily: "Arial, sans-serif",
      fontSize: "14px",
      color: "#888899",
    });
    controlsText.setOrigin(0.5);
    controlsText.setScrollFactor(0);
    controlsText.setDepth(100);

    // Fade out controls hint after 5 seconds
    this.time.delayedCall(5000, () => {
      this.tweens.add({
        targets: controlsText,
        alpha: 0,
        duration: 1000,
      });
    });
  }

  private updateHealthDisplay(): void {
    this.healthDisplay.removeAll(true);

    for (let i = 0; i < PLAYER_MAX_HEALTH; i++) {
      const heart = this.add.image(i * 40, 0, i < this.health ? "heart" : "heart_empty");
      heart.setScale(0.8);
      this.healthDisplay.add(heart);
    }
  }

  private createPauseOverlay(): void {
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8);

    const pauseText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, "PAUSED", {
      fontFamily: "Arial, sans-serif",
      fontSize: "48px",
      color: "#ffffff",
    });
    pauseText.setOrigin(0.5);

    const resumeText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "Press ESC to Resume", {
      fontFamily: "Arial, sans-serif",
      fontSize: "24px",
      color: "#00d4ff",
    });
    resumeText.setOrigin(0.5);

    const restartText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, "Press R to Restart", {
      fontFamily: "Arial, sans-serif",
      fontSize: "20px",
      color: "#888899",
    });
    restartText.setOrigin(0.5);

    const creditText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120, "Designed by Tatus and Jacob", {
      fontFamily: "Arial, sans-serif",
      fontSize: "16px",
      color: "#aa00ff",
    });
    creditText.setOrigin(0.5);

    this.pauseOverlay = this.add.container(0, 0, [overlay, pauseText, resumeText, restartText, creditText]);
    this.pauseOverlay.setScrollFactor(0);
    this.pauseOverlay.setDepth(200);
    this.pauseOverlay.setVisible(false);
  }

  private setupParticles(): void {
    // Spark particles for hits
    this.sparkEmitter = this.add.particles(0, 0, "spark", {
      speed: { min: 100, max: 200 },
      scale: { start: 0.5, end: 0 },
      lifespan: 300,
      blendMode: "ADD",
      emitting: false,
    });
    this.sparkEmitter.setDepth(50);

    // Crystal collect particles
    this.crystalEmitter = this.add.particles(0, 0, "particle", {
      speed: { min: 50, max: 150 },
      scale: { start: 0.5, end: 0 },
      lifespan: 500,
      tint: COLORS.neonBlue,
      blendMode: "ADD",
      emitting: false,
    });
    this.crystalEmitter.setDepth(50);
  }

  private setupCollisions(): void {
    // Player vs platforms
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.movingPlatforms);

    // Enemies vs platforms
    this.enemies.forEach((e) => {
      if (e.type === "patrol") {
        this.physics.add.collider(e.sprite, this.platforms);
      }
    });

    // Player vs crystals
    this.physics.add.overlap(this.player, this.crystals, (_player, crystal) => {
      this.collectCrystal(crystal as Phaser.Physics.Arcade.Sprite);
    }, undefined, this);

    // Player vs spikes
    this.physics.add.overlap(this.player, this.spikes, () => {
      this.hitHazard();
    }, undefined, this);

    // Player vs lasers
    this.physics.add.overlap(this.player, this.laserBeams, (_player, laser) => {
      this.hitLaser(laser as Phaser.Physics.Arcade.Sprite);
    }, undefined, this);

    // Player vs enemies
    this.enemies.forEach((e) => {
      this.physics.add.overlap(this.player, e.sprite, () => this.hitEnemy(e), undefined, this);
    });

    // Player vs portal
    this.physics.add.overlap(this.player, this.portal, () => {
      this.reachPortal();
    }, undefined, this);
  }

  private updatePlayer(time: number, delta: number): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;

    // Track grounded time for coyote time
    if (onGround) {
      this.lastGroundedTime = time;
      this.canDoubleJump = true;
    }

    const canCoyoteJump = time - this.lastGroundedTime < COYOTE_TIME;

    // Horizontal movement (keyboard or touch)
    const moveLeft = this.cursors.left.isDown || (this.isMobile && this.touchMoveX < -0.3);
    const moveRight = this.cursors.right.isDown || (this.isMobile && this.touchMoveX > 0.3);

    if (moveLeft) {
      this.player.setVelocityX(-PLAYER_SPEED);
      this.facingRight = false;
      if (onGround) this.player.play("vader_run", true);
    } else if (moveRight) {
      this.player.setVelocityX(PLAYER_SPEED);
      this.facingRight = true;
      if (onGround) this.player.play("vader_run", true);
    } else {
      this.player.setVelocityX(0);
      if (onGround) this.player.play("vader_idle", true);
    }

    // Flip player sprite
    this.player.setFlipX(!this.facingRight);

    // Jump buffer (keyboard or touch)
    const keyboardJump = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.cursors.space!);
    if (keyboardJump || this.touchJump) {
      this.jumpBufferTime = time;
      if (this.touchJump) {
        this.touchJump = false; // Reset touch jump so it doesn't repeat
      }
    }

    const jumpBuffered = time - this.jumpBufferTime < JUMP_BUFFER_TIME;

    // Jump
    if (jumpBuffered) {
      if (onGround || canCoyoteJump) {
        this.player.setVelocityY(PLAYER_JUMP_VELOCITY);
        this.player.play("vader_jump", true);
        this.jumpBufferTime = 0;
        this.lastGroundedTime = 0;
      } else if (this.canDoubleJump) {
        this.player.setVelocityY(PLAYER_DOUBLE_JUMP_VELOCITY);
        this.player.play("vader_jump", true);
        this.canDoubleJump = false;
        this.jumpBufferTime = 0;
      }
    }

    // Air animation
    if (!onGround && body.velocity.y !== 0) {
      this.player.play("vader_jump", true);
    }

    // Update lightsaber position
    const saberOffsetX = this.facingRight ? 30 : -30;
    this.lightsaber.setPosition(this.player.x + saberOffsetX, this.player.y - 10);
    this.lightsaber.setFlipX(!this.facingRight);
    this.lightsaber.setRotation(this.facingRight ? 0.3 : -0.3);

    // Check checkpoints
    this.checkCheckpoints();

    // Fall death
    if (this.player.y > GAME_HEIGHT + 50) {
      this.takeDamage();
      this.respawnAtCheckpoint();
    }
  }

  private attack(): void {
    if (!this.canAttack || this.isAttacking) return;

    this.isAttacking = true;
    this.canAttack = false;

    // Show slash effect
    const slashOffsetX = this.facingRight ? 50 : -50;
    this.slashEffect.setPosition(this.player.x + slashOffsetX, this.player.y);
    this.slashEffect.setFlipX(!this.facingRight);
    this.slashEffect.setVisible(true);
    this.slashEffect.setAlpha(1);

    // Animate lightsaber
    const targetRotation = this.facingRight ? -1.2 : 1.2;
    this.tweens.add({
      targets: this.lightsaber,
      rotation: targetRotation,
      duration: 100,
      yoyo: true,
    });

    // Check for enemy hits
    this.enemies.forEach((enemy) => {
      if (enemy.sprite.active) {
        const distance = Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          enemy.sprite.x,
          enemy.sprite.y
        );

        const inFront = this.facingRight
          ? enemy.sprite.x > this.player.x
          : enemy.sprite.x < this.player.x;

        if (distance < SABER_RANGE && inFront) {
          this.destroyEnemy(enemy);
        }
      }
    });

    // Fade out slash effect
    this.tweens.add({
      targets: this.slashEffect,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.slashEffect.setVisible(false);
        this.isAttacking = false;
      },
    });

    // Cooldown
    this.time.delayedCall(SABER_COOLDOWN, () => {
      this.canAttack = true;
    });
  }

  private destroyEnemy(enemy: Enemy): void {
    // Spark effect
    this.sparkEmitter.setPosition(enemy.sprite.x, enemy.sprite.y);
    this.sparkEmitter.explode(10);

    // Camera shake
    this.cameras.main.shake(100, 0.005);

    // Update stats
    this.enemiesDefeated++;
    this.addScore(ENEMY_POINTS);

    // Destroy enemy
    enemy.sprite.destroy();
    enemy.sprite.setActive(false);
  }

  private updateEnemies(delta: number): void {
    this.enemies.forEach((enemy) => {
      if (!enemy.sprite.active) return;

      if (enemy.type === "patrol") {
        // Patrol behavior
        if (enemy.patrolStart !== undefined && enemy.patrolEnd !== undefined) {
          if (enemy.sprite.x <= enemy.patrolStart) {
            enemy.direction = 1;
            enemy.sprite.setVelocityX(PATROL_ENEMY_SPEED);
            enemy.sprite.setFlipX(false);
          } else if (enemy.sprite.x >= enemy.patrolEnd) {
            enemy.direction = -1;
            enemy.sprite.setVelocityX(-PATROL_ENEMY_SPEED);
            enemy.sprite.setFlipX(true);
          }
        }
      } else if (enemy.type === "flying" || enemy.type === "witch") {
        // Flying enemies and witches wrap around
        if (enemy.sprite.x < -50) {
          enemy.sprite.x = LEVEL_WIDTH + 50;
        }
      }
    });
  }

  private updateMovingPlatforms(time: number): void {
    // Moving platforms are handled by tweens, but we need to
    // ensure player moves with platform
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (body.touching.down) {
      this.movingPlatforms.getChildren().forEach((platform) => {
        const p = platform as Phaser.Physics.Arcade.Sprite;
        const pBody = p.body as Phaser.Physics.Arcade.Body;
        if (pBody && this.physics.overlap(this.player, p)) {
          // Player is on this moving platform
          this.player.x += pBody.velocity.x * 0.016;
        }
      });
    }
  }

  private updateLasers(time: number): void {
    this.laserBeams.getChildren().forEach((laser) => {
      const l = laser as Phaser.Physics.Arcade.Sprite;
      const interval = l.getData("interval") as number;
      const duration = l.getData("duration") as number;

      const elapsed = time % (interval + duration);

      if (elapsed < duration) {
        // Laser should be active
        if (!l.visible) {
          l.setVisible(true);
          l.setActive(true);
          (l.body as Phaser.Physics.Arcade.Body).enable = true;
        }
      } else {
        // Laser should be inactive
        if (l.visible) {
          l.setVisible(false);
          l.setActive(false);
          (l.body as Phaser.Physics.Arcade.Body).enable = false;
        }
      }
    });
  }

  private updateParallax(): void {
    const camX = this.cameras.main.scrollX;
    this.bgStars.tilePositionX = camX * 0.1;
    this.bgNebula.tilePositionX = camX * 0.2;
    this.bgCity.tilePositionX = camX * 0.4;
  }

  private updateUI(): void {
    this.scoreText.setText(`SCORE: ${this.score}`);

    const crystalText = this.children.getByName("crystalText") as Phaser.GameObjects.Text;
    if (crystalText) {
      crystalText.setText(`x ${this.crystalsCollected}`);
    }
  }

  private collectCrystal(crystal: Phaser.Physics.Arcade.Sprite): void {
    const c = crystal;

    // Particle effect
    this.crystalEmitter.setPosition(c.x, c.y);
    this.crystalEmitter.explode(8);

    // Update stats
    this.crystalsCollected++;
    this.addScore(CRYSTAL_POINTS);

    // Show floating score
    const scorePopup = this.add.text(c.x, c.y - 20, `+${CRYSTAL_POINTS}`, {
      fontFamily: "Arial, sans-serif",
      fontSize: "18px",
      color: "#00d4ff",
    });
    scorePopup.setOrigin(0.5);

    this.tweens.add({
      targets: scorePopup,
      y: scorePopup.y - 40,
      alpha: 0,
      duration: 800,
      onComplete: () => scorePopup.destroy(),
    });

    c.destroy();
  }

  private checkCheckpoints(): void {
    this.checkpoints.forEach((cp) => {
      if (!cp.activated && Math.abs(this.player.x - cp.x) < 40) {
        cp.activated = true;
        cp.sprite.setTexture("checkpoint_active");
        this.lastCheckpointX = cp.x;
        this.lastCheckpointY = cp.y;
        this.checkpointsReached++;
        this.addScore(CHECKPOINT_BONUS);

        // Checkpoint effect
        const text = this.add.text(cp.x, cp.y - 60, "CHECKPOINT!", {
          fontFamily: "Arial, sans-serif",
          fontSize: "20px",
          color: "#00ff88",
        });
        text.setOrigin(0.5);

        this.tweens.add({
          targets: text,
          y: text.y - 30,
          alpha: 0,
          duration: 1500,
          onComplete: () => text.destroy(),
        });
      }
    });
  }

  private hitEnemy(enemy: Enemy): void {
    if (this.isInvulnerable || !enemy.sprite.active) return;

    // Check if player is attacking
    if (this.isAttacking) {
      this.destroyEnemy(enemy);
      return;
    }

    // Check if player is stomping on enemy (jumping on top)
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;

    // Player must be falling and their feet should be above enemy's center
    const playerFeetY = this.player.y + playerBody.halfHeight;

    if (playerBody.velocity.y > 0 && playerFeetY < enemy.sprite.y) {
      // Stomp successful! Destroy enemy and bounce player
      this.destroyEnemy(enemy);
      this.player.setVelocityY(PLAYER_JUMP_VELOCITY * 0.6); // Bounce up
      return;
    }

    this.takeDamage();
  }

  private hitHazard(): void {
    if (this.isInvulnerable) return;
    this.takeDamage();
    this.respawnAtCheckpoint();
  }

  private hitLaser(laser: Phaser.Physics.Arcade.Sprite): void {
    const l = laser;
    if (this.isInvulnerable || !l.visible) return;
    this.takeDamage();

    // Knockback
    const knockbackDir = this.player.x < l.x ? -1 : 1;
    this.player.setVelocityX(knockbackDir * 300);
    this.player.setVelocityY(-200);
  }

  private takeDamage(): void {
    if (this.isInvulnerable) return;

    this.health--;
    this.damageTaken++;
    this.updateHealthDisplay();

    if (this.health <= 0) {
      this.gameOver();
      return;
    }

    // Invulnerability frames
    this.isInvulnerable = true;
    this.player.setTint(0xff0000);

    // Flash effect
    this.tweens.add({
      targets: this.player,
      alpha: { from: 0.3, to: 1 },
      duration: 100,
      repeat: 10,
      onComplete: () => {
        this.isInvulnerable = false;
        this.player.clearTint();
        this.player.setAlpha(1);
      },
    });

    // Camera shake
    this.cameras.main.shake(200, 0.01);
  }

  private respawnAtCheckpoint(): void {
    this.player.setPosition(this.lastCheckpointX, this.lastCheckpointY);
    this.player.setVelocity(0, 0);
  }

  private reachPortal(): void {
    // Victory!
    const stats = this.getStats(true);

    this.scene.start("VictoryScene", {
      stats,
      playerName: this.playerName,
      callbacks: this.callbacks
    });
  }

  private gameOver(): void {
    const stats = this.getStats(false);

    this.scene.start("GameOverScene", {
      stats,
      playerName: this.playerName,
      callbacks: this.callbacks
    });
  }

  private getStats(completed: boolean): GameStats {
    const timeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const timeBonus = Math.max(0, TIME_BONUS_BASE - timeSeconds * TIME_PENALTY_PER_SECOND);

    const finalScore =
      this.crystalsCollected * CRYSTAL_POINTS +
      this.enemiesDefeated * ENEMY_POINTS +
      timeBonus +
      this.checkpointsReached * CHECKPOINT_BONUS -
      this.damageTaken * DAMAGE_PENALTY +
      (completed ? COMPLETION_BONUS : 0);

    return {
      score: Math.max(0, finalScore),
      crystals: this.crystalsCollected,
      enemiesDefeated: this.enemiesDefeated,
      timeSeconds,
      checkpointsReached: this.checkpointsReached,
      damageTaken: this.damageTaken,
      levelCompleted: completed,
    };
  }

  private addScore(points: number): void {
    this.score += points;
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.physics.pause();
      this.pauseOverlay.setVisible(true);

      // Listen for restart
      this.input.keyboard!.once("keydown-R", () => {
        if (this.isPaused) {
          this.physics.resume();
          this.scene.restart();
        }
      });
    } else {
      this.physics.resume();
      this.pauseOverlay.setVisible(false);
    }
  }
}
