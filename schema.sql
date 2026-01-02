-- Darth's Dash Leaderboard Schema
-- Run this on your Railway PostgreSQL database

CREATE TABLE IF NOT EXISTS game_runs (
  id SERIAL PRIMARY KEY,
  player_name VARCHAR(20) NOT NULL,
  score INTEGER NOT NULL,
  crystals INTEGER DEFAULT 0,
  enemies_defeated INTEGER DEFAULT 0,
  time_seconds INTEGER DEFAULT 0,
  checkpoints_reached INTEGER DEFAULT 0,
  damage_taken INTEGER DEFAULT 0,
  level_completed BOOLEAN DEFAULT FALSE,
  game_version VARCHAR(20) DEFAULT '2.0.0',
  run_hash VARCHAR(32),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_game_runs_score ON game_runs(score DESC);
CREATE INDEX IF NOT EXISTS idx_game_runs_created_at ON game_runs(created_at DESC);

-- Function to get rank for a given score
CREATE OR REPLACE FUNCTION get_score_rank(player_score INTEGER)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER + 1
  FROM game_runs
  WHERE score > player_score;
$$ LANGUAGE SQL;
