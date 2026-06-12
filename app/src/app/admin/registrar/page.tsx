'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Player, MatchTeam } from '@/types';
import { PlayerAvatar } from '@/components/players/PlayerAvatar';
import { getPlayerPhotoUrl, formatDate } from '@/lib/utils';
import { Plus, Trash2, Check, Trophy, Swords, CalendarCheck } from 'lucide-react';

interface MatchData {
  id: string;
  match_date: string;
  num_teams: number;
  teams: (MatchTeam & { players: Player[] })[];
}

interface GoalEntry {
  id: string;
  teamId: string;
  scorerId: string;
  assisterId: string;
  minute: string;
}

export default function RegistrarPage() {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [goals, setGoals] = useState<GoalEntry[]>([]);
  const [mvpId, setMvpId] = useState('');
  const [teamGoals, setTeamGoals] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Rey de la Pista (Mini-games)
  const [isMiniGameMode, setIsMiniGameMode] = useState(false);
  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');

  const supabase = createClient();

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    const { data: matchList } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'published')
      .order('match_date', { ascending: false });

    if (!matchList || matchList.length === 0) {
      setMatches([]);
      setLoading(false);
      return;
    }

    const enriched: MatchData[] = [];
    for (const match of matchList) {
      const { data: teams } = await supabase
        .from('match_teams')
        .select(`
          *,
          players:match_team_players(
            player:players(*)
          )
        `)
        .eq('match_id', match.id)
        .order('team_number');

      enriched.push({
        ...match,
        teams: (teams || []).map((t) => ({
          ...t,
          players: (t.players || []).map((p: { player: Player }) => p.player),
        })),
      });
    }

    setMatches(enriched);
    setLoading(false);
  };

  const selectedMatch = matches.find((m) => m.id === selectedMatchId);
  const allPlayers = selectedMatch
    ? selectedMatch.teams.flatMap((t) => t.players.map((p) => ({ ...p, teamId: t.id, teamColor: t.team_color, teamName: t.team_name })))
    : [];

  const handleMatchSelect = (matchId: string) => {
    setSelectedMatchId(matchId);
    setGoals([]);
    setMvpId('');
    setSaved(false);

    const match = matches.find((m) => m.id === matchId);
    if (match) {
      if (match.num_teams > 2) {
        setIsMiniGameMode(true);
        setTeamAId(match.teams[0].id);
        setTeamBId(match.teams[1].id);
        setTeamGoals({ [match.teams[0].id]: 0, [match.teams[1].id]: 0 });
      } else {
        setIsMiniGameMode(false);
        const initGoals: Record<string, number> = {};
        match.teams.forEach((t) => { initGoals[t.id] = 0; });
        setTeamGoals(initGoals);
      }
    }
  };

  const handleTeamChange = (role: 'A' | 'B', newTeamId: string) => {
    if (role === 'A') setTeamAId(newTeamId);
    else setTeamBId(newTeamId);
    setTeamGoals(prev => ({ ...prev, [newTeamId]: prev[newTeamId] || 0 }));
    // Limpiar goles que ya no pertenezcan a los equipos activos
    setGoals(goals.filter(g => g.teamId === (role === 'A' ? newTeamId : teamAId) || g.teamId === (role === 'B' ? newTeamId : teamBId)));
  };

  const addGoal = () => {
    const defaultTeamId = isMiniGameMode ? teamAId : (selectedMatch?.teams[0]?.id || '');
    setGoals([
      ...goals,
      {
        id: crypto.randomUUID(),
        teamId: defaultTeamId,
        scorerId: '',
        assisterId: '',
        minute: '',
      },
    ]);
  };

  const updateGoal = (id: string, field: keyof GoalEntry, value: string) => {
    setGoals(goals.map((g) => (g.id === id ? { ...g, [field]: value } : g)));
  };

  const removeGoal = (id: string) => {
    setGoals(goals.filter((g) => g.id !== id));
  };

  const getTeamPlayersForGoal = (teamId: string) => {
    const team = selectedMatch?.teams.find((t) => t.id === teamId);
    return team?.players || [];
  };

  // ---- Classic Mode Save ----
  const handleSaveClassic = async () => {
    if (!selectedMatch || !mvpId) {
      alert('Selecciona el MVP del partido.');
      return;
    }
    setSaving(true);
    const maxGoals = Math.max(...Object.values(teamGoals));
    const winnersCount = Object.values(teamGoals).filter((g) => g === maxGoals).length;

    for (const team of selectedMatch.teams) {
      const goalsScored = teamGoals[team.id] || 0;
      const isWinner = winnersCount === 1 && goalsScored === maxGoals;
      await supabase.from('match_teams').update({ goals_scored: goalsScored, is_winner: isWinner }).eq('id', team.id);
    }

    for (const goal of goals) {
      if (!goal.scorerId) continue;
      await supabase.from('match_events').insert({
        match_id: selectedMatch.id, player_id: goal.scorerId, match_team_id: goal.teamId, event_type: 'goal', minute: goal.minute ? parseInt(goal.minute) : null,
      });
      if (goal.assisterId) {
        await supabase.from('match_events').insert({
          match_id: selectedMatch.id, player_id: goal.assisterId, match_team_id: goal.teamId, event_type: 'assist', minute: goal.minute ? parseInt(goal.minute) : null,
        });
      }
    }

    await supabase.from('matches').update({ status: 'completed', mvp_player_id: mvpId }).eq('id', selectedMatch.id);
    setSaving(false);
    setSaved(true);
    fetchMatches();
  };

  // ---- Mini-Game Mode Save ----
  const handleSaveMiniGame = async () => {
    if (!selectedMatch || !teamAId || !teamBId) return;
    if (teamAId === teamBId) {
      alert('Selecciona dos equipos distintos.');
      return;
    }
    
    setSaving(true);
    const teamA = selectedMatch.teams.find(t => t.id === teamAId)!;
    const teamB = selectedMatch.teams.find(t => t.id === teamBId)!;
    
    const goalsA = teamGoals[teamAId] || 0;
    const goalsB = teamGoals[teamBId] || 0;
    const isWinnerA = goalsA > goalsB;
    const isWinnerB = goalsB > goalsA;

    // 1. Create new match record
    const { data: newMatch, error: matchError } = await supabase.from('matches').insert({
      match_date: selectedMatch.match_date,
      status: 'completed',
      num_teams: 2,
    }).select().single();

    if (matchError || !newMatch) {
      setSaving(false);
      alert('Error creando mini-partido');
      return;
    }

    // 2. Insert match_teams and players
    const insertTeam = async (t: typeof teamA, goalsScored: number, isWinner: boolean, teamNumber: number) => {
      const { data: newTeam } = await supabase.from('match_teams').insert({
        match_id: newMatch.id, team_number: teamNumber, team_name: t.team_name, team_color: t.team_color, total_points: t.total_points, goals_scored: goalsScored, is_winner: isWinner
      }).select().single();
      
      if (newTeam) {
        const teamPlayers = t.players.map(p => ({ match_team_id: newTeam.id, player_id: p.id }));
        await supabase.from('match_team_players').insert(teamPlayers);
      }
      return newTeam;
    };

    const newTeamA = await insertTeam(teamA, goalsA, isWinnerA, 1);
    const newTeamB = await insertTeam(teamB, goalsB, isWinnerB, 2);

    // 3. Insert events
    for (const goal of goals) {
      if (!goal.scorerId) continue;
      const newTeamId = goal.teamId === teamAId ? newTeamA?.id : newTeamB?.id;
      if (!newTeamId) continue;

      await supabase.from('match_events').insert({
        match_id: newMatch.id, player_id: goal.scorerId, match_team_id: newTeamId, event_type: 'goal', minute: goal.minute ? parseInt(goal.minute) : null,
      });
      if (goal.assisterId) {
        await supabase.from('match_events').insert({
          match_id: newMatch.id, player_id: goal.assisterId, match_team_id: newTeamId, event_type: 'assist', minute: goal.minute ? parseInt(goal.minute) : null,
        });
      }
    }

    setSaving(false);
    alert('¡Mini-partido guardado! Puedes registrar otro o finalizar la jornada.');
    setGoals([]);
    setTeamGoals({ [teamAId]: 0, [teamBId]: 0 });
  };

  const handleFinalizeDay = async () => {
    if (!selectedMatch || !mvpId) {
      alert('Selecciona el MVP global del día antes de finalizar.');
      return;
    }
    setSaving(true);

    // 1. Find the latest completed mini-game for today
    const { data: latestMatch } = await supabase
      .from('matches')
      .select('id')
      .eq('match_date', selectedMatch.match_date)
      .eq('status', 'completed')
      .eq('num_teams', 2)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (latestMatch) {
      // Set MVP to the last mini-game
      await supabase.from('matches').update({ mvp_player_id: mvpId }).eq('id', latestMatch.id);
    }

    // 2. Delete the published container match (Match #0)
    await supabase.from('matches').delete().eq('id', selectedMatch.id);

    setSaving(false);
    setSaved(true);
    setSelectedMatchId('');
    fetchMatches();
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <h1 className="mb-lg">📝 Registrar Resultado</h1>
        <div className="skeleton skeleton-card" />
      </div>
    );
  }

  const activeTeamsToScore = isMiniGameMode 
    ? selectedMatch?.teams.filter(t => t.id === teamAId || t.id === teamBId) || []
    : selectedMatch?.teams || [];

  return (
    <div className="animate-fade-in">
      <h1 className="mb-lg">📝 Registrar Resultado</h1>

      {matches.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <div className="empty-state-title">Sin partidos pendientes</div>
            <div className="empty-state-text">
              Genera y publica una convocatoria desde el Matchmaker primero.
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Select Match */}
          <div className="input-group mb-lg">
            <label className="input-label">Seleccionar Partido o Convocatoria</label>
            <select
              className="select"
              value={selectedMatchId}
              onChange={(e) => handleMatchSelect(e.target.value)}
            >
              <option value="">-- Selecciona una convocatoria --</option>
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  {formatDate(m.match_date)} — {m.num_teams} Equipos
                </option>
              ))}
            </select>
          </div>

          {selectedMatch && !saved && (
            <>
              {isMiniGameMode && (
                <div className="card mb-lg" style={{ background: 'rgba(59, 130, 246, 0.05)' }}>
                  <div className="flex items-center gap-sm mb-sm" style={{ color: 'var(--accent-primary)' }}>
                    <Swords size={20} />
                    <h3 style={{ fontSize: '1.1rem' }}>Modo Rey de la Pista</h3>
                  </div>
                  <p className="text-sm text-muted mb-md">
                    Hay {selectedMatch.num_teams} equipos. Selecciona los dos equipos que juegan este mini-partido y guárdalo. Repite este proceso para cada enfrentamiento del día.
                  </p>
                  <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
                    <div className="input-group flex-1" style={{ minWidth: '200px' }}>
                      <label className="input-label">Equipo A</label>
                      <select className="select" value={teamAId} onChange={(e) => handleTeamChange('A', e.target.value)}>
                        {selectedMatch.teams.map(t => <option key={t.id} value={t.id}>{t.team_name}</option>)}
                      </select>
                    </div>
                    <div className="input-group flex-1" style={{ minWidth: '200px' }}>
                      <label className="input-label">Equipo B</label>
                      <select className="select" value={teamBId} onChange={(e) => handleTeamChange('B', e.target.value)}>
                        {selectedMatch.teams.map(t => <option key={t.id} value={t.id}>{t.team_name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Team Scores */}
              <div className="card mb-lg">
                <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}>Marcador {isMiniGameMode && 'del mini-partido'}</h3>
                <div className="flex gap-lg" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                  {activeTeamsToScore.map((team) => (
                    <div key={team.id} className="flex flex-col items-center gap-sm">
                      <span className="font-semibold text-sm" style={{ color: team.team_color }}>
                        {team.team_name}
                      </span>
                      <input
                        type="number"
                        className="input text-center"
                        style={{ width: '80px', fontSize: '1.5rem', fontWeight: 800 }}
                        min="0"
                        value={teamGoals[team.id] || 0}
                        onChange={(e) => setTeamGoals({ ...teamGoals, [team.id]: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Goal Events */}
              <div className="card mb-lg">
                <div className="flex items-center justify-between mb-md">
                  <h3 style={{ fontSize: '1rem' }}>⚽ Goles y Asistencias</h3>
                  <button className="btn btn-secondary btn-sm" onClick={addGoal}>
                    <Plus size={16} /> Añadir Gol
                  </button>
                </div>

                {goals.length === 0 ? (
                  <div className="text-sm text-muted text-center" style={{ padding: 'var(--space-lg)' }}>
                    Pulsa &quot;Añadir Gol&quot; para registrar goleadores y asistentes
                  </div>
                ) : (
                  <div className="flex flex-col gap-md">
                    {goals.map((goal, index) => (
                      <div key={goal.id} className="card" style={{ background: 'var(--bg-surface)', padding: 'var(--space-md)' }}>
                        <div className="flex items-center justify-between mb-sm">
                          <span className="text-xs font-semibold text-muted">Gol #{index + 1}</span>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => removeGoal(goal.id)} style={{ color: 'var(--accent-danger)' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="flex flex-col gap-sm">
                          <select className="select" value={goal.teamId} onChange={(e) => {
                            updateGoal(goal.id, 'teamId', e.target.value);
                            updateGoal(goal.id, 'scorerId', ''); updateGoal(goal.id, 'assisterId', '');
                          }}>
                            {activeTeamsToScore.map((t) => <option key={t.id} value={t.id}>{t.team_name}</option>)}
                          </select>
                          <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                            <div className="flex-1 input-group" style={{ minWidth: '140px' }}>
                              <label className="input-label text-xs">Goleador</label>
                              <select className="select" value={goal.scorerId} onChange={(e) => updateGoal(goal.id, 'scorerId', e.target.value)}>
                                <option value="">Seleccionar...</option>
                                {getTeamPlayersForGoal(goal.teamId).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                            </div>
                            <div className="flex-1 input-group" style={{ minWidth: '140px' }}>
                              <label className="input-label text-xs">Asistente (opc.)</label>
                              <select className="select" value={goal.assisterId} onChange={(e) => updateGoal(goal.id, 'assisterId', e.target.value)}>
                                <option value="">Sin asistencia</option>
                                {getTeamPlayersForGoal(goal.teamId).filter((p) => p.id !== goal.scorerId).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                            </div>
                            <div className="input-group" style={{ width: '80px' }}>
                              <label className="input-label text-xs">Min.</label>
                              <input type="number" className="input" min="0" max="120" placeholder="--" value={goal.minute} onChange={(e) => updateGoal(goal.id, 'minute', e.target.value)} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {!isMiniGameMode ? (
                <>
                  <div className="card mb-lg">
                    <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}>⭐ Jugador Destacado (MVP)</h3>
                    <select className="select" value={mvpId} onChange={(e) => setMvpId(e.target.value)}>
                      <option value="">Seleccionar MVP...</option>
                      {allPlayers.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.teamName})</option>)}
                    </select>
                  </div>
                  <button className="btn btn-success btn-lg" onClick={handleSaveClassic} disabled={saving || !mvpId}>
                    <Trophy size={20} />
                    {saving ? 'Guardando...' : 'Registrar Partido'}
                  </button>
                </>
              ) : (
                <div className="flex gap-md" style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <button className="btn btn-primary btn-lg" onClick={handleSaveMiniGame} disabled={saving}>
                    <Swords size={20} />
                    {saving ? 'Guardando...' : 'Guardar Mini-partido'}
                  </button>

                  <div className="card" style={{ flex: '1', minWidth: '300px', padding: 'var(--space-md)' }}>
                    <div className="flex items-center gap-sm mb-sm" style={{ color: 'var(--accent-warning)' }}>
                      <CalendarCheck size={18} />
                      <h4 style={{ fontSize: '0.95rem' }}>Finalizar Jornada</h4>
                    </div>
                    <p className="text-xs text-muted mb-md">Al terminar todos los mini-partidos del día, selecciona el MVP global y cierra la jornada.</p>
                    <div className="input-group mb-md">
                      <select className="select" value={mvpId} onChange={(e) => setMvpId(e.target.value)}>
                        <option value="">Seleccionar MVP Global...</option>
                        {allPlayers.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.teamName})</option>)}
                      </select>
                    </div>
                    <button className="btn btn-secondary w-full" onClick={handleFinalizeDay} disabled={saving || !mvpId}>
                      Finalizar Jornada
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {saved && (
            <div className="card text-center animate-scale-in mt-lg" style={{ padding: 'var(--space-2xl)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>🎉</div>
              <h2 style={{ marginBottom: 'var(--space-sm)' }}>¡Jornada Completada!</h2>
              <p className="text-muted">
                Los resultados ya son visibles en el historial y la clasificación.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
