import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Server-side Supabase client with service role key (lazy initialization for build)
let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error("Missing Supabase configuration");
    }

    supabaseAdmin = createClient(url, key);
  }
  return supabaseAdmin;
}

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
    const { data: result, error } = await getSupabaseAdmin()
      .from("game_runs")
      .insert([
        {
          player_name: playerName,
          score: Math.round(data.score),
          crystals: Math.round(data.crystals),
          enemies_defeated: Math.round(data.enemiesDefeated),
          time_seconds: Math.round(data.timeSeconds),
          checkpoints_reached: Math.round(data.checkpointsReached || 0),
          damage_taken: Math.round(data.damageTaken || 0),
          level_completed: Boolean(data.levelCompleted),
          game_version: GAME_VERSION,
          run_hash: data.runToken || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to save score" }, { status: 500 });
    }

    // Get player's rank
    const { data: rankData } = await getSupabaseAdmin().rpc("get_score_rank", {
      player_score: data.score,
    });

    return NextResponse.json({
      success: true,
      id: result.id,
      rank: rankData || 0,
    });
  } catch (error) {
    console.error("Score submission error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Get top 10 scores
    const { data: topScores, error: topError } = await getSupabaseAdmin()
      .from("game_runs")
      .select("id, player_name, score, crystals, enemies_defeated, time_seconds, level_completed, created_at")
      .order("score", { ascending: false })
      .limit(10);

    if (topError) {
      return NextResponse.json({ error: "Failed to fetch scores" }, { status: 500 });
    }

    // Get recent 20 runs
    const { data: recentRuns, error: recentError } = await getSupabaseAdmin()
      .from("game_runs")
      .select("id, player_name, score, crystals, enemies_defeated, time_seconds, level_completed, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    if (recentError) {
      return NextResponse.json({ error: "Failed to fetch recent runs" }, { status: 500 });
    }

    return NextResponse.json({
      topScores: topScores || [],
      recentRuns: recentRuns || [],
    });
  } catch (error) {
    console.error("Leaderboard fetch error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
