import * as Phaser from "phaser";
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PLAYER_SPEED,
  PLAYER_JUMP_VELOCITY,
  ENEMY_SPEED,
  CRYSTAL_POINTS,
  SURVIVAL_POINTS_PER_SECOND,
} from "../config/gameConfig";

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;

  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Phaser.Physics.Arcade.Group;
  private crystals!: Phaser.Physics.Arcade.Group;

  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private lives = 3;
  private livesText!: Phaser.GameObjects.Text;

  private enemySpawnTimer!: Phaser.Time.TimerEvent;
  private crystalSpawnTimer!: Phaser.Time.TimerEvent;
  private scoreTimer!: Phaser.Time.TimerEvent;

  private isInvulnerable = false;
  private isPaused = false;
  private pauseOverlay!: Phaser.GameObjects.Container;

  private stars: Phaser.GameObjects.Image[] = [];
  private gameSpeed = 1;

  constructor() {
    super({ key: "GameScene" });
  }

  init(): void {
    this.score = 0;
    this.lives = 3;
    this.isInvulnerable = false;
    this.isPaused = false;
    this.gameSpeed = 1;
  }

  create(): void {
    // Create starfield background
    this.createStarfield();

    // Create ground and platforms
    this.createLevel();

    // Create player
    this.createPlayer();

    // Create enemy and crystal groups
    this.enemies = this.physics.add.group();
    this.crystals = this.physics.add.group();

    // Collisions
    this.physics.add.collider(this.player, this.platforms);

    // Overlaps
    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.handleEnemyCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.crystals,
      this.handleCrystalCollect as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.spaceKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    this.escKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.ESC
    );

    // UI
    this.createUI();

    // Create pause overlay
    this.createPauseOverlay();

    // Spawn timers
    this.enemySpawnTimer = this.time.addEvent({
      delay: 2000,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true,
    });

    this.crystalSpawnTimer = this.time.addEvent({
      delay: 3000,
      callback: this.spawnCrystal,
      callbackScope: this,
      loop: true,
    });

    // Score timer (points for survival)
    this.scoreTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.addScore(SURVIVAL_POINTS_PER_SECOND);
        // Increase difficulty over time
        this.gameSpeed = Math.min(2, 1 + this.score / 5000);
      },
      callbackScope: this,
      loop: true,
    });

    // Spawn initial crystal
    this.time.delayedCall(500, () => this.spawnCrystal());
  }

  update(): void {
    if (this.isPaused) {
      // Check for unpause
      if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
        this.togglePause();
      }
      return;
    }

    // Check for pause
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.togglePause();
      return;
    }

    // Update starfield
    this.updateStarfield();

    // Player movement
    this.handlePlayerMovement();

    // Update enemies
    this.updateEnemies();

    // Update crystals
    this.updateCrystals();

    // Check if player fell off the world
    if (this.player.y > GAME_HEIGHT + 50) {
      this.handlePlayerDeath();
    }
  }

  private createStarfield(): void {
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT - 100);
      const star = this.add.image(x, y, "star");
      star.setScale(0.3 + Math.random() * 0.4);
      star.setAlpha(0.2 + Math.random() * 0.5);
      star.setDepth(-1);
      this.stars.push(star);
    }
  }

  private updateStarfield(): void {
    this.stars.forEach((star, index) => {
      star.x -= (0.5 + (index % 3) * 0.3) * this.gameSpeed;
      if (star.x < -10) {
        star.x = GAME_WIDTH + 10;
        star.y = Phaser.Math.Between(0, GAME_HEIGHT - 100);
      }
    });
  }

  private createLevel(): void {
    this.platforms = this.physics.add.staticGroup();

    // Create ground
    for (let x = 0; x < GAME_WIDTH + 64; x += 64) {
      const ground = this.platforms.create(x, GAME_HEIGHT - 16, "ground");
      ground.setOrigin(0, 0.5);
      ground.refreshBody();
    }

    // Create some floating platforms
    const platformPositions = [
      { x: 200, y: 350 },
      { x: 450, y: 280 },
      { x: 650, y: 350 },
      { x: 100, y: 220 },
      { x: 550, y: 180 },
    ];

    platformPositions.forEach((pos) => {
      const platform = this.platforms.create(pos.x, pos.y, "platform");
      platform.refreshBody();
    });
  }

  private createPlayer(): void {
    this.player = this.physics.add.sprite(100, GAME_HEIGHT - 100, "vader");
    this.player.setBounce(0.1);
    this.player.setCollideWorldBounds(true);
    this.player.setSize(32, 56);
    this.player.setOffset(8, 4);
    this.player.play("vader-idle");
  }

  private createUI(): void {
    // Score
    this.scoreText = this.add.text(16, 16, "SCORE: 0", {
      fontFamily: "Press Start 2P, monospace",
      fontSize: "14px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 2,
    });

    // Lives
    this.livesText = this.add.text(GAME_WIDTH - 16, 16, "LIVES: 3", {
      fontFamily: "Press Start 2P, monospace",
      fontSize: "14px",
      color: "#ff0000",
      stroke: "#000000",
      strokeThickness: 2,
    });
    this.livesText.setOrigin(1, 0);
  }

  private createPauseOverlay(): void {
    const overlay = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.7
    );

    const pauseText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, "PAUSED", {
      fontFamily: "Press Start 2P, monospace",
      fontSize: "32px",
      color: "#ffffff",
    });
    pauseText.setOrigin(0.5);

    const resumeText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 30,
      "Press ESC to resume",
      {
        fontFamily: "Press Start 2P, monospace",
        fontSize: "12px",
        color: "#ffff00",
      }
    );
    resumeText.setOrigin(0.5);

    this.pauseOverlay = this.add.container(0, 0, [
      overlay,
      pauseText,
      resumeText,
    ]);
    this.pauseOverlay.setVisible(false);
    this.pauseOverlay.setDepth(100);
  }

  private handlePlayerMovement(): void {
    const onGround = this.player.body?.touching.down || false;

    // Horizontal movement
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-PLAYER_SPEED);
      this.player.setFlipX(true);
      if (onGround) this.player.play("vader-run", true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(PLAYER_SPEED);
      this.player.setFlipX(false);
      if (onGround) this.player.play("vader-run", true);
    } else {
      this.player.setVelocityX(0);
      if (onGround) this.player.play("vader-idle", true);
    }

    // Jumping
    if (
      (this.cursors.up.isDown || this.spaceKey.isDown) &&
      onGround
    ) {
      this.player.setVelocityY(PLAYER_JUMP_VELOCITY);
    }
  }

  private spawnEnemy(): void {
    const y = Phaser.Math.Between(80, GAME_HEIGHT - 150);
    const enemy = this.enemies.create(
      GAME_WIDTH + 50,
      y,
      "babyYoda"
    ) as Phaser.Physics.Arcade.Sprite;

    enemy.setVelocityX(-ENEMY_SPEED * this.gameSpeed);
    enemy.body!.setAllowGravity(false);
    enemy.play("yoda-fly");

    // Add floating motion
    this.tweens.add({
      targets: enemy,
      y: enemy.y + Phaser.Math.Between(-30, 30),
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private spawnCrystal(): void {
    const x = Phaser.Math.Between(100, GAME_WIDTH - 100);
    const y = Phaser.Math.Between(100, GAME_HEIGHT - 150);

    const crystal = this.crystals.create(
      x,
      y,
      "crystal"
    ) as Phaser.Physics.Arcade.Sprite;

    crystal.body!.setAllowGravity(false);
    crystal.play("crystal-sparkle");

    // Add floating animation
    this.tweens.add({
      targets: crystal,
      y: crystal.y - 10,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Add sparkle effect
    this.tweens.add({
      targets: crystal,
      alpha: { from: 1, to: 0.6 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  private updateEnemies(): void {
    this.enemies.getChildren().forEach((enemy) => {
      const sprite = enemy as Phaser.Physics.Arcade.Sprite;
      if (sprite.x < -100) {
        sprite.destroy();
      }
    });
  }

  private updateCrystals(): void {
    // Crystals stay until collected, but limit total number
    if (this.crystals.getLength() > 5) {
      const oldest = this.crystals.getFirstAlive();
      if (oldest) {
        (oldest as Phaser.Physics.Arcade.Sprite).destroy();
      }
    }
  }

  private handleEnemyCollision(
    player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ): void {
    if (this.isInvulnerable) return;

    const enemySprite = enemy as Phaser.Physics.Arcade.Sprite;
    enemySprite.destroy();

    this.lives--;
    this.livesText.setText(`LIVES: ${this.lives}`);

    if (this.lives <= 0) {
      this.gameOver();
    } else {
      // Become invulnerable briefly
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

      // Screen shake
      this.cameras.main.shake(200, 0.01);
    }
  }

  private handleCrystalCollect(
    player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    crystal: Phaser.Types.Physics.Arcade.GameObjectWithBody
  ): void {
    const crystalSprite = crystal as Phaser.Physics.Arcade.Sprite;

    // Pop effect
    this.tweens.add({
      targets: crystalSprite,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        crystalSprite.destroy();
      },
    });

    this.addScore(CRYSTAL_POINTS);

    // Show floating score text
    const scorePopup = this.add.text(
      crystalSprite.x,
      crystalSprite.y,
      `+${CRYSTAL_POINTS}`,
      {
        fontFamily: "Press Start 2P, monospace",
        fontSize: "12px",
        color: "#00bfff",
      }
    );
    scorePopup.setOrigin(0.5);

    this.tweens.add({
      targets: scorePopup,
      y: scorePopup.y - 30,
      alpha: 0,
      duration: 800,
      onComplete: () => {
        scorePopup.destroy();
      },
    });
  }

  private addScore(points: number): void {
    this.score += points;
    this.scoreText.setText(`SCORE: ${this.score}`);
  }

  private handlePlayerDeath(): void {
    this.lives--;
    this.livesText.setText(`LIVES: ${this.lives}`);

    if (this.lives <= 0) {
      this.gameOver();
    } else {
      // Respawn player
      this.player.setPosition(100, GAME_HEIGHT - 100);
      this.player.setVelocity(0, 0);

      // Brief invulnerability
      this.isInvulnerable = true;
      this.player.setTint(0xff0000);

      this.time.delayedCall(2000, () => {
        this.isInvulnerable = false;
        this.player.clearTint();
      });
    }
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.physics.pause();
      this.enemySpawnTimer.paused = true;
      this.crystalSpawnTimer.paused = true;
      this.scoreTimer.paused = true;
      this.pauseOverlay.setVisible(true);
    } else {
      this.physics.resume();
      this.enemySpawnTimer.paused = false;
      this.crystalSpawnTimer.paused = false;
      this.scoreTimer.paused = false;
      this.pauseOverlay.setVisible(false);
    }
  }

  private gameOver(): void {
    // Stop timers
    this.enemySpawnTimer.destroy();
    this.crystalSpawnTimer.destroy();
    this.scoreTimer.destroy();

    // Call external callback if provided
    const onGameOver = this.registry.get("onGameOver");
    if (onGameOver) {
      onGameOver(this.score);
    }

    // Transition to game over scene
    this.scene.start("GameOverScene", { score: this.score });
  }
}
