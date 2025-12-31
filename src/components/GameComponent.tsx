"use client";

import { useEffect, useRef, useCallback } from "react";
import * as Phaser from "phaser";
import { createGameConfig, GameCallbacks } from "@/game/config/gameConfig";

interface GameComponentProps {
  playerName: string;
  onGameOver?: (score: number) => void;
  onNameChange?: (name: string) => void;
}

export default function GameComponent({
  playerName,
  onGameOver,
  onNameChange
}: GameComponentProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getPlayerName = useCallback(() => playerName, [playerName]);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    // Destroy existing game instance if it exists
    if (gameRef.current) {
      gameRef.current.destroy(true);
    }

    // Create callbacks object
    const callbacks: GameCallbacks = {
      onGameOver,
      onNameChange,
      getPlayerName,
    };

    // Create new game instance
    const config = createGameConfig(containerRef.current, callbacks);
    gameRef.current = new Phaser.Game(config);

    // Pass initial data to MenuScene when it starts
    gameRef.current.events.on("ready", () => {
      const menuScene = gameRef.current?.scene.getScene("MenuScene");
      if (menuScene) {
        menuScene.scene.restart({ callbacks, playerName });
      }
    });

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [onGameOver, onNameChange, getPlayerName, playerName]);

  return (
    <div
      ref={containerRef}
      className="game-canvas"
      style={{
        width: "100%",
        maxWidth: "1280px",
        aspectRatio: "16/9",
      }}
    />
  );
}
