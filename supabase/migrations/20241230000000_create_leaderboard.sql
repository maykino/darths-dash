-- Darth's Dash Leaderboard Schema
-- Migration: Create leaderboard table

-- Create the leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
    id BIGSERIAL PRIMARY KEY,
    player_name VARCHAR(20) NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index for faster score queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);

-- Enable Row Level Security
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read the leaderboard
CREATE POLICY "Anyone can view leaderboard" ON leaderboard
    FOR SELECT
    USING (true);

-- Policy: Anyone can insert their own scores (no auth required for kids game)
CREATE POLICY "Anyone can submit scores" ON leaderboard
    FOR INSERT
    WITH CHECK (true);
