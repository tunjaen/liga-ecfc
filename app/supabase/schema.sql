-- ============================================================
-- Plataforma de Gestión y Balanceo de Equipos ⚽
-- Schema SQL para Supabase (PostgreSQL)
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. PLAYERS
-- ============================================================
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  photo_url TEXT,
  defense INT NOT NULL DEFAULT 5 CHECK (defense >= 1 AND defense <= 10),
  attack INT NOT NULL DEFAULT 5 CHECK (attack >= 1 AND attack <= 10),
  fitness INT NOT NULL DEFAULT 5 CHECK (fitness >= 1 AND fitness <= 10),
  total_score INT GENERATED ALWAYS AS (defense + attack + fitness) STORED,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_players_active ON players (is_active);
CREATE INDEX idx_players_total_score ON players (total_score DESC);

-- ============================================================
-- 2. MATCHES
-- ============================================================
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'completed')),
  num_teams INT NOT NULL DEFAULT 2 CHECK (num_teams >= 2 AND num_teams <= 4),
  mvp_player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_matches_status ON matches (status);
CREATE INDEX idx_matches_date ON matches (match_date DESC);

-- ============================================================
-- 3. MATCH_TEAMS
-- ============================================================
CREATE TABLE match_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_number INT NOT NULL CHECK (team_number >= 1 AND team_number <= 4),
  team_name TEXT NOT NULL DEFAULT 'Equipo',
  team_color TEXT NOT NULL DEFAULT '#3b82f6',
  total_points INT NOT NULL DEFAULT 0,
  goals_scored INT NOT NULL DEFAULT 0,
  is_winner BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(match_id, team_number)
);

CREATE INDEX idx_match_teams_match ON match_teams (match_id);

-- ============================================================
-- 4. MATCH_TEAM_PLAYERS
-- ============================================================
CREATE TABLE match_team_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_team_id UUID NOT NULL REFERENCES match_teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  UNIQUE(match_team_id, player_id)
);

CREATE INDEX idx_match_team_players_team ON match_team_players (match_team_id);
CREATE INDEX idx_match_team_players_player ON match_team_players (player_id);

-- ============================================================
-- 5. MATCH_EVENTS (Goles y Asistencias)
-- ============================================================
CREATE TABLE match_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  match_team_id UUID NOT NULL REFERENCES match_teams(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('goal', 'assist')),
  minute INT CHECK (minute >= 0 AND minute <= 120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_match_events_match ON match_events (match_id);
CREATE INDEX idx_match_events_player ON match_events (player_id);
CREATE INDEX idx_match_events_type ON match_events (event_type);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_team_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;

-- PLAYERS
CREATE POLICY "players_public_read" ON players
  FOR SELECT USING (true);
CREATE POLICY "players_admin_insert" ON players
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "players_admin_update" ON players
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "players_admin_delete" ON players
  FOR DELETE USING (auth.role() = 'authenticated');

-- MATCHES
CREATE POLICY "matches_public_read" ON matches
  FOR SELECT USING (true);
CREATE POLICY "matches_admin_insert" ON matches
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "matches_admin_update" ON matches
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "matches_admin_delete" ON matches
  FOR DELETE USING (auth.role() = 'authenticated');

-- MATCH_TEAMS
CREATE POLICY "match_teams_public_read" ON match_teams
  FOR SELECT USING (true);
CREATE POLICY "match_teams_admin_insert" ON match_teams
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "match_teams_admin_update" ON match_teams
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "match_teams_admin_delete" ON match_teams
  FOR DELETE USING (auth.role() = 'authenticated');

-- MATCH_TEAM_PLAYERS
CREATE POLICY "match_team_players_public_read" ON match_team_players
  FOR SELECT USING (true);
CREATE POLICY "match_team_players_admin_insert" ON match_team_players
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "match_team_players_admin_update" ON match_team_players
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "match_team_players_admin_delete" ON match_team_players
  FOR DELETE USING (auth.role() = 'authenticated');

-- MATCH_EVENTS
CREATE POLICY "match_events_public_read" ON match_events
  FOR SELECT USING (true);
CREATE POLICY "match_events_admin_insert" ON match_events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "match_events_admin_update" ON match_events
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "match_events_admin_delete" ON match_events
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- VIEW: Player Leaderboard
-- ============================================================
CREATE OR REPLACE VIEW player_leaderboard AS
SELECT
  p.id,
  p.name,
  p.photo_url,
  p.defense,
  p.attack,
  p.fitness,
  p.total_score,
  COUNT(DISTINCT CASE WHEN m.status = 'completed' THEN mtp.match_team_id END)::int AS matches_played,
  COUNT(DISTINCT CASE WHEN m.status = 'completed' AND mt.is_winner THEN mt.id END)::int AS wins,
  COUNT(DISTINCT CASE WHEN m.status = 'completed' AND NOT mt.is_winner THEN mt.id END)::int AS losses,
  CASE
    WHEN COUNT(DISTINCT CASE WHEN m.status = 'completed' THEN mtp.match_team_id END) > 0
    THEN ROUND(
      COUNT(DISTINCT CASE WHEN m.status = 'completed' AND mt.is_winner THEN mt.id END)::numeric /
      COUNT(DISTINCT CASE WHEN m.status = 'completed' THEN mtp.match_team_id END) * 100, 1
    )
    ELSE 0
  END AS winrate,
  COALESCE(g.goal_count, 0)::int AS total_goals,
  COALESCE(a.assist_count, 0)::int AS total_assists,
  COUNT(DISTINCT CASE WHEN m.mvp_player_id = p.id AND m.status = 'completed' THEN m.id END)::int AS mvp_awards
FROM players p
LEFT JOIN match_team_players mtp ON mtp.player_id = p.id
LEFT JOIN match_teams mt ON mt.id = mtp.match_team_id
LEFT JOIN matches m ON m.id = mt.match_id
LEFT JOIN (
  SELECT player_id, COUNT(*)::int AS goal_count
  FROM match_events
  WHERE event_type = 'goal'
  GROUP BY player_id
) g ON g.player_id = p.id
LEFT JOIN (
  SELECT player_id, COUNT(*)::int AS assist_count
  FROM match_events
  WHERE event_type = 'assist'
  GROUP BY player_id
) a ON a.player_id = p.id
WHERE p.is_active = true
GROUP BY p.id, p.name, p.photo_url, p.defense, p.attack, p.fitness, p.total_score, g.goal_count, a.assist_count;

-- ============================================================
-- STORAGE BUCKET (run in Supabase Dashboard or via API)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('player-photos', 'player-photos', true);
--
-- CREATE POLICY "Public read player photos" ON storage.objects
--   FOR SELECT USING (bucket_id = 'player-photos');
-- CREATE POLICY "Admin upload player photos" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'player-photos' AND auth.role() = 'authenticated');
-- CREATE POLICY "Admin update player photos" ON storage.objects
--   FOR UPDATE USING (bucket_id = 'player-photos' AND auth.role() = 'authenticated');
-- CREATE POLICY "Admin delete player photos" ON storage.objects
--   FOR DELETE USING (bucket_id = 'player-photos' AND auth.role() = 'authenticated');
