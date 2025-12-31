"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

// Dynamically import the game component to avoid SSR issues with Phaser
const GameComponent = dynamic(() => import("@/components/GameComponent"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="pixel-text text-white text-xl animate-pulse">
        Loading Game...
      </div>
    </div>
  ),
});

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false);
  const [highScore, setHighScore] = useState(0);

  const handleGameOver = (score: number) => {
    if (score > highScore) {
      setHighScore(score);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <header className="text-center mb-8">
        <h1 className="pixel-text text-4xl md:text-5xl text-red-500 mb-4 glow-red inline-block px-4">
          DARTH&apos;S DASH
        </h1>
        <p className="text-gray-300 text-lg">
          Dodge the Baby Yodas! Collect crystals! Save the galaxy!
        </p>
      </header>

      {!gameStarted ? (
        <div className="text-center space-y-8">
          <div className="bg-black/50 p-8 rounded-xl border-2 border-red-500/50 max-w-md">
            <h2 className="pixel-text text-xl text-yellow-400 mb-6">
              HOW TO PLAY
            </h2>
            <ul className="text-gray-300 space-y-3 text-left">
              <li>🎮 Use <span className="text-yellow-400">ARROW KEYS</span> to move</li>
              <li>⬆️ Press <span className="text-yellow-400">UP / SPACE</span> to jump</li>
              <li>💎 Collect <span className="text-blue-400">crystals</span> for points</li>
              <li>🚗 Avoid <span className="text-green-400">Baby Yodas</span> in cars!</li>
            </ul>

            {highScore > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-600">
                <p className="pixel-text text-sm text-yellow-400">
                  HIGH SCORE: {highScore}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setGameStarted(true)}
            className="btn-game text-xl px-10 py-4"
          >
            START GAME
          </button>
        </div>
      ) : (
        <div className="game-container">
          <GameComponent onGameOver={handleGameOver} />
        </div>
      )}

      <footer className="mt-8 text-gray-500 text-sm">
        <p>Press ESC to pause | A fun game for kids</p>
      </footer>
    </main>
  );
}
