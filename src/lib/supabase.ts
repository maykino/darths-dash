import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export interface LeaderboardEntry {
  id: number;
  player_name: string;
  score: number;
  created_at: string;
}

// Leaderboard functions
export async function getTopScores(limit = 10): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("*")
    .order("score", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }

  return data || [];
}

export async function submitScore(
  playerName: string,
  score: number
): Promise<LeaderboardEntry | null> {
  const { data, error } = await supabase
    .from("leaderboard")
    .insert([{ player_name: playerName, score }])
    .select()
    .single();

  if (error) {
    console.error("Error submitting score:", error);
    return null;
  }

  return data;
}

export async function getPlayerRank(score: number): Promise<number> {
  const { count, error } = await supabase
    .from("leaderboard")
    .select("*", { count: "exact", head: true })
    .gt("score", score);

  if (error) {
    console.error("Error getting rank:", error);
    return 0;
  }

  return (count || 0) + 1;
}
