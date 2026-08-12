import * as fs from 'fs';

const data = {
  "modo": "clasico",
  "fecha": "2026-07-07",
  "mvp": "Gonzalo",
  "partidos": [
    {
      "equipo_a": "Y",
      "equipo_b": "B",
      "goles_a": 11,
      "goles_b": 9,
      "goles": [
        { "goleador": "Lucian", "equipo": "B" },
        { "goleador": "Vito", "asistente": "Edu", "equipo": "B" },
        { "goleador": "Rubén", "asistente": "Lucian", "equipo": "B" },
        { "goleador": "Rubén", "asistente": "Lucian", "equipo": "B" },
        { "goleador": "Andoni", "asistente": "Flynn", "equipo": "B" },
        { "goleador": "Vito", "asistente": "Andoni", "equipo": "B" },
        { "goleador": "Mateo", "asistente": "Rubén", "equipo": "B" },
        { "goleador": "Edu", "asistente": "Vito", "equipo": "B" },
        { "goleador": "Flynn", "equipo": "Y" },
        { "goleador": "Andoni", "asistente": "Edu", "equipo": "B" },
        { "goleador": "Mateo", "equipo": "B" },
        { "goleador": "Seba", "equipo": "Y" },
        { "goleador": "Borja", "equipo": "Y" },
        { "goleador": "Fran", "asistente": "Miky", "equipo": "Y" },
        { "goleador": "Borja", "asistente": "Miky", "equipo": "Y" },
        { "goleador": "Miky", "asistente": "Borja", "equipo": "Y" },
        { "goleador": "Borja", "equipo": "Y" }
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

// Extract all unique players
const players = new Set<string>();
players.add(data.mvp);
for (const g of match.goles) {
  players.add(g.goleador);
  if (g.asistente) players.add(g.asistente);
}

// Generate variable declarations for players
for (const p of Array.from(players)) {
  sql += `  v_player_${p.toLowerCase().replace(/[^a-z0-9]/g, '')}_id UUID;\n`;
}

sql += `BEGIN
  -- 1. Obtener el partido de la fecha
  SELECT id INTO v_match_id FROM matches WHERE match_date = '${data.fecha}' LIMIT 1;
  IF v_match_id IS NULL THEN
    RAISE EXCEPTION 'Partido no encontrado para la fecha ${data.fecha}';
  END IF;

  -- 2. Obtener IDs de los equipos del partido
  -- Asumiendo que Y es Amarillo (team_number=1) y B es Azul (team_number=2)
  SELECT id INTO v_team_y_id FROM match_teams WHERE match_id = v_match_id AND (team_number = 1 OR team_name ILIKE '%Amarillo%') LIMIT 1;
  SELECT id INTO v_team_b_id FROM match_teams WHERE match_id = v_match_id AND (team_number = 2 OR team_name ILIKE '%Azul%') LIMIT 1;

  IF v_team_y_id IS NULL OR v_team_b_id IS NULL THEN
    RAISE EXCEPTION 'Equipos no encontrados en el partido';
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
