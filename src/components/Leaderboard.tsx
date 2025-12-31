"use client";

import { useEffect, useState } from "react";
import { getTopScores, LeaderboardEntry } from "@/lib/supabase";

interface LeaderboardProps {
  onClose: () => void;
  currentScore?: number;
}

export default function Leaderboard({ onClose, currentScore }: LeaderboardProps) {
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchScores() {
      const topScores = await getTopScores(10);
      setScores(topScores);
      setLoading(false);
    }
    fetchScores();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border-2 border-red-500 rounded-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="pixel-text text-xl text-yellow-400">LEADERBOARD</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            &times;
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="pixel-text text-sm text-gray-400 animate-pulse">
              Loading...
            </p>
          </div>
        ) : scores.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No scores yet!</p>
            <p className="text-gray-500 text-sm mt-2">Be the first to play!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {scores.map((entry, index) => (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index === 0
                    ? "bg-yellow-500/20 border border-yellow-500"
                    : index === 1
                    ? "bg-gray-400/20 border border-gray-400"
                    : index === 2
                    ? "bg-orange-600/20 border border-orange-600"
                    : "bg-gray-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`pixel-text text-lg w-8 ${
                      index === 0
                        ? "text-yellow-400"
                        : index === 1
                        ? "text-gray-300"
                        : index === 2
                        ? "text-orange-400"
                        : "text-gray-500"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="text-white">{entry.player_name}</span>
                </div>
                <span className="pixel-text text-sm text-green-400">
                  {entry.score.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {currentScore !== undefined && currentScore > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-700">
            <p className="text-center text-gray-400">
              Your score: <span className="text-yellow-400">{currentScore}</span>
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          className="btn-game w-full mt-6"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}
