import { createClient } from '@/lib/supabase/server';
import type {
  Player,
  PlayerLeaderboard,
  MatchWithTeams,
  MatchDetail,
  MatchTeamWithPlayers,
} from '@/types';

// ---- Players ----

export async function getPlayers(activeOnly = true): Promise<Player[]> {
  const supabase = await createClient();
  let query = supabase.from('players').select('*').order('name');
  if (activeOnly) {
    query = query.eq('is_active', true);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getPlayer(id: string): Promise<Player | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

// ---- Leaderboard ----

export async function getLeaderboard(): Promise<PlayerLeaderboard[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('player_leaderboard')
    .select('*')
    .order('wins', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getTopScorers(limit = 10): Promise<PlayerLeaderboard[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('player_leaderboard')
    .select('*')
    .order('total_goals', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).filter((p) => p.total_goals > 0);
}

export async function getTopAssisters(limit = 10): Promise<PlayerLeaderboard[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('player_leaderboard')
    .select('*')
    .order('total_assists', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).filter((p) => p.total_assists > 0);
}

// ---- Matches ----

export async function getMatches(status?: string): Promise<MatchWithTeams[]> {
  const supabase = await createClient();
  let query = supabase
    .from('matches')
    .select(`
      *,
      mvp_player:players!matches_mvp_player_id_fkey(*)
    `)
    .order('match_date', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data: matches, error } = await query;
  if (error) throw error;
  if (!matches || matches.length === 0) return [];

  // Fetch teams for all matches
  const matchIds = matches.map((m) => m.id);
  const { data: teams, error: teamsError } = await supabase
    .from('match_teams')
    .select(`
      *,
      players:match_team_players(
        player:players(*)
      )
    `)
    .in('match_id', matchIds)
    .order('team_number');

  if (teamsError) throw teamsError;

  return matches.map((match) => {
    const matchTeams = (teams || [])
      .filter((t) => t.match_id === match.id)
      .map((t) => ({
        ...t,
        players: (t.players || []).map((p: { player: Player }) => p.player),
      })) as MatchTeamWithPlayers[];

    return {
      ...match,
      teams: matchTeams,
      mvp_player: match.mvp_player || null,
    } as MatchWithTeams;
  });
}

export async function getCurrentMatch(): Promise<MatchWithTeams | null> {
  const matches = await getMatches('published');
  return matches.length > 0 ? matches[0] : null;
}

export async function getLastResult(): Promise<MatchWithTeams | null> {
  const matches = await getMatches('completed');
  return matches.length > 0 ? matches[0] : null;
}

export async function getMatchDetail(id: string): Promise<MatchDetail | null> {
  const supabase = await createClient();

  const { data: match, error } = await supabase
    .from('matches')
    .select(`
      *,
      mvp_player:players!matches_mvp_player_id_fkey(*)
    `)
    .eq('id', id)
    .single();

  if (error || !match) return null;

  // Fetch teams with players
  const { data: teams } = await supabase
    .from('match_teams')
    .select(`
      *,
      players:match_team_players(
        player:players(*)
      )
    `)
    .eq('match_id', id)
    .order('team_number');

  // Fetch events
  const { data: events } = await supabase
    .from('match_events')
    .select(`
      *,
      player:players(*)
    `)
    .eq('match_id', id)
    .order('minute', { ascending: true, nullsFirst: false });

  const matchTeams = (teams || []).map((t) => ({
    ...t,
    players: (t.players || []).map((p: { player: Player }) => p.player),
  })) as MatchTeamWithPlayers[];

  return {
    ...match,
    teams: matchTeams,
    events: events || [],
    mvp_player: match.mvp_player || null,
  } as MatchDetail;
}

// ---- Player Stats ----

export async function getPlayerStats(playerId: string) {
  const supabase = await createClient();

  // Get leaderboard stats for this player
  const { data: stats } = await supabase
    .from('player_leaderboard')
    .select('*')
    .eq('id', playerId)
    .single();

  // Get match history
  const { data: matchHistory } = await supabase
    .from('match_team_players')
    .select(`
      match_team:match_teams(
        *,
        match:matches(*)
      )
    `)
    .eq('player_id', playerId)
    .order('created_at', { ascending: false });

  // Get events for this player
  const { data: events } = await supabase
    .from('match_events')
    .select('*')
    .eq('player_id', playerId);

  return {
    stats: stats || null,
    matchHistory: matchHistory || [],
    events: events || [],
  };
}
