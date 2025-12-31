-- Darth's Dash Game Runs Schema
-- Migration: Create game_runs table for comprehensive leaderboard

-- Drop existing leaderboard if it exists (we're upgrading the schema)
DROP TABLE IF EXISTS leaderboard;

-- Create the game_runs table with comprehensive tracking
CREATE TABLE game_runs (
    id BIGSERIAL PRIMARY KEY,
    player_name VARCHAR(20) NOT NULL,
    score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 9999999),
    crystals INTEGER NOT NULL DEFAULT 0 CHECK (crystals >= 0 AND crystals <= 9999),
    enemies_defeated INTEGER NOT NULL DEFAULT 0 CHECK (enemies_defeated >= 0 AND enemies_defeated <= 9999),
    time_seconds INTEGER NOT NULL DEFAULT 0 CHECK (time_seconds >= 0 AND time_seconds <= 36000),
    checkpoints_reached INTEGER NOT NULL DEFAULT 0,
    damage_taken INTEGER NOT NULL DEFAULT 0,
    level_completed BOOLEAN NOT NULL DEFAULT false,
    game_version VARCHAR(10) NOT NULL DEFAULT '2.0.0',
    run_hash VARCHAR(64), -- Simple anti-tamper hash
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast leaderboard queries
CREATE INDEX idx_game_runs_score ON game_runs(score DESC);
CREATE INDEX idx_game_runs_created_at ON game_runs(created_at DESC);
CREATE INDEX idx_game_runs_player_name ON game_runs(player_name);
CREATE INDEX idx_game_runs_completed ON game_runs(level_completed, score DESC);

-- Enable Row Level Security
ALTER TABLE game_runs ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read the leaderboard (for displaying scores)
CREATE POLICY "Anyone can view game runs" ON game_runs
    FOR SELECT
    USING (true);

-- Policy: Only authenticated or server can insert (via API route)
-- For now, allow anon insert but we'll validate via API route
CREATE POLICY "Allow score submissions" ON game_runs
    FOR INSERT
    WITH CHECK (
        -- Basic validation: player name is not empty
        length(trim(player_name)) >= 1 AND
        length(trim(player_name)) <= 20 AND
        -- Score sanity check
        score >= 0 AND score <= 9999999 AND
        -- Time sanity (max 10 hours)
        time_seconds >= 0 AND time_seconds <= 36000
    );

-- Deny updates and deletes for everyone (scores are immutable)
CREATE POLICY "Deny updates" ON game_runs
    FOR UPDATE
    USING (false);

CREATE POLICY "Deny deletes" ON game_runs
    FOR DELETE
    USING (false);

-- Function to get top scores
CREATE OR REPLACE FUNCTION get_top_game_runs(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id BIGINT,
    player_name VARCHAR(20),
    score INTEGER,
    crystals INTEGER,
    enemies_defeated INTEGER,
    time_seconds INTEGER,
    level_completed BOOLEAN,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        gr.id,
        gr.player_name,
        gr.score,
        gr.crystals,
        gr.enemies_defeated,
        gr.time_seconds,
        gr.level_completed,
        gr.created_at
    FROM game_runs gr
    ORDER BY gr.score DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get recent runs
CREATE OR REPLACE FUNCTION get_recent_runs(limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
    id BIGINT,
    player_name VARCHAR(20),
    score INTEGER,
    crystals INTEGER,
    enemies_defeated INTEGER,
    time_seconds INTEGER,
    level_completed BOOLEAN,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        gr.id,
        gr.player_name,
        gr.score,
        gr.crystals,
        gr.enemies_defeated,
        gr.time_seconds,
        gr.level_completed,
        gr.created_at
    FROM game_runs gr
    ORDER BY gr.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get player rank
CREATE OR REPLACE FUNCTION get_score_rank(player_score INTEGER)
RETURNS INTEGER AS $$
DECLARE
    rank_position INTEGER;
BEGIN
    SELECT COUNT(*) + 1 INTO rank_position
    FROM game_runs
    WHERE score > player_score;

    RETURN rank_position;
END;
$$ LANGUAGE plpgsql;
