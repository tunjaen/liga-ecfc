import * as fs from 'fs';

const data = {
  "modo": "clasico",
  "fecha": "2026-09-08",
  "mvp": "Flynn",
  "partidos": [
    {
      "equipo_a": "Y",
      "equipo_b": "B",
      "goles_a": 13,
      "goles_b": 12,
      "goles": [
        { "goleador": "Flynn", "asistente": "Dan", "equipo": "B" },
        { "goleador": "Flynn", "asistente": "Miky", "equipo": "B" },
        { "goleador": "Edu", "equipo": "Y" },
        { "goleador": "Ryan", "asistente": "Edu", "equipo": "Y" },
        { "goleador": "Toto", "equipo": "B" },
        { "goleador": "Andres", "equipo": "Y" },
        { "goleador": "Lucian", "asistente": "Juan", "equipo": "Y" },
        { "goleador": "Javi", "asistente": "Mateo", "equipo": "B" },
        { "goleador": "Flynn", "asistente": "Mateo", "equipo": "B" },
        { "goleador": "Flynn", "asistente": "Javi", "equipo": "B" },
        { "goleador": "Ryan", "equipo": "Y" },
        { "goleador": "Mateo", "asistente": "Dan", "equipo": "B" },
        { "goleador": "Flynn", "asistente": "Toto", "equipo": "B" },
        { "goleador": "Mateo", "equipo": "B" },
        { "goleador": "Ryan", "asistente": "Edu", "equipo": "Y" },
        { "goleador": "Andres", "asistente": "Juan", "equipo": "Y" },
        { "goleador": "Victor", "equipo": "Y" },
        { "goleador": "Juan", "equipo": "Y" },
        { "goleador": "Andres", "asistente": "Lucian", "equipo": "Y" },
        { "goleador": "Edu", "asistente": "Lucian", "equipo": "Y" },
        { "goleador": "Flynn", "asistente": "Toto", "equipo": "B" },
        { "goleador": "Flynn", "asistente": "Javi", "equipo": "B" },
        { "goleador": "Flynn", "equipo": "B" },
        { "goleador": "Lucian", "equipo": "Y" },
        { "goleador": "Ryan", "asistente": "Juan", "equipo": "Y" }
      ]
    }
  ]
};

const match = data.partidos[0];

let sql = `-- Actualización de partido del ${data.fecha}
DO $$
DECLARE
  v_match_id UUID;
  v_team_y_id UUID;
  v_team_b_id UUID;
  v_mvp_id UUID;
  
  -- Variables para jugadores
`;

// Extract all unique players and their teams
const players = new Set<string>();
const playerTeams = new Map<string, string>(); // player_name -> 'Y' or 'B'

// The MVP doesn't have a team in the root JSON, but they must have scored or assisted, 
// so we'll catch their team in the loop below. We add them to players just in case.
players.add(data.mvp);

for (const g of match.goles) {
  players.add(g.goleador);
  playerTeams.set(g.goleador, g.equipo);
  
  if (g.asistente) {
    players.add(g.asistente);
    playerTeams.set(g.asistente, g.equipo);
  }
}

// Generate variable declarations for players
for (const p of Array.from(players)) {
  sql += `  v_player_${p.toLowerCase().replace(/[^a-z0-9]/g, '')}_id UUID;\n`;
}

sql += `BEGIN
  -- 1. Obtener o crear el partido de la fecha
  SELECT id INTO v_match_id FROM matches WHERE match_date = '${data.fecha}' LIMIT 1;
  IF v_match_id IS NULL THEN
    RAISE NOTICE 'Partido no encontrado para la fecha ${data.fecha}. Creando nuevo partido...';
    INSERT INTO matches (match_date, status, num_teams) VALUES ('${data.fecha}', 'completed', 2) RETURNING id INTO v_match_id;
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
  UPDATE match_teams SET goals_scored = ${match.goles_a}, is_winner = ${(match.goles_a > match.goles_b).toString()} WHERE id = v_team_y_id;
  UPDATE match_teams SET goals_scored = ${match.goles_b}, is_winner = ${(match.goles_b > match.goles_a).toString()} WHERE id = v_team_b_id;

  -- 4. Obtener IDs de Jugadores
`;

for (const p of Array.from(players)) {
  const varName = `v_player_${p.toLowerCase().replace(/[^a-z0-9]/g, '')}_id`;
  sql += `  SELECT id INTO ${varName} FROM players WHERE name ILIKE '%${p}%' LIMIT 1;\n`;
}

sql += `
  -- Actualizar MVP
  UPDATE matches SET mvp_player_id = v_player_${data.mvp.toLowerCase().replace(/[^a-z0-9]/g, '')}_id WHERE id = v_match_id;

  -- 4.5 Borrar y re-insertar jugadores en los equipos
  DELETE FROM match_team_players WHERE match_team_id IN (v_team_y_id, v_team_b_id);
`;

for (const p of Array.from(players)) {
  const varName = `v_player_${p.toLowerCase().replace(/[^a-z0-9]/g, '')}_id`;
  const teamLetter = playerTeams.get(p);
  if (teamLetter) {
    const teamVar = teamLetter === 'Y' ? 'v_team_y_id' : 'v_team_b_id';
    sql += `
  IF ${varName} IS NOT NULL THEN
    INSERT INTO match_team_players (match_team_id, player_id) VALUES (${teamVar}, ${varName}) ON CONFLICT DO NOTHING;
  END IF;
`;
  }
}

sql += `
  -- 5. Borrar eventos anteriores
  DELETE FROM match_events WHERE match_id = v_match_id;

  -- 6. Insertar nuevos eventos
`;

for (const g of match.goles) {
  const teamVar = g.equipo === 'Y' ? 'v_team_y_id' : 'v_team_b_id';
  const scorerVar = `v_player_${g.goleador.toLowerCase().replace(/[^a-z0-9]/g, '')}_id`;
  
  sql += `
  -- Gol de ${g.goleador} (${g.equipo})
  IF ${scorerVar} IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, ${scorerVar}, ${teamVar}, 'goal');
  ELSE
    RAISE NOTICE 'Jugador ${g.goleador} no encontrado para el gol';
  END IF;
  `;

  if (g.asistente) {
    const assistVar = `v_player_${g.asistente.toLowerCase().replace(/[^a-z0-9]/g, '')}_id`;
    sql += `
  -- Asistencia de ${g.asistente} (${g.equipo})
  IF ${assistVar} IS NOT NULL THEN
    INSERT INTO match_events (match_id, player_id, match_team_id, event_type)
    VALUES (v_match_id, ${assistVar}, ${teamVar}, 'assist');
  ELSE
    RAISE NOTICE 'Jugador ${g.asistente} no encontrado para la asistencia';
  END IF;
    `;
  }
}

sql += `
  RAISE NOTICE 'Partido actualizado correctamente';
END $$;
`;

fs.writeFileSync('update_match.sql', sql);
console.log('SQL generated');
