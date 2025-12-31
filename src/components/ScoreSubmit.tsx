"use client";

import { useState } from "react";
import { submitScore, getPlayerRank } from "@/lib/supabase";

interface ScoreSubmitProps {
  score: number;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function ScoreSubmit({ score, onClose, onSubmitted }: ScoreSubmitProps) {
  const [playerName, setPlayerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rank, setRank] = useState<number | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!playerName.trim()) {
      setError("Please enter your name!");
      return;
    }

    if (playerName.length > 20) {
      setError("Name must be 20 characters or less!");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const result = await submitScore(playerName.trim(), score);

      if (result) {
        const playerRank = await getPlayerRank(score);
        setRank(playerRank);
        setSubmitted(true);
        onSubmitted();
      } else {
        setError("Failed to submit score. Try again!");
      }
    } catch (err) {
      setError("Something went wrong. Try again!");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border-2 border-yellow-500 rounded-xl p-6 max-w-md w-full">
        {!submitted ? (
          <>
            <h2 className="pixel-text text-xl text-yellow-400 text-center mb-4">
              SUBMIT SCORE
            </h2>

            <div className="text-center mb-6">
              <p className="text-gray-400 mb-2">Your Score</p>
              <p className="pixel-text text-3xl text-green-400">
                {score.toLocaleString()}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Enter Your Name
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={20}
                  placeholder="Player Name"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                  disabled={submitting}
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                  disabled={submitting}
                >
                  Skip
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-game"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Submit"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center">
            <h2 className="pixel-text text-xl text-green-400 mb-4">
              SCORE SAVED!
            </h2>

            <div className="mb-6">
              <p className="text-gray-400 mb-2">Your Rank</p>
              <p className="pixel-text text-4xl text-yellow-400">#{rank}</p>
            </div>

            <p className="text-gray-400 mb-6">
              Nice job, <span className="text-white">{playerName}</span>!
            </p>

            <button onClick={onClose} className="btn-game w-full">
              CONTINUE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
