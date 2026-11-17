-- ============================================================
-- Migración: puntuación manual con decimales (ej. Fernando = 26.3)
-- Ejecutar este script completo en: Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- 1. Quitar los objetos que dependen de total_score (se recrean después)
DROP INDEX IF EXISTS idx_players_total_score;
DROP VIEW IF EXISTS player_leaderboard;

-- 2. Reemplazar total_score (columna calculada entera) por una versión decimal
--    que usa la puntuación manual si existe, y si no, calcula la suma de stats.
ALTER TABLE players DROP COLUMN total_score;

ALTER TABLE players ADD COLUMN manual_score NUMERIC(5,1);

ALTER TABLE players ADD COLUMN total_score NUMERIC(5,1)
  GENERATED ALWAYS AS (
    COALESCE(manual_score, (defense + attack + fitness + technique + iq)::numeric)
  ) STORED;

CREATE INDEX idx_players_total_score ON players (total_score DESC);

-- 3. Permitir decimales en los totales de equipo (para el balanceo)
ALTER TABLE match_teams ALTER COLUMN total_points TYPE NUMERIC(7,1);

-- 4. Recrear la vista del leaderboard (misma definición, con total_score decimal)
CREATE VIEW player_leaderboard AS
SELECT
  p.id,
  p.name,
  p.photo_url,
  p.defense,
  p.attack,
  p.fitness,
  p.technique,
  p.iq,
  p.total_score,
  p.country,
  COUNT(DISTINCT CASE WHEN m.status = 'completed' THEN mtp.match_team_id END)::int AS matches_played,
  COUNT(DISTINCT CASE WHEN m.status = 'completed' AND mt.is_winner THEN mt.id END)::int AS wins,
  COUNT(DISTINCT CASE WHEN m.status = 'completed' AND NOT mt.is_winner THEN mt.id END)::int AS losses,
  CASE
    WHEN COUNT(DISTINCT CASE WHEN m.status = 'completed' THEN mtp.match_team_id END) > 0
    THEN ROUND(
      COUNT(DISTINCT CASE WHEN m.status = 'completed' AND mt.is_winner THEN mt.id END)::numeric /
      COUNT(DISTINCT CASE WHEN m.status = 'completed' THEN mtp.match_team_id END) * 100
    )::int
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
GROUP BY p.id, p.name, p.photo_url, p.defense, p.attack, p.fitness, p.technique, p.iq, p.total_score, p.country, g.goal_count, a.assist_count;

-- Permisos para que la vista sea accesible desde la API (anon/authenticated)
GRANT SELECT ON player_leaderboard TO anon, authenticated, service_role;

-- 5. (Opcional) Dejar a Fernando ya con 26.3 desde el primer momento.
--    Si no quieres que se aplique aquí, puedes escribirlo a mano en el panel de admin.
UPDATE players SET manual_score = 26.3 WHERE name = 'Fernando';
