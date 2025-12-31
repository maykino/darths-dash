"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback } from "react";
import { getStoredPlayerName, setStoredPlayerName } from "@/lib/supabase";

// Dynamically import the game component to avoid SSR issues with Phaser
const GameComponent = dynamic(() => import("@/components/GameComponent"), {
  ssr: false,
  loading: () => (
    <div className="game-loading">
      <div className="loading-content">
        <h1 className="pixel-text text-4xl text-red-500 glow-red mb-8">
          DARTH&apos;S DASH
        </h1>
        <div className="pixel-text text-white text-xl animate-pulse">
          Loading Game...
        </div>
        <div className="loading-bar mt-6">
          <div className="loading-bar-fill"></div>
        </div>
      </div>
    </div>
  ),
});

export default function Home() {
  const [playerName, setPlayerName] = useState("PLAYER");
  const [highScore, setHighScore] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedName = getStoredPlayerName();
    if (storedName) {
      setPlayerName(storedName);
    }
  }, []);

  const handleGameOver = useCallback((score: number) => {
    if (score > highScore) {
      setHighScore(score);
    }
  }, [highScore]);

  const handleNameChange = useCallback((name: string) => {
    setPlayerName(name);
    setStoredPlayerName(name);
  }, []);

  if (!isClient) {
    return (
      <div className="game-loading">
        <div className="loading-content">
          <h1 className="pixel-text text-4xl text-red-500 glow-red">
            DARTH&apos;S DASH
          </h1>
        </div>
      </div>
    );
  }

  return (
    <main className="game-page">
      <div className="game-wrapper">
        <GameComponent
          playerName={playerName}
          onGameOver={handleGameOver}
          onNameChange={handleNameChange}
        />
      </div>
    </main>
  );
}
