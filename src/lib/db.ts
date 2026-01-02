import { Pool } from 'pg';

// PostgreSQL connection pool (for Railway or any PostgreSQL database)
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    })
  : null;

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

export async function insertGameRun(data: {
  playerName: string;
  score: number;
  crystals: number;
  enemiesDefeated: number;
  timeSeconds: number;
  checkpointsReached: number;
  damageTaken: number;
  levelCompleted: boolean;
  runHash?: string;
}): Promise<GameRun | null> {
  if (!pool) return null;

  try {
    const result = await pool.query<GameRun>(
      `INSERT INTO game_runs
        (player_name, score, crystals, enemies_defeated, time_seconds,
         checkpoints_reached, damage_taken, level_completed, game_version, run_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        data.playerName,
        data.score,
        data.crystals,
        data.enemiesDefeated,
        data.timeSeconds,
        data.checkpointsReached,
        data.damageTaken,
        data.levelCompleted,
        '2.0.0',
        data.runHash || null,
      ]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Database insert error:', error);
    return null;
  }
}

export async function getTopScores(limit = 10): Promise<GameRun[]> {
  if (!pool) return [];

  try {
    const result = await pool.query<GameRun>(
      `SELECT id, player_name, score, crystals, enemies_defeated,
              time_seconds, level_completed, created_at
       FROM game_runs
       ORDER BY score DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    return [];
  }
}

export async function getRecentRuns(limit = 20): Promise<GameRun[]> {
  if (!pool) return [];

  try {
    const result = await pool.query<GameRun>(
      `SELECT id, player_name, score, crystals, enemies_defeated,
              time_seconds, level_completed, created_at
       FROM game_runs
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    return [];
  }
}

export async function getScoreRank(score: number): Promise<number> {
  if (!pool) return 0;

  try {
    const result = await pool.query<{ rank: number }>(
      'SELECT get_score_rank($1) as rank',
      [score]
    );
    return result.rows[0]?.rank || 0;
  } catch (error) {
    // Fallback if function doesn't exist
    try {
      const result = await pool.query<{ count: string }>(
        'SELECT COUNT(*) as count FROM game_runs WHERE score > $1',
        [score]
      );
      return parseInt(result.rows[0]?.count || '0') + 1;
    } catch {
      return 0;
    }
  }
}

export function isDatabaseConfigured(): boolean {
  return pool !== null;
}
