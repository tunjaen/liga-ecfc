-- ============================================================
-- Migración: guardar victorias y empates por equipo (Rey de la Pista)
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- ============================================================

ALTER TABLE match_teams ADD COLUMN IF NOT EXISTS victorias INT NOT NULL DEFAULT 0;
ALTER TABLE match_teams ADD COLUMN IF NOT EXISTS empates INT NOT NULL DEFAULT 0;
