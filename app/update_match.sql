-- Actualización de partido del 2026-09-08
DO $$
DECLARE
  v_match_id UUID;
  v_team_y_id UUID;
  v_team_b_id UUID;
  v_mvp_id UUID;
  
  -- Variables para jugadores
  v_player_flynn_id UUID;
  v_player_dan_id UUID;
  v_player_miky_id UUID;
  v_player_edu_id UUID;
  v_player_ryan_id UUID;
  v_player_toto_id UUID;
  v_player_andres_id UUID;
  v_player_lucian_id UUID;
  v_player_juan_id UUID;
  v_player_javi_id UUID;
  v_player_mateo_id UUID;
  v_player_victor_id UUID;
BEGIN
  -- 1. Obtener o crear el partido de la fecha
  SELECT id INTO v_match_id FROM matches WHERE match_date = '2026-09-08' LIMIT 1;
  IF v_match_id IS NULL THEN
    RAISE NOTICE 'Partido no encontrado para la fecha 2026-09-08. Creando nuevo partido...';
    INSERT INTO matches (match_date, status, num_teams) VALUES ('2026-09-08', 'completed', 2) RETURNING id INTO v_match_id;
  ELSE
    -- Asegurarnos de que el estado sea completed
    UPDATE matches SET status = 'completed' WHERE id = v_match_id;
  END IF;

  -- 2. Obtener o crear IDs de los equipos del partido
  SELECT id INTO v_team_y_id FROM match_teams WHERE match_id = v_match_id AND (team_number = 1 OR team_name ILIKE '%Amarillo%') LIMIT 1;
  IF v_team_y_id IS NULL THEN
    INSERT INTO match_teams (match_id, team_number, team_name, team_color) VALUES (v_match_id, 1, 'Equipo Amarillo', '#eab308') RETURNING id INTO v_team_y_id;
  END IF;
  
  SELECT id INTO v_team_b_id FROM match_teams WHERE match_id = v_match_id AND (team_number = 2 OR team_name ILIKE '%Azul%') LIMIT 1;
  IF v_team_b_id IS NULL THEN
    INSERT INTO match_teams (match_id, team_number, team_name, team_color) VALUES (v_match_id, 2, 'Equipo Azul', '#3b82f6') RETURNING id INTO v_team_b_id;
  END IF;

  -- 3. Actualizar Goles y Ganador
  UPDATE match_teams SET goals_scored = 13, is_winner = true WHERE id = v_team_y_id;
  UPDATE match_teams SET goals_scored = 12, is_winner = false WHERE id = v_team_b_id;

  -- 4. Obtener IDs de Jugadores
  SELECT id INTO v_player_flynn_id FROM players WHERE name ILIKE '%Flynn%' LIMIT 1;
  SELECT id INTO v_player_dan_id FROM players WHERE name ILIKE '%Dan%' LIMIT 1;
  SELECT id INTO v_player_miky_id FROM players WHERE name ILIKE '%Miky%' LIMIT 1;
  SELECT id INTO v_player_edu_id FROM players WHERE name ILIKE '%Edu%' LIMIT 1;
  SELECT id INTO v_player_ryan_id FROM players WHERE name ILIKE '%Ryan%' LIMIT 1;
  SELECT id INTO v_player_toto_id FROM players WHERE name ILIKE '%Toto%' LIMIT 1;
  SELECT id INTO v_player_andres_id FROM players WHERE name ILIKE '%Andres%' LIMIT 1;
  SELECT id INTO v_player_lucian_id FROM players WHERE name ILIKE '%Lucian%' LIMIT 1;
  SELECT id INTO v_player_juan_id FROM players WHERE name ILIKE '%Juan%' LIMIT 1;
  SELECT id INTO v_player_javi_id FROM players WHERE name ILIKE '%Javi%' LIMIT 1;
  SELECT id INTO v_player_mateo_id FROM players WHERE name ILIKE '%Mateo%' LIMIT 1;
  SELECT id INTO v_player_victor_id FROM players WHERE name ILIKE '%Victor%' LIMIT 1;

  -- Actualizar MVP
  UPDATE matches SET mvp_player_id = v_player_flynn_id WHERE id = v_match_id;

  -- 4.5 Borrar y re-insertar jugadores en los equipos
  DELETE FROM match_team_players WHERE match_team_id IN (v_team_y_id, v_team_b_id);

  IF v_player_flynn_id IS NOT NULL THEN
    INSERT INTO match_team_players (match_team_id, player_id) VALUES (v_team_b_id, v_player_flynn_id) ON CONFLICT DO NOTHING;
  END IF;

  IF v_player_dan_id IS NOT NULL THEN
    INSERT INTO match_team_players (match_team_id, player_id) VALUES (v_team_b_id, v_player_dan_id) ON CONFLICT DO NOTHING;
  END IF;

  IF v_player_miky_id IS NOT NULL THEN
    INSERT INTO match_team_players (match_team_id, player_id) VALUES (v_team_b_id, v_player_miky_id) ON CONFLICT DO NOTHING;
  END IF;

  IF v_player_edu_id IS NOT NULL THEN
    INSERT INTO match_team_players (match_team_id, player_id) VALUES (v_team_y_id, v_player_edu_id) ON CONFLICT DO NOTHING;
  END IF;

  IF v_player_ryan_id IS NOT NULL THEN
    INSERT INTO match_team_players (match_team_id, player_id) VALUES (v_team_y_id, v_player_ryan_id) ON CONFLICT DO NOTHING;
  END IF;

  IF v_player_toto_id IS NOT NULL THEN
    INSERT INTO match_team_players (match_team_id, player_id) VALUES (v_team_b_id, v_player_toto_id) ON CONFLICT DO NOTHING;
  END IF;

  IF v_player_andres_id IS NOT NULL THEN
    INSERT INTO match_team_players (match_team_id, player_id) VALUES (v_team_y_id, v_player_andres_id) ON CONFLICT DO NOTHING;
  END IF;

  IF v_player_lucian_id IS NOT NULL THEN
    INSERT INTO match_team_players (match_team_id, player_id) VALUES (v_team_y_id, v_player_lucian_id) ON CONFLICT DO NOTHING;
  END IF;

  IF v_player_juan_id IS NOT NULL THEN
    INSERT INTO match_team_players (match_team_id, player_id) VALUES (v_team_y_id, v_player_juan_id) ON CONFLICT DO NOTHING;
  END IF;

  IF v_player_javi_id IS NOT NULL THEN
    INSERT INTO match_team_players (match_team_id, player_id) VALUES (v_team_b_id, v_player_javi_id) ON CONFLICT DO NOTHING;
  END IF;

  IF v_player_mateo_id IS NOT NULL THEN
    INSERT INTO match_team_players (match_team_id, player_id) VALUES (v_team_b_id, v_player_mateo_id) ON CONFLICT DO NOTHING;
  END IF;

  IF v_player_victor_id IS NOT NULL THEN
    INSERT INTO match_team_players (match_team_id, player_id) VALUES (v_team_y_id, v_player_victor_id) ON CONFLICT DO NOTHING;
  END IF;

  -- 5. Borrar eventos anteriores
  DELETE FROM match_events WHERE match_id = v_match_id;

  -- 6. Insertar nuevos eventos

  -- Gol de Flynn (B)
  IF v_player_flynn_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_flynn_id, v_team_b_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Flynn no encontrado para el gol';
  END IF;
  
  -- Asistencia de Dan (B)
  IF v_player_dan_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_dan_id, v_team_b_id, 'assist');
  ELSE
    RAISE NOTICE 'Jugador Dan no encontrado para la asistencia';
  END IF;
    
  -- Gol de Flynn (B)
  IF v_player_flynn_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_flynn_id, v_team_b_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Flynn no encontrado para el gol';
  END IF;
  
  -- Asistencia de Miky (B)
  IF v_player_miky_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_miky_id, v_team_b_id, 'assist');
  ELSE
    RAISE NOTICE 'Jugador Miky no encontrado para la asistencia';
  END IF;
    
  -- Gol de Edu (Y)
  IF v_player_edu_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_edu_id, v_team_y_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Edu no encontrado para el gol';
  END IF;
  
  -- Gol de Ryan (Y)
  IF v_player_ryan_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_ryan_id, v_team_y_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Ryan no encontrado para el gol';
  END IF;
  
  -- Asistencia de Edu (Y)
  IF v_player_edu_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_edu_id, v_team_y_id, 'assist');
  ELSE
    RAISE NOTICE 'Jugador Edu no encontrado para la asistencia';
  END IF;
    
  -- Gol de Toto (B)
  IF v_player_toto_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_toto_id, v_team_b_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Toto no encontrado para el gol';
  END IF;
  
  -- Gol de Andres (Y)
  IF v_player_andres_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_andres_id, v_team_y_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Andres no encontrado para el gol';
  END IF;
  
  -- Gol de Lucian (Y)
  IF v_player_lucian_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_lucian_id, v_team_y_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Lucian no encontrado para el gol';
  END IF;
  
  -- Asistencia de Juan (Y)
  IF v_player_juan_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_juan_id, v_team_y_id, 'assist');
  ELSE
    RAISE NOTICE 'Jugador Juan no encontrado para la asistencia';
  END IF;
    
  -- Gol de Javi (B)
  IF v_player_javi_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_javi_id, v_team_b_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Javi no encontrado para el gol';
  END IF;
  
  -- Asistencia de Mateo (B)
  IF v_player_mateo_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_mateo_id, v_team_b_id, 'assist');
  ELSE
    RAISE NOTICE 'Jugador Mateo no encontrado para la asistencia';
  END IF;
    
  -- Gol de Flynn (B)
  IF v_player_flynn_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_flynn_id, v_team_b_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Flynn no encontrado para el gol';
  END IF;
  
  -- Asistencia de Mateo (B)
  IF v_player_mateo_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_mateo_id, v_team_b_id, 'assist');
  ELSE
    RAISE NOTICE 'Jugador Mateo no encontrado para la asistencia';
  END IF;
    
  -- Gol de Flynn (B)
  IF v_player_flynn_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_flynn_id, v_team_b_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Flynn no encontrado para el gol';
  END IF;
  
  -- Asistencia de Javi (B)
  IF v_player_javi_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_javi_id, v_team_b_id, 'assist');
  ELSE
    RAISE NOTICE 'Jugador Javi no encontrado para la asistencia';
  END IF;
    
  -- Gol de Ryan (Y)
  IF v_player_ryan_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_ryan_id, v_team_y_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Ryan no encontrado para el gol';
  END IF;
  
  -- Gol de Mateo (B)
  IF v_player_mateo_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_mateo_id, v_team_b_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Mateo no encontrado para el gol';
  END IF;
  
  -- Asistencia de Dan (B)
  IF v_player_dan_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_dan_id, v_team_b_id, 'assist');
  ELSE
    RAISE NOTICE 'Jugador Dan no encontrado para la asistencia';
  END IF;
    
  -- Gol de Flynn (B)
  IF v_player_flynn_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_flynn_id, v_team_b_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Flynn no encontrado para el gol';
  END IF;
  
  -- Asistencia de Toto (B)
  IF v_player_toto_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_toto_id, v_team_b_id, 'assist');
  ELSE
    RAISE NOTICE 'Jugador Toto no encontrado para la asistencia';
  END IF;
    
  -- Gol de Mateo (B)
  IF v_player_mateo_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_mateo_id, v_team_b_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Mateo no encontrado para el gol';
  END IF;
  
  -- Gol de Ryan (Y)
  IF v_player_ryan_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_ryan_id, v_team_y_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Ryan no encontrado para el gol';
  END IF;
  
  -- Asistencia de Edu (Y)
  IF v_player_edu_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_edu_id, v_team_y_id, 'assist');
  ELSE
    RAISE NOTICE 'Jugador Edu no encontrado para la asistencia';
  END IF;
    
  -- Gol de Andres (Y)
  IF v_player_andres_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_andres_id, v_team_y_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Andres no encontrado para el gol';
  END IF;
  
  -- Asistencia de Juan (Y)
  IF v_player_juan_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_juan_id, v_team_y_id, 'assist');
  ELSE
    RAISE NOTICE 'Jugador Juan no encontrado para la asistencia';
  END IF;
    
  -- Gol de Victor (Y)
  IF v_player_victor_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_victor_id, v_team_y_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Victor no encontrado para el gol';
  END IF;
  
  -- Gol de Juan (Y)
  IF v_player_juan_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_juan_id, v_team_y_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Juan no encontrado para el gol';
  END IF;
  
  -- Gol de Andres (Y)
  IF v_player_andres_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_andres_id, v_team_y_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Andres no encontrado para el gol';
  END IF;
  
  -- Asistencia de Lucian (Y)
  IF v_player_lucian_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_lucian_id, v_team_y_id, 'assist');
  ELSE
    RAISE NOTICE 'Jugador Lucian no encontrado para la asistencia';
  END IF;
    
  -- Gol de Edu (Y)
  IF v_player_edu_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_edu_id, v_team_y_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Edu no encontrado para el gol';
  END IF;
  
  -- Asistencia de Lucian (Y)
  IF v_player_lucian_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_lucian_id, v_team_y_id, 'assist');
  ELSE
    RAISE NOTICE 'Jugador Lucian no encontrado para la asistencia';
  END IF;
    
  -- Gol de Flynn (B)
  IF v_player_flynn_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_flynn_id, v_team_b_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Flynn no encontrado para el gol';
  END IF;
  
  -- Asistencia de Toto (B)
  IF v_player_toto_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_toto_id, v_team_b_id, 'assist');
  ELSE
    RAISE NOTICE 'Jugador Toto no encontrado para la asistencia';
  END IF;
    
  -- Gol de Flynn (B)
  IF v_player_flynn_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_flynn_id, v_team_b_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Flynn no encontrado para el gol';
  END IF;
  
  -- Asistencia de Javi (B)
  IF v_player_javi_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_javi_id, v_team_b_id, 'assist');
  ELSE
    RAISE NOTICE 'Jugador Javi no encontrado para la asistencia';
  END IF;
    
  -- Gol de Flynn (B)
  IF v_player_flynn_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_flynn_id, v_team_b_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Flynn no encontrado para el gol';
  END IF;
  
  -- Gol de Lucian (Y)
  IF v_player_lucian_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_lucian_id, v_team_y_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Lucian no encontrado para el gol';
  END IF;
  
  -- Gol de Ryan (Y)
  IF v_player_ryan_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_ryan_id, v_team_y_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Ryan no encontrado para el gol';
  END IF;
  
  -- Asistencia de Juan (Y)
  IF v_player_juan_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_juan_id, v_team_y_id, 'assist');
  ELSE
    RAISE NOTICE 'Jugador Juan no encontrado para la asistencia';
  END IF;
    
  RAISE NOTICE 'Partido actualizado correctamente';
END $$;
