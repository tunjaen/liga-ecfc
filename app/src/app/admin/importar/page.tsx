'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Player, MatchTeam } from '@/types';
import { formatDate } from '@/lib/utils';
import { Upload, Copy, Check, AlertTriangle, Loader2 } from 'lucide-react';

interface MatchData {
  id: string;
  match_date: string;
  num_teams: number;
  teams: (MatchTeam & { players: Player[] })[];
}

// JSON format that AI will produce (hoja de palotes: Rey de la Pista y Clásico)
interface ImportedPlayerTally {
  nombre: string;
  goles: number;
  asistencias: number;
}

interface ImportedTeamTally {
  equipo: string; // Y, B, R, V or team name
  goles_totales: number;
  jugadores: ImportedPlayerTally[];
}

interface ImportedData {
  modo: 'rey' | 'clasico';
  fecha: string;
  mvp: string;
  equipos: ImportedTeamTally[];
}

const TEAM_CODE_MAP: Record<string, string> = {
  'Y': 'Amarillo', 'B': 'Azul', 'R': 'Rojo', 'V': 'Verde',
  'y': 'Amarillo', 'b': 'Azul', 'r': 'Rojo', 'v': 'Verde',
  'Amarillo': 'Amarillo', 'Azul': 'Azul', 'Rojo': 'Rojo', 'Verde': 'Verde',
  'Equipo Amarillo': 'Amarillo', 'Equipo Azul': 'Azul', 'Equipo Rojo': 'Rojo', 'Equipo Verde': 'Verde',
};

function resolveTeamName(code: string): string {
  return TEAM_CODE_MAP[code.trim()] || code.trim();
}

const CHATGPT_PROMPT = `Analiza esta foto de una hoja de registro de fútbol. En la hoja hay una tabla por equipo con los nombres de los jugadores YA IMPRESOS. En cada fila hay 12 CASILLAS CUADRADAS de GOLES y 10 CASILLAS CUADRADAS de ASISTENCIAS (agrupadas en bloques de 5). En las casillas NO hay nombres escritos: cada casilla MARCADA (con una raya vertical |, una raya diagonal /, una X, un tick ✓ o cualquier marca que deje ver el fondo blanco) es 1 gol o 1 asistencia de ese jugador.

Si toda la información es clara, devuélveme un JSON con este formato exacto:

{
"modo": "clasico",
"fecha": "YYYY-MM-DD",
"mvp": "Nombre del MVP",
"equipos": [
{
"equipo": "Y",
"goles_totales": 3,
"jugadores": [
{ "nombre": "Javi", "goles": 2, "asistencias": 0 },
{ "nombre": "Borja", "goles": 1, "asistencias": 2 }
]
},
{
"equipo": "B",
"goles_totales": 1,
"jugadores": [
{ "nombre": "Andres", "goles": 1, "asistencias": 0 }
]
}
]
}

Reglas:

1. MODO DE JUEGO: el título de la hoja dice "Rey de la Pista" (usa "rey") o "Partido Clásico" (usa "clasico").

2. CÓDIGOS DE EQUIPO: Y=Amarillo, B=Azul, R=Rojo, V=Verde. Cada tabla tiene en su cabecera el código y el color del equipo.

3. NOMBRES: copia los nombres EXACTAMENTE como están impresos en la hoja. No los cambies ni los abrevies. Incluye a TODOS los jugadores de cada equipo, aunque tengan 0 goles y 0 asistencias.

4. CÓMO CONTAR: para cada jugador, cuenta cuántas casillas de GOLES están marcadas y cuántas casillas de ASISTENCIAS están marcadas. Cada casilla marcada vale 1, sea con una raya, una X o un tick: una X NO es una anulación, es un gol o asistencia válido. Una casilla en blanco vale 0. Las casillas son independientes: no cuentes rayas sueltas fuera de las casillas.

5. CASILLAS ANULADAS (MUY IMPORTANTE): si una casilla está RELLENA ENTERA (pintada de negro o emborronada por completo), significa que fue un error y esa casilla NO CUENTA: vale 0. Solo una casilla rellena entera (sin fondo blanco visible) se anula; cualquier otra marca (raya, X, tick) cuenta como 1.

6. ANCLAJE DE FILAS Y FOTOS INCLINADAS: la foto puede estar inclinada, rotada o con perspectiva. Para no confundir filas, usa los NÚMEROS DE FILA (#) que hay a la IZQUIERDA y a la DERECHA de cada fila como anclas. Comprueba que el # de la izquierda coincide con el de la derecha antes de asignar las rayas a un jugador.

7. GOLES TOTALES: no hay marcador en la hoja. "goles_totales" de cada equipo es la SUMA de los goles de sus jugadores.

8. MVP: es el único nombre escrito a mano. Crúzalo con los nombres impresos de la hoja y usa el nombre exacto impreso.

9. FECHA: en formato YYYY-MM-DD.

10. MANEJO DE DUDAS (CRÍTICO): si no puedes saber con seguridad si una casilla está marcada, está en blanco o está rellena entera (anulada), NO adivines, NO inventes y NO devuelvas el JSON. Devuelve solo un mensaje indicando exactamente dónde está la duda, mencionando siempre el número de fila (#), el jugador y la casilla (por ejemplo: "Duda en la fila #3 (Javi), GOLES: no sé si la 3ª casilla tiene una marca o está rellena entera").

Antes del JSON quiero ver un resumen: el modo (Rey de la Pista o Clásico), los goles totales de cada equipo y los 3 jugadores con más goles y con más asistencias.`;

