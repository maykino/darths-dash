"use client";

import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { createGameConfig } from "@/game/config/gameConfig";

interface GameComponentProps {
  onGameOver?: (score: number) => void;
}

export default function GameComponent({ onGameOver }: GameComponentProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    // Destroy existing game instance if it exists
    if (gameRef.current) {
      gameRef.current.destroy(true);
    }

    // Create new game instance
    const config = createGameConfig(containerRef.current, onGameOver);
    gameRef.current = new Phaser.Game(config);

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [onGameOver]);

  return (
    <div
      ref={containerRef}
      className="game-canvas"
      style={{
        width: "100%",
        maxWidth: "800px",
        aspectRatio: "16/9",
      }}
    />
  );
}
