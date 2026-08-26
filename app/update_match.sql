-- Actualización de partido del 2026-07-07
DO $$
DECLARE
  v_match_id UUID;
  v_team_y_id UUID;
  v_team_b_id UUID;
  v_mvp_id UUID;
  
  -- Variables para jugadores
  v_player_flynn_id UUID;
  v_player_lucian_id UUID;
  v_player_vito_id UUID;
  v_player_edu_id UUID;
  v_player_rubn_id UUID;
  v_player_andoni_id UUID;
  v_player_mateo_id UUID;
  v_player_seba_id UUID;
  v_player_borja_id UUID;
  v_player_fran_id UUID;
  v_player_miky_id UUID;
BEGIN
  -- 1. Obtener el partido de la fecha
  SELECT id INTO v_match_id FROM matches WHERE match_date = '2026-07-07' LIMIT 1;
  IF v_match_id IS NULL THEN
    RAISE EXCEPTION 'Partido no encontrado para la fecha 2026-07-07';
  END IF;

  -- 2. Obtener IDs de los equipos del partido
  -- Asumiendo que Y es Amarillo (team_number=1) y B es Azul (team_number=2)
  SELECT id INTO v_team_y_id FROM match_teams WHERE match_id = v_match_id AND (team_number = 1 OR team_name ILIKE '%Amarillo%') LIMIT 1;
  SELECT id INTO v_team_b_id FROM match_teams WHERE match_id = v_match_id AND (team_number = 2 OR team_name ILIKE '%Azul%') LIMIT 1;

  IF v_team_y_id IS NULL OR v_team_b_id IS NULL THEN
    RAISE EXCEPTION 'Equipos no encontrados en el partido';
  END IF;

  -- 3. Actualizar Goles y Ganador
  UPDATE match_teams SET goals_scored = 11, is_winner = true WHERE id = v_team_y_id;
  UPDATE match_teams SET goals_scored = 9, is_winner = false WHERE id = v_team_b_id;

  -- 4. Obtener IDs de Jugadores
  SELECT id INTO v_player_flynn_id FROM players WHERE name ILIKE '%Flynn%' LIMIT 1;
  SELECT id INTO v_player_lucian_id FROM players WHERE name ILIKE '%Lucian%' LIMIT 1;
  SELECT id INTO v_player_vito_id FROM players WHERE name ILIKE '%Vito%' LIMIT 1;
  SELECT id INTO v_player_edu_id FROM players WHERE name ILIKE '%Edu%' LIMIT 1;
  SELECT id INTO v_player_rubn_id FROM players WHERE name ILIKE '%Rubén%' LIMIT 1;
  SELECT id INTO v_player_andoni_id FROM players WHERE name ILIKE '%Andoni%' LIMIT 1;
  SELECT id INTO v_player_mateo_id FROM players WHERE name ILIKE '%Mateo%' LIMIT 1;
  SELECT id INTO v_player_seba_id FROM players WHERE name ILIKE '%Seba%' LIMIT 1;
  SELECT id INTO v_player_borja_id FROM players WHERE name ILIKE '%Borja%' LIMIT 1;
  SELECT id INTO v_player_fran_id FROM players WHERE name ILIKE '%Fran%' LIMIT 1;
  SELECT id INTO v_player_miky_id FROM players WHERE name ILIKE '%Miky%' LIMIT 1;

  -- Actualizar MVP
  UPDATE matches SET mvp_player_id = v_player_flynn_id WHERE id = v_match_id;

  -- 5. Borrar eventos anteriores
  DELETE FROM match_events WHERE match_id = v_match_id;

  -- 6. Insertar nuevos eventos

  -- Gol de Lucian (B)
  IF v_player_lucian_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_lucian_id, v_team_b_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Lucian no encontrado para el gol';
  END IF;
  
  -- Gol de Vito (B)
  IF v_player_vito_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_vito_id, v_team_b_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Vito no encontrado para el gol';
  END IF;
  
  -- Asistencia de Edu (B)
  IF v_player_edu_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_edu_id, v_team_b_id, 'assist');
  ELSE
    RAISE NOTICE 'Jugador Edu no encontrado para la asistencia';
  END IF;
    
  -- Gol de Rubén (B)
  IF v_player_rubn_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_rubn_id, v_team_b_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Rubén no encontrado para el gol';
  END IF;
  
  -- Asistencia de Lucian (B)
  IF v_player_lucian_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_lucian_id, v_team_b_id, 'assist');
  ELSE
    RAISE NOTICE 'Jugador Lucian no encontrado para la asistencia';
  END IF;
    
  -- Gol de Rubén (B)
  IF v_player_rubn_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_rubn_id, v_team_b_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Rubén no encontrado para el gol';
  END IF;
  
  -- Asistencia de Lucian (B)
  IF v_player_lucian_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_lucian_id, v_team_b_id, 'assist');
  ELSE
    RAISE NOTICE 'Jugador Lucian no encontrado para la asistencia';
  END IF;
    
  -- Gol de Andoni (B)
  IF v_player_andoni_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_andoni_id, v_team_b_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Andoni no encontrado para el gol';
  END IF;
  
  -- Asistencia de Flynn (B)
  IF v_player_flynn_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_flynn_id, v_team_b_id, 'assist');
  ELSE
    RAISE NOTICE 'Jugador Flynn no encontrado para la asistencia';
  END IF;
    
  -- Gol de Vito (B)
  IF v_player_vito_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_vito_id, v_team_b_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Vito no encontrado para el gol';
  END IF;
  
  -- Asistencia de Andoni (B)
  IF v_player_andoni_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_andoni_id, v_team_b_id, 'assist');
  ELSE
    RAISE NOTICE 'Jugador Andoni no encontrado para la asistencia';
  END IF;
    
  -- Gol de Mateo (B)
  IF v_player_mateo_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_mateo_id, v_team_b_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Mateo no encontrado para el gol';
  END IF;
  
  -- Asistencia de Rubén (B)
  IF v_player_rubn_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_rubn_id, v_team_b_id, 'assist');
  ELSE
    RAISE NOTICE 'Jugador Rubén no encontrado para la asistencia';
  END IF;
    
  -- Gol de Edu (B)
  IF v_player_edu_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_edu_id, v_team_b_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Edu no encontrado para el gol';
  END IF;
  
  -- Asistencia de Vito (B)
  IF v_player_vito_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_vito_id, v_team_b_id, 'assist');
  ELSE
    RAISE NOTICE 'Jugador Vito no encontrado para la asistencia';
  END IF;
    
  -- Gol de Flynn (Y)
  IF v_player_flynn_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_flynn_id, v_team_y_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Flynn no encontrado para el gol';
  END IF;
  
  -- Gol de Andoni (B)
  IF v_player_andoni_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_andoni_id, v_team_b_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Andoni no encontrado para el gol';
  END IF;
  
  -- Asistencia de Edu (B)
  IF v_player_edu_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_edu_id, v_team_b_id, 'assist');
  ELSE
    RAISE NOTICE 'Jugador Edu no encontrado para la asistencia';
  END IF;
    
  -- Gol de Mateo (B)
  IF v_player_mateo_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_mateo_id, v_team_b_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Mateo no encontrado para el gol';
  END IF;
  
  -- Gol de Seba (Y)
  IF v_player_seba_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_seba_id, v_team_y_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Seba no encontrado para el gol';
  END IF;
  
  -- Gol de Borja (Y)
  IF v_player_borja_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_borja_id, v_team_y_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Borja no encontrado para el gol';
  END IF;
  
  -- Gol de Fran (Y)
  IF v_player_fran_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_fran_id, v_team_y_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Fran no encontrado para el gol';
  END IF;
  
  -- Asistencia de Miky (Y)
  IF v_player_miky_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_miky_id, v_team_y_id, 'assist');
  ELSE
    RAISE NOTICE 'Jugador Miky no encontrado para la asistencia';
  END IF;
    
  -- Gol de Borja (Y)
  IF v_player_borja_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_borja_id, v_team_y_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Borja no encontrado para el gol';
  END IF;
  
  -- Asistencia de Miky (Y)
  IF v_player_miky_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_miky_id, v_team_y_id, 'assist');
  ELSE
    RAISE NOTICE 'Jugador Miky no encontrado para la asistencia';
  END IF;
    
  -- Gol de Miky (Y)
  IF v_player_miky_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_miky_id, v_team_y_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Miky no encontrado para el gol';
  END IF;
  
  -- Asistencia de Borja (Y)
  IF v_player_borja_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_borja_id, v_team_y_id, 'assist');
  ELSE
    RAISE NOTICE 'Jugador Borja no encontrado para la asistencia';
  END IF;
    
  -- Gol de Borja (Y)
  IF v_player_borja_id IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, v_player_borja_id, v_team_y_id, 'goal');
  ELSE
    RAISE NOTICE 'Jugador Borja no encontrado para el gol';
  END IF;
  
  RAISE NOTICE 'Partido actualizado correctamente';
END $$;
