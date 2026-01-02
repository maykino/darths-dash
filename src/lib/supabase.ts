import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key-here';

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Game version
export const GAME_VERSION = "2.0.0";

// Scoring constants (must match server)
export const CRYSTAL_POINTS = 150;
export const ENEMY_POINTS = 200;
export const TIME_BONUS_BASE = 5000;
export const TIME_PENALTY_PER_SECOND = 5;
export const DAMAGE_PENALTY = 100;
export const CHECKPOINT_BONUS = 500;
export const COMPLETION_BONUS = 10000;

// Types for our database
export interface GameRun {
  id: number;
  player_name: string;
  score: number;
  crystals: number;
  enemies_defeated: number;
  time_seconds: number;
  checkpoints_reached: number;
  damage_taken: number;
  level_completed: boolean;
  game_version: string;
  created_at: string;
}

export interface ScoreSubmission {
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

// Calculate score based on game stats
export function calculateScore(
  crystals: number,
  enemiesDefeated: number,
  timeSeconds: number,
  checkpointsReached: number,
  damageTaken: number,
  levelCompleted: boolean
): number {
  return (
    crystals * CRYSTAL_POINTS +
    enemiesDefeated * ENEMY_POINTS +
    Math.max(0, TIME_BONUS_BASE - timeSeconds * TIME_PENALTY_PER_SECOND) +
    checkpointsReached * CHECKPOINT_BONUS -
    damageTaken * DAMAGE_PENALTY +
    (levelCompleted ? COMPLETION_BONUS : 0)
  );
}

// Generate run token for anti-tamper verification
export function generateRunToken(
  playerName: string,
  crystals: number,
  enemiesDefeated: number,
  timeSeconds: number
): string {
  const tokenData = `${playerName}-${crystals}-${enemiesDefeated}-${timeSeconds}-${GAME_VERSION}`;
  // Simple hash (client-side, not cryptographically secure but deters casual tampering)
  let hash = 0;
  for (let i = 0; i < tokenData.length; i++) {
    const char = tokenData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0').slice(0, 16);
}

// Submit score via API route (preferred method)
export async function submitScore(data: Omit<ScoreSubmission, 'runToken'>): Promise<{ success: boolean; rank?: number; error?: string }> {
  try {
    const runToken = generateRunToken(
      data.playerName,
      data.crystals,
      data.enemiesDefeated,
      data.timeSeconds
    );

    const response = await fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, runToken }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to submit score' };
    }

    return { success: true, rank: result.rank };
  } catch (error) {
    console.error('Score submission error:', error);
    return { success: false, error: 'Network error' };
  }
}

// Fetch leaderboard data
export async function getLeaderboard(): Promise<{ topScores: GameRun[]; recentRuns: GameRun[] }> {
  try {
    const response = await fetch('/api/score');
    if (!response.ok) {
      throw new Error('Failed to fetch leaderboard');
    }
    return await response.json();
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return { topScores: [], recentRuns: [] };
  }
}

// Get top scores (direct Supabase call for client-side reads)
export async function getTopScores(limit = 10): Promise<GameRun[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("game_runs")
    .select("*")
    .order("score", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }

  return data || [];
}

// Get recent runs
export async function getRecentRuns(limit = 20): Promise<GameRun[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("game_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching recent runs:", error);
    return [];
  }

  return data || [];
}

// Get player's rank for a given score
export async function getPlayerRank(score: number): Promise<number> {
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from("game_runs")
    .select("*", { count: "exact", head: true })
    .gt("score", score);

  if (error) {
    console.error("Error getting rank:", error);
    return 0;
  }

  return (count || 0) + 1;
}

// Player name storage
const PLAYER_NAME_KEY = 'darths_dash_player_name';

export function getStoredPlayerName(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PLAYER_NAME_KEY);
}

export function setStoredPlayerName(name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PLAYER_NAME_KEY, name);
}

export function clearStoredPlayerName(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PLAYER_NAME_KEY);
}

// ============================================
// LocalStorage Fallback Leaderboard
// ============================================

const LOCAL_LEADERBOARD_KEY = 'darths_dash_leaderboard';
const MAX_LOCAL_ENTRIES = 100;

interface LocalLeaderboardEntry {
  id: number;
  player_name: string;
  score: number;
  crystals: number;
  enemies_defeated: number;
  time_seconds: number;
  checkpoints_reached: number;
  damage_taken: number;
  level_completed: boolean;
  created_at: string;
}

function getLocalLeaderboard(): LocalLeaderboardEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(LOCAL_LEADERBOARD_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalLeaderboard(entries: LocalLeaderboardEntry[]): void {
  if (typeof window === 'undefined') return;
  // Keep only top entries sorted by score
  const sorted = entries.sort((a, b) => b.score - a.score).slice(0, MAX_LOCAL_ENTRIES);
  localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(sorted));
}

function addLocalScore(data: Omit<ScoreSubmission, 'runToken'>): { success: boolean; rank: number } {
  const entries = getLocalLeaderboard();
  const newEntry: LocalLeaderboardEntry = {
    id: Date.now(),
    player_name: data.playerName,
    score: data.score,
    crystals: data.crystals,
    enemies_defeated: data.enemiesDefeated,
    time_seconds: data.timeSeconds,
    checkpoints_reached: data.checkpointsReached,
    damage_taken: data.damageTaken,
    level_completed: data.levelCompleted,
    created_at: new Date().toISOString(),
  };
  entries.push(newEntry);
  saveLocalLeaderboard(entries);

  // Calculate rank
  const sorted = entries.sort((a, b) => b.score - a.score);
  const rank = sorted.findIndex(e => e.id === newEntry.id) + 1;

  return { success: true, rank };
}

function getLocalTopScores(limit = 10): LocalLeaderboardEntry[] {
  return getLocalLeaderboard()
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function getLocalRecentRuns(limit = 20): LocalLeaderboardEntry[] {
  return getLocalLeaderboard()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

// ============================================
// Unified API (uses Supabase if available, localStorage otherwise)
// ============================================

export async function submitScoreUnified(data: Omit<ScoreSubmission, 'runToken'>): Promise<{ success: boolean; rank?: number; error?: string }> {
  // Try Supabase first if configured
  if (isSupabaseConfigured) {
    const result = await submitScore(data);
    if (result.success) return result;
    // Fall through to localStorage on error
  }

  // Use localStorage fallback
  const localResult = addLocalScore(data);
  return { success: localResult.success, rank: localResult.rank };
}

export async function getLeaderboardUnified(): Promise<{ topScores: GameRun[]; recentRuns: GameRun[] }> {
  // Try Supabase first if configured
  if (isSupabaseConfigured) {
    try {
      const result = await getLeaderboard();
      if (result.topScores.length > 0 || result.recentRuns.length > 0) {
        return result;
      }
    } catch {
      // Fall through to localStorage
    }
  }

  // Use localStorage fallback
  const topScores = getLocalTopScores(10) as unknown as GameRun[];
  const recentRuns = getLocalRecentRuns(20) as unknown as GameRun[];
  return { topScores, recentRuns };
}

export { isSupabaseConfigured };
