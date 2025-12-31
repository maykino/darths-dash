-- Darth's Dash Leaderboard Schema
-- Run this in your Supabase SQL editor to set up the database

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

-- Optional: Create a function to get top 10 scores
CREATE OR REPLACE FUNCTION get_top_scores(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id BIGINT,
    player_name VARCHAR(20),
    score INTEGER,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT l.id, l.player_name, l.score, l.created_at
    FROM leaderboard l
    ORDER BY l.score DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Optional: Function to get player's rank
CREATE OR REPLACE FUNCTION get_player_rank(player_score INTEGER)
RETURNS INTEGER AS $$
DECLARE
    rank_position INTEGER;
BEGIN
    SELECT COUNT(*) + 1 INTO rank_position
    FROM leaderboard
    WHERE score > player_score;

    RETURN rank_position;
END;
$$ LANGUAGE plpgsql;
