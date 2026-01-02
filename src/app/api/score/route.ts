import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { insertGameRun, getTopScores, getRecentRuns, getScoreRank, isDatabaseConfigured } from "@/lib/db";

// Game version for validation
const GAME_VERSION = "2.0.0";

// Scoring constants (must match client)
const CRYSTAL_POINTS = 150;
const ENEMY_POINTS = 200;
const TIME_BONUS_BASE = 5000;
const TIME_PENALTY_PER_SECOND = 5;
const DAMAGE_PENALTY = 100;
const CHECKPOINT_BONUS = 500;
const COMPLETION_BONUS = 10000;

interface ScoreSubmission {
  playerName: string;
  score: number;
  crystals: number;
  enemiesDefeated: number;
  timeSeconds: number;
  checkpointsReached: number;
  damageTaken: number;
  levelCompleted: boolean;
  runToken: string;
}

// Validate the score calculation matches expected formula
function validateScore(data: ScoreSubmission): boolean {
  const calculatedScore =
    data.crystals * CRYSTAL_POINTS +
    data.enemiesDefeated * ENEMY_POINTS +
    Math.max(0, TIME_BONUS_BASE - data.timeSeconds * TIME_PENALTY_PER_SECOND) +
    data.checkpointsReached * CHECKPOINT_BONUS -
    data.damageTaken * DAMAGE_PENALTY +
    (data.levelCompleted ? COMPLETION_BONUS : 0);

  // Allow 10% tolerance for timing differences
  const tolerance = Math.max(100, calculatedScore * 0.1);
  return Math.abs(data.score - calculatedScore) <= tolerance;
}

// Generate expected run token for verification
function generateExpectedToken(data: ScoreSubmission): string {
  const tokenData = `${data.playerName}-${data.crystals}-${data.enemiesDefeated}-${data.timeSeconds}-${GAME_VERSION}`;
  return crypto.createHash("sha256").update(tokenData).digest("hex").slice(0, 16);
}

export async function POST(request: NextRequest) {
  // Check if database is configured
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database not configured. Scores are saved locally." },
      { status: 503 }
    );
  }

  try {
    const data: ScoreSubmission = await request.json();

    // Validate required fields
    if (!data.playerName || typeof data.playerName !== "string") {
      return NextResponse.json({ error: "Invalid player name" }, { status: 400 });
    }

    const playerName = data.playerName.trim().slice(0, 20);
    if (playerName.length < 1) {
      return NextResponse.json({ error: "Player name required" }, { status: 400 });
    }

    // Validate numeric fields
    if (
      typeof data.score !== "number" ||
      typeof data.crystals !== "number" ||
      typeof data.enemiesDefeated !== "number" ||
      typeof data.timeSeconds !== "number"
    ) {
      return NextResponse.json({ error: "Invalid score data" }, { status: 400 });
    }

    // Sanity checks
    if (data.score < 0 || data.score > 9999999) {
      return NextResponse.json({ error: "Score out of range" }, { status: 400 });
    }
    if (data.crystals < 0 || data.crystals > 9999) {
      return NextResponse.json({ error: "Crystals out of range" }, { status: 400 });
    }
    if (data.enemiesDefeated < 0 || data.enemiesDefeated > 9999) {
      return NextResponse.json({ error: "Enemies out of range" }, { status: 400 });
    }
    if (data.timeSeconds < 0 || data.timeSeconds > 36000) {
      return NextResponse.json({ error: "Time out of range" }, { status: 400 });
    }

    // Validate run token (simple anti-tamper)
    const expectedToken = generateExpectedToken(data);
    if (data.runToken !== expectedToken) {
      console.warn("Invalid run token submitted", {
        expected: expectedToken,
        received: data.runToken,
      });
      // Don't reject, but flag it
    }

    // Validate score calculation
    if (!validateScore(data)) {
      console.warn("Score validation failed", data);
      // Still allow submission but could flag for review
    }

    // Insert into database
    const result = await insertGameRun({
      playerName,
      score: Math.round(data.score),
      crystals: Math.round(data.crystals),
      enemiesDefeated: Math.round(data.enemiesDefeated),
      timeSeconds: Math.round(data.timeSeconds),
      checkpointsReached: Math.round(data.checkpointsReached || 0),
      damageTaken: Math.round(data.damageTaken || 0),
      levelCompleted: Boolean(data.levelCompleted),
      runHash: data.runToken || undefined,
    });

    if (!result) {
      return NextResponse.json({ error: "Failed to save score" }, { status: 500 });
    }

    // Get player's rank
    const rank = await getScoreRank(data.score);

    return NextResponse.json({
      success: true,
      id: result.id,
      rank: rank,
    });
  } catch (error) {
    console.error("Score submission error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  // Check if database is configured
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      topScores: [],
      recentRuns: [],
      message: "Database not configured. Using local storage.",
    });
  }

  try {
    const [topScores, recentRuns] = await Promise.all([
      getTopScores(10),
      getRecentRuns(20),
    ]);

    return NextResponse.json({
      topScores,
      recentRuns,
    });
  } catch (error) {
    console.error("Leaderboard fetch error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
