// Leaderboard Client Library
// Uses API for database storage, falls back to localStorage

// Game version
export const GAME_VERSION = "2.0.0";

// Scoring constants
export const CRYSTAL_POINTS = 150;
export const ENEMY_POINTS = 200;
export const TIME_BONUS_BASE = 5000;
export const TIME_PENALTY_PER_SECOND = 5;
export const DAMAGE_PENALTY = 100;
export const CHECKPOINT_BONUS = 500;
export const COMPLETION_BONUS = 10000;

// Types
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
  return Math.max(0,
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
  let hash = 0;
  for (let i = 0; i < tokenData.length; i++) {
    const char = tokenData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0').slice(0, 16);
}

// ============================================
// LocalStorage Fallback
// ============================================

const LOCAL_LEADERBOARD_KEY = 'darths_dash_leaderboard';
const MAX_LOCAL_ENTRIES = 100;

function getLocalLeaderboard(): GameRun[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(LOCAL_LEADERBOARD_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalLeaderboard(entries: GameRun[]): void {
  if (typeof window === 'undefined') return;
  const sorted = entries.sort((a, b) => b.score - a.score).slice(0, MAX_LOCAL_ENTRIES);
  localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(sorted));
}

function addLocalScore(data: ScoreSubmission): { success: boolean; rank: number } {
  const entries = getLocalLeaderboard();
  const newEntry: GameRun = {
    id: Date.now(),
    player_name: data.playerName,
    score: data.score,
    crystals: data.crystals,
    enemies_defeated: data.enemiesDefeated,
    time_seconds: data.timeSeconds,
    checkpoints_reached: data.checkpointsReached,
    damage_taken: data.damageTaken,
    level_completed: data.levelCompleted,
    game_version: GAME_VERSION,
    created_at: new Date().toISOString(),
  };
  entries.push(newEntry);
  saveLocalLeaderboard(entries);

  const sorted = entries.sort((a, b) => b.score - a.score);
  const rank = sorted.findIndex(e => e.id === newEntry.id) + 1;

  return { success: true, rank };
}

function getLocalTopScores(limit = 10): GameRun[] {
  return getLocalLeaderboard()
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function getLocalRecentRuns(limit = 20): GameRun[] {
  return getLocalLeaderboard()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

// ============================================
// API Functions (try server, fallback to local)
// ============================================

export async function submitScoreUnified(data: ScoreSubmission): Promise<{ success: boolean; rank?: number; error?: string }> {
  const runToken = generateRunToken(
    data.playerName,
    data.crystals,
    data.enemiesDefeated,
    data.timeSeconds
  );

  try {
    const response = await fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, runToken }),
    });

    if (response.ok) {
      const result = await response.json();
      return { success: true, rank: result.rank };
    }
    // Server error or not configured - fall through to local
  } catch {
    // Network error - fall through to local
  }

  // Use localStorage fallback
  const localResult = addLocalScore(data);
  return { success: localResult.success, rank: localResult.rank };
}

export async function getLeaderboardUnified(): Promise<{ topScores: GameRun[]; recentRuns: GameRun[] }> {
  try {
    const response = await fetch('/api/score');
    if (response.ok) {
      const result = await response.json();
      if (result.topScores?.length > 0 || result.recentRuns?.length > 0) {
        return result;
      }
    }
  } catch {
    // Network error - fall through to local
  }

  // Use localStorage fallback
  return {
    topScores: getLocalTopScores(10),
    recentRuns: getLocalRecentRuns(20),
  };
}

// ============================================
// Player Name Storage
// ============================================

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