export default function ImportarPage() {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [parsedData, setParsedData] = useState<ImportedData | null>(null);
  const [parseError, setParseError] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchMatches = async () => {
      const { data } = await supabase
        .from('matches')
        .select(`
          *,
          teams:match_teams(
            *,
            players:match_team_players(
              player:players(*)
            )
          )
        `)
        .eq('status', 'published')
        .order('match_date', { ascending: false });

      if (data) {
        setMatches(data.map((m: any) => ({
          ...m,
          teams: (m.teams || []).map((t: any) => ({
            ...t,
            players: (t.players || []).map((p: any) => p.player),
          })).sort((a: any, b: any) => a.team_number - b.team_number),
        })));
        if (data.length > 0) setSelectedMatchId(data[0].id);
      }
      setLoading(false);
    };
    fetchMatches();
  }, []);

  const selectedMatch = matches.find(m => m.id === selectedMatchId);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(CHATGPT_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleParseJSON = () => {
    setParseError('');
    setParsedData(null);
    try {
      // Try to extract JSON from markdown code blocks if present
      let cleaned = jsonInput.trim();
      const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) cleaned = jsonMatch[1].trim();

      const data: ImportedData = JSON.parse(cleaned);

      // Validate structure
      if (!data.equipos || !Array.isArray(data.equipos) || data.equipos.length < 2) {
        throw new Error('El JSON debe tener un array "equipos" con al menos 2 equipos.');
      }
      for (const eq of data.equipos) {
        if (!eq.equipo || !Array.isArray(eq.jugadores)) {
          throw new Error('Cada equipo debe tener "equipo" y un array "jugadores".');
        }
        for (const j of eq.jugadores) {
          if (!j.nombre || !Number.isInteger(j.goles ?? 0) || !Number.isInteger(j.asistencias ?? 0) || (j.goles ?? 0) < 0 || (j.asistencias ?? 0) < 0) {
            throw new Error(`Datos no válidos para el jugador "${j.nombre ?? '?'}" (equipo ${eq.equipo}).`);
          }
        }
        const suma = eq.jugadores.reduce((acc, j) => acc + (j.goles ?? 0), 0);
        if (typeof eq.goles_totales === 'number' && eq.goles_totales !== suma) {
          throw new Error(`Equipo ${eq.equipo}: "goles_totales" (${eq.goles_totales}) no coincide con la suma de goles de sus jugadores (${suma}).`);
        }
        eq.goles_totales = suma;
      }
      if (!data.mvp) {
        throw new Error('Falta el campo "mvp" con el nombre del MVP.');
      }

      setParsedData(data);
    } catch (e: any) {
      setParseError(e.message || 'JSON no válido');
    }
  };

  const handleImport = async () => {
    if (!parsedData || !selectedMatch) return;
    setImporting(true);
    setImportResult(null);

    try {
      // Build a player lookup: name -> player id
      const allPlayers = selectedMatch.teams.flatMap(t =>
        t.players.map(p => ({ ...p, teamId: t.id, teamName: t.team_name }))
      );
      const playerLookup = new Map<string, typeof allPlayers[0]>();
      allPlayers.forEach(p => {
        playerLookup.set(p.name.trim().toLowerCase(), p);
      });

      // Build a team lookup: color name -> team
      const teamLookup = new Map<string, typeof selectedMatch.teams[0]>();
      selectedMatch.teams.forEach(t => {
        const colorName = t.team_name.replace('Equipo ', '');
        teamLookup.set(colorName.toLowerCase(), t);
        teamLookup.set(t.team_name.toLowerCase(), t);
      });

      // Resolve teams first so we fail before writing anything
      const resolved = parsedData.equipos.map(eq => {
        const team = teamLookup.get(resolveTeamName(eq.equipo).toLowerCase());
        if (!team) throw new Error(`Equipo no encontrado en la convocatoria: ${eq.equipo}`);
        return { eq, team };
      });

      const missing: string[] = [];
      resolved.forEach(({ eq }) => eq.jugadores.forEach(j => {
        if (!playerLookup.has(j.nombre.trim().toLowerCase())) missing.push(j.nombre);
      }));
      if (missing.length > 0) {
        throw new Error(`Jugadores no encontrados en la convocatoria: ${missing.join(', ')}`);
      }

      // Winner = team with most goals (no winner if tied at the top)
      const maxGoals = Math.max(...resolved.map(r => r.eq.goles_totales));
      const topTeams = resolved.filter(r => r.eq.goles_totales === maxGoals);

      // Create one completed match with all the teams of the sheet
      const { data: newMatch, error: matchErr } = await supabase.from('matches').insert({
        match_date: parsedData.fecha || selectedMatch.match_date,
        status: 'completed',
        num_teams: resolved.length,
      }).select().single();

      if (matchErr || !newMatch) {
        throw new Error(`Error creando el partido: ${matchErr?.message ?? 'desconocido'}`);
      }

      let goalCount = 0;
      let assistCount = 0;

      for (let i = 0; i < resolved.length; i++) {
        const { eq, team } = resolved[i];
        const isWinner = topTeams.length === 1 && topTeams[0].team.id === team.id;

        const { data: newTeam } = await supabase.from('match_teams').insert({
          match_id: newMatch.id,
          team_number: i + 1,
          team_name: team.team_name,
          team_color: team.team_color,
          total_points: team.total_points,
          goals_scored: eq.goles_totales,
          is_winner: isWinner,
        }).select().single();

        if (!newTeam) continue;

        const players = team.players.map(p => ({ match_team_id: newTeam.id, player_id: p.id }));
        await supabase.from('match_team_players').insert(players);

        // One event per tally mark
        const events: { match_id: string; player_id: string; match_team_id: string; event_type: 'goal' | 'assist' }[] = [];
        for (const j of eq.jugadores) {
          const player = playerLookup.get(j.nombre.trim().toLowerCase())!;
          for (let g = 0; g < (j.goles ?? 0); g++) {
            events.push({ match_id: newMatch.id, player_id: player.id, match_team_id: newTeam.id, event_type: 'goal' });
          }
          for (let a = 0; a < (j.asistencias ?? 0); a++) {
            events.push({ match_id: newMatch.id, player_id: player.id, match_team_id: newTeam.id, event_type: 'assist' });
          }
          goalCount += j.goles ?? 0;
          assistCount += j.asistencias ?? 0;
        }
        if (events.length > 0) {
          await supabase.from('match_events').insert(events);
        }
      }

      // MVP
      if (parsedData.mvp) {
        const mvpPlayer = playerLookup.get(parsedData.mvp.trim().toLowerCase());
        if (mvpPlayer) {
          await supabase.from('matches').update({ mvp_player_id: mvpPlayer.id }).eq('id', newMatch.id);
        }
      }

      // Publish the parent match if it was published
      if (parsedData.modo === 'clasico' || parsedData.modo === 'rey') {
        // En lugar de marcar el esqueleto original como "completed", lo eliminamos.
        // Los resultados reales ya se han guardado como partidos nuevos.
        await supabase.from('matches').delete().eq('id', selectedMatch.id);
      }

      setImportResult(`✅ ¡Importación completada! Se registraron ${goalCount} goles y ${assistCount} asistencias.`);
    } catch (err: any) {
      setImportResult(`❌ Error durante la importación: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <h1 className="mb-lg">📱 Importar Hoja de Registro</h1>
        <div className="skeleton skeleton-card" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="mb-lg">📱 Importar Hoja de Registro</h1>

      {/* Step 1: Select match */}
      <div className="card mb-lg" style={{ padding: 'var(--space-md)' }}>
        <div className="flex items-center gap-sm mb-sm">
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>1</div>
          <h3 style={{ fontSize: '1rem' }}>Selecciona la convocatoria</h3>
        </div>
        <select className="select" value={selectedMatchId} onChange={e => setSelectedMatchId(e.target.value)}>
          <option value="">-- Selecciona --</option>
          {matches.map(m => (
            <option key={m.id} value={m.id}>
              {formatDate(m.match_date)} — {m.num_teams} Equipos
            </option>
          ))}
        </select>
      </div>

      {/* Step 2: Copy prompt */}
      <div className="card mb-lg" style={{ padding: 'var(--space-md)' }}>
        <div className="flex items-center gap-sm mb-sm">
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>2</div>
          <h3 style={{ fontSize: '1rem' }}>Copia el prompt para la IA</h3>
        </div>
        <p className="text-sm text-muted mb-md">
          Sube la foto de la hoja rellenada a ChatGPT y pega este prompt. La IA te devolverá un JSON estructurado.
        </p>
        <div style={{ position: 'relative' }}>
          <pre style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-md)',
            fontSize: '11px',
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap',
            maxHeight: '200px',
            overflow: 'auto',
          }}>
            {CHATGPT_PROMPT}
          </pre>
          <button
            className="btn btn-secondary btn-sm"
            style={{ position: 'absolute', top: '8px', right: '8px' }}
            onClick={handleCopyPrompt}
          >
            {copied ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar</>}
          </button>
        </div>
      </div>

      {/* Step 3: Paste JSON */}
      <div className="card mb-lg" style={{ padding: 'var(--space-md)' }}>
        <div className="flex items-center gap-sm mb-sm">
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>3</div>
          <h3 style={{ fontSize: '1rem' }}>Pega el JSON de ChatGPT</h3>
        </div>
        <p className="text-sm text-muted mb-md">
          Copia la respuesta completa de ChatGPT y pégala aquí:
        </p>
        <textarea
          className="input"
          rows={10}
          value={jsonInput}
          onChange={e => setJsonInput(e.target.value)}
          placeholder='Pega aquí el JSON que te dio ChatGPT...'
          style={{ fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }}
        />
        <button
          className="btn btn-primary mt-md"
          onClick={handleParseJSON}
          disabled={!jsonInput.trim()}
        >
          Validar JSON
        </button>

        {parseError && (
          <div className="flex items-center gap-sm mt-md" style={{ color: 'var(--accent-danger)' }}>
            <AlertTriangle size={16} />
            <span className="text-sm">{parseError}</span>
          </div>
        )}
      </div>

      {/* Step 4: Preview & Import */}
      {parsedData && (
        <div className="card mb-lg" style={{ padding: 'var(--space-md)' }}>
          <div className="flex items-center gap-sm mb-md">
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-secondary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>4</div>
            <h3 style={{ fontSize: '1rem' }}>Vista previa</h3>
          </div>

          <div className="text-sm mb-md">
            <strong>Modo:</strong> {parsedData.modo === 'rey' ? '⚔️ Rey de la Pista' : '🏆 Clásico'} &nbsp;|&nbsp;
            <strong>Fecha:</strong> {parsedData.fecha} &nbsp;|&nbsp;
            <strong>MVP:</strong> {parsedData.mvp}
          </div>

          <div className="flex flex-col gap-xs mb-md">
            {parsedData.equipos.map((eq, i) => (
              <div key={i} className="text-sm" style={{ padding: 'var(--space-xs) 0', borderBottom: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-sm">
                  <strong>{resolveTeamName(eq.equipo)}</strong>
                  <span>— {eq.goles_totales} gol(es)</span>
                </div>
                <div className="text-xs text-muted">
                  {eq.jugadores
                    .filter(j => (j.goles ?? 0) > 0 || (j.asistencias ?? 0) > 0)
                    .map(j => `${j.nombre} (${j.goles ?? 0}G ${j.asistencias ?? 0}A)`)
                    .join(', ') || 'Sin goles ni asistencias'}
                </div>
              </div>
            ))}
          </div>

          <button
            className="btn btn-success btn-lg w-full"
            onClick={handleImport}
            disabled={importing || !selectedMatch}
          >
            {importing ? (
              <><Loader2 size={20} className="animate-spin" /> Importando...</>
            ) : (
              <><Upload size={20} /> Importar resultados</>
            )}
          </button>

          {importResult && (
            <div className="card mt-md text-center" style={{
              padding: 'var(--space-md)',
              background: importResult.startsWith('✅') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            }}>
              <span style={{ fontSize: '1.1rem' }}>{importResult}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
