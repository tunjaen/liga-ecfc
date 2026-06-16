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

// JSON format that AI will produce
interface ImportedGoal {
  goleador: string;
  asistente?: string;
  equipo: string; // Y, B, R, V or team name
}

interface ImportedMiniGame {
  equipo_a: string;
  equipo_b: string;
  goles_a: number;
  goles_b: number;
  goles: ImportedGoal[];
}

interface ImportedData {
  modo: 'rey' | 'clasico';
  fecha: string;
  mvp: string;
  partidos: ImportedMiniGame[];
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

const CHATGPT_PROMPT = `Analiza esta foto de una hoja de registro de partidos de fútbol. Si toda la información es clara, devuélveme SOLO un JSON con este formato exacto (sin texto adicional ni bloques de markdown si es posible):

{
"modo": "rey",
"fecha": "YYYY-MM-DD",
"mvp": "Nombre del MVP",
"partidos": [
{
"equipo_a": "Y",
"equipo_b": "B",
"goles_a": 2,
"goles_b": 1,
"goles": [
{ "goleador": "Javi", "asistente": "Borja", "equipo": "Y" },
{ "goleador": "Alex", "equipo": "Y" },
{ "goleador": "Andres", "asistente": "Pedro", "equipo": "B" }
]
}
]
}

Reglas:

"modo": usa "rey" si hay varios partidos o "clasico" si solo hay uno.

Los equipos se codifican como: Y=Amarillo, B=Azul, R=Rojo, V=Verde.

Si no hay asistente, omite el campo "asistente".

Solo incluye partidos rellenados, ignora las filas vacías.

La fecha debe estar en formato YYYY-MM-DD.

VALIDACIÓN DE NOMBRES: En la parte superior de la hoja están escritos todos los nombres de los jugadores. Si tienes alguna duda sobre cómo se escribe o lee un nombre en la sección de los partidos (por caligrafía confusa, abreviaturas, etc.), es OBLIGATORIO que lo consultes y cruces con esa lista superior para asegurarte de que el nombre exacto y correcto se mete en el JSON.

VALIDACIÓN Y CORRECCIÓN DE RESULTADOS: Para evitar errores humanos en la anotación, NO confíes ciegamente en las columnas "RES. A" y "RES. B". Para determinar los valores finales de "goles_a" y "goles_b" en el JSON, DEBES contar cuántas veces aparece el código de cada equipo en la subcolumna "EQ" de los detalles de GOL 1, GOL 2 y GOL 3. Los detalles de los goles siempre tienen prioridad sobre el marcador anotado.

MANEJO DE DUDAS (CRÍTICO): Si encuentras algún dato completamente ilegible, o una contradicción que no puedas resolver con las reglas anteriores, NO intentes adivinar, NO inventes información y NO devuelvas el JSON. En su lugar, devuelve únicamente un mensaje de texto indicando exactamente dónde está la duda (por ejemplo: "Duda en el partido 3: no puedo leer el nombre del asistente del GOL 2 del equipo Y") y pide aclaración.`;

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
      if (!data.partidos || !Array.isArray(data.partidos) || data.partidos.length === 0) {
        throw new Error('El JSON debe tener un array "partidos" con al menos un partido.');
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
        playerLookup.set(p.name.toLowerCase(), p);
      });

      // Build a team lookup: color name -> team
      const teamLookup = new Map<string, typeof selectedMatch.teams[0]>();
      selectedMatch.teams.forEach(t => {
        const colorName = t.team_name.replace('Equipo ', '');
        teamLookup.set(colorName.toLowerCase(), t);
        teamLookup.set(t.team_name.toLowerCase(), t);
      });

      let registeredCount = 0;

      for (const partido of parsedData.partidos) {
        const teamAColor = resolveTeamName(partido.equipo_a);
        const teamBColor = resolveTeamName(partido.equipo_b);
        const teamA = teamLookup.get(teamAColor.toLowerCase());
        const teamB = teamLookup.get(teamBColor.toLowerCase());

        if (!teamA || !teamB) {
          console.warn(`Equipos no encontrados: ${partido.equipo_a} / ${partido.equipo_b}`);
          continue;
        }

        const goalsA = partido.goles_a;
        const goalsB = partido.goles_b;
        const isWinnerA = goalsA > goalsB;
        const isWinnerB = goalsB > goalsA;

        // Create mini-match
        const { data: newMatch, error: matchErr } = await supabase.from('matches').insert({
          match_date: parsedData.fecha || selectedMatch.match_date,
          status: 'completed',
          num_teams: 2,
        }).select().single();

        if (matchErr || !newMatch) {
          console.error('Error creando partido:', matchErr);
          continue;
        }

        // Create teams
        const insertTeam = async (team: typeof teamA, goals: number, isWinner: boolean, teamNum: number) => {
          const { data: newTeam } = await supabase.from('match_teams').insert({
            match_id: newMatch.id,
            team_number: teamNum,
            team_name: team.team_name,
            team_color: team.team_color,
            total_points: team.total_points,
            goals_scored: goals,
            is_winner: isWinner,
          }).select().single();

          if (newTeam) {
            const players = team.players.map(p => ({ match_team_id: newTeam.id, player_id: p.id }));
            await supabase.from('match_team_players').insert(players);
          }
          return newTeam;
        };

        const newTeamA = await insertTeam(teamA, goalsA, isWinnerA, 1);
        const newTeamB = await insertTeam(teamB, goalsB, isWinnerB, 2);

        if (!newTeamA || !newTeamB) continue;

        // Insert goal events
        for (const gol of partido.goles) {
          const golTeamColor = resolveTeamName(gol.equipo);
          const matchTeamId = golTeamColor.toLowerCase() === teamAColor.toLowerCase() ? newTeamA.id : newTeamB.id;

          const scorer = playerLookup.get(gol.goleador.toLowerCase());
          if (!scorer) {
            console.warn(`Jugador no encontrado: ${gol.goleador}`);
            continue;
          }

          await supabase.from('match_events').insert({
            match_id: newMatch.id,
            player_id: scorer.id,
            match_team_id: matchTeamId,
            event_type: 'goal',
          });

          if (gol.asistente) {
            const assister = playerLookup.get(gol.asistente.toLowerCase());
            if (assister) {
              await supabase.from('match_events').insert({
                match_id: newMatch.id,
                player_id: assister.id,
                match_team_id: matchTeamId,
                event_type: 'assist',
              });
            }
          }
        }

        registeredCount++;
      }

      // Set MVP on the last match
      if (parsedData.mvp) {
        const mvpPlayer = playerLookup.get(parsedData.mvp.toLowerCase());
        if (mvpPlayer) {
          // Get the last created match for this date
          const { data: lastMatch } = await supabase
            .from('matches')
            .select('id')
            .eq('match_date', parsedData.fecha || selectedMatch.match_date)
            .eq('status', 'completed')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (lastMatch) {
            await supabase.from('matches').update({ mvp_player_id: mvpPlayer.id }).eq('id', lastMatch.id);
          }
        }
      }

      // Publish the parent match if it was published
      if (parsedData.modo === 'clasico' || parsedData.modo === 'rey') {
        // En lugar de marcar el esqueleto original como "completed", lo eliminamos.
        // Los resultados reales ya se han guardado como partidos nuevos.
        await supabase.from('matches').delete().eq('id', selectedMatch.id);
      }

      setImportResult(`✅ ¡Importación completada! Se registraron ${registeredCount} partido(s) correctamente.`);
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
          <h3 style={{ fontSize: '1rem' }}>Copia el prompt para ChatGPT</h3>
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
            <strong>MVP:</strong> {parsedData.mvp} &nbsp;|&nbsp;
            <strong>Partidos:</strong> {parsedData.partidos.length}
          </div>

          <div className="flex flex-col gap-xs mb-md">
            {parsedData.partidos.map((p, i) => (
              <div key={i} className="flex items-center gap-sm text-sm" style={{ padding: 'var(--space-xs) 0', borderBottom: '1px solid var(--border-color)' }}>
                <span className="text-muted">#{i + 1}</span>
                <strong>{resolveTeamName(p.equipo_a)}</strong>
                <span>{p.goles_a} - {p.goles_b}</span>
                <strong>{resolveTeamName(p.equipo_b)}</strong>
                {p.goles.length > 0 && (
                  <span className="text-xs text-muted">
                    ({p.goles.map(g => g.goleador).join(', ')})
                  </span>
                )}
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
              <><Upload size={20} /> Importar {parsedData.partidos.length} partido(s)</>
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
