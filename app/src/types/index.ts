// ============================================================
// TypeScript Types — Plataforma Equipos Balanceados ⚽
// ============================================================

// ---- Database Row Types ----

export interface Player {
  id: string;
  name: string;
  photo_url: string | null;
  defense: number;
  attack: number;
  fitness: number;
  technique: number;
  iq: number;
  total_score: number;
  is_active: boolean;
  created_at: string;
}

export interface Match {
  id: string;
  match_date: string;
  status: 'draft' | 'published' | 'completed';
  num_teams: number;
  mvp_player_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface MatchTeam {
  id: string;
  match_id: string;
  team_number: number;
  team_name: string;
  team_color: string;
  total_points: number;
  goals_scored: number;
  is_winner: boolean;
}

export interface MatchTeamPlayer {
  id: string;
  match_team_id: string;
  player_id: string;
}

export interface MatchEvent {
  id: string;
  match_id: string;
  player_id: string;
  match_team_id: string;
  event_type: 'goal' | 'assist';
  minute: number | null;
  created_at: string;
}

// ---- Joined / Enriched Types ----

export interface MatchTeamWithPlayers extends MatchTeam {
  players: Player[];
}

export interface MatchWithTeams extends Match {
  teams: MatchTeamWithPlayers[];
  mvp_player?: Player | null;
}

export interface MatchEventWithPlayer extends MatchEvent {
  player: Player;
}

export interface MatchDetail extends MatchWithTeams {
  events: MatchEventWithPlayer[];
}

// ---- Leaderboard View ----

export interface PlayerLeaderboard {
  id: string;
  name: string;
  photo_url: string | null;
  defense: number;
  attack: number;
  fitness: number;
  technique: number;
  iq: number;
  total_score: number;
  matches_played: number;
  wins: number;
  losses: number;
  winrate: number;
  total_goals: number;
  total_assists: number;
  mvp_awards: number;
}

// ---- Algorithm Types ----

export interface BalanceResult {
  teams: BalancedTeam[];
  metrics: BalanceMetrics;
}

export interface BalancedTeam {
  teamNumber: number;
  teamName: string;
  teamColor: string;
  players: Player[];
  totalPoints: number;
  summary?: string;
}

export interface BalanceMetrics {
  standardDeviation: number;
  maxMinDifference: number;
  averagePerTeam: number;
  totalPlayers: number;
  numTeams: number;
}

// ---- Form Types ----

export interface PlayerFormData {
  name: string;
  defense: number;
  attack: number;
  fitness: number;
  technique: number;
  iq: number;
  photo?: File | null;
}

export interface GoalEventInput {
  scorerId: string;
  assisterId?: string | null;
  minute?: number | null;
  teamId: string;
}

export interface MatchResultInput {
  matchId: string;
  teamResults: {
    teamId: string;
    goalsScored: number;
    isWinner: boolean;
  }[];
  events: GoalEventInput[];
  mvpPlayerId: string;
}

// ---- UI Types ----

export type TeamColorKey = 1 | 2 | 3 | 4;

export const TEAM_COLORS: Record<TeamColorKey, { hex: string; name: string }> = {
  1: { hex: '#eab308', name: 'Amarillo' },
  2: { hex: '#3b82f6', name: 'Azul' },
  3: { hex: '#ef4444', name: 'Rojo' },
  4: { hex: '#10b981', name: 'Verde' },
};

export const TEAM_NAMES: Record<TeamColorKey, string> = {
  1: 'Equipo Amarillo',
  2: 'Equipo Azul',
  3: 'Equipo Rojo',
  4: 'Equipo Verde',
};
