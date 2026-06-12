'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Player } from '@/types';
import { balanceTeams, calculateStdDev, maxMinDiff, generateTeamSummary } from '@/lib/algorithm/balance';
import type { BalanceResult } from '@/types';
import { PlayerAvatar } from '@/components/players/PlayerAvatar';
import { getPlayerPhotoUrl, getBalanceQuality, getBalanceLabel } from '@/lib/utils';
import { Search, Zap, RotateCw, Upload, Check } from 'lucide-react';

export default function MatchmakerPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [numTeams, setNumTeams] = useState(2);
  const [result, setResult] = useState<BalanceResult | null>(null);
  const [search, setSearch] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [pastMatches, setPastMatches] = useState<any[]>([]);

  const supabase = createClient();

  useEffect(() => {
    const fetchPlayers = async () => {
      const { data } = await supabase
        .from('players')
        .select('*')
        .eq('is_active', true)
        .order('name');
      setPlayers(data || []);
    };

    const fetchPastMatches = async () => {
      const { data: matches } = await supabase
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
        .order('match_date', { ascending: false })
        .limit(5);

      if (matches) {
        const formatted = matches.map((m: any) => ({
          ...m,
          teams: m.teams.map((t: any) => ({
            ...t,
            players: t.players.map((p: any) => p.player)
          }))
        }));
        setPastMatches(formatted);
      }
    };

    fetchPlayers();
    fetchPastMatches();
  }, []);

  const filteredPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const togglePlayer = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  };

  const selectAll = () => {
    setSelected(new Set(filteredPlayers.map((p) => p.id)));
  };

  const deselectAll = () => {
    setSelected(new Set());
  };

  const selectedPlayers = players.filter((p) => selected.has(p.id));

  const handleGenerate = () => {
    try {
      const res = balanceTeams(selectedPlayers, numTeams, pastMatches);
      setResult(res);
      setStep(3);
      setPublished(false);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  const handlePublish = async () => {
    if (!result) return;
    setPublishing(true);

    // Create match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        match_date: new Date().toISOString().split('T')[0],
        status: 'published',
        num_teams: numTeams,
      })
      .select()
      .single();

    if (matchError || !match) {
      alert('Error al crear el partido');
      setPublishing(false);
      return;
    }

    // Create teams
    for (const team of result.teams) {
      const { data: matchTeam, error: teamError } = await supabase
        .from('match_teams')
        .insert({
          match_id: match.id,
          team_number: team.teamNumber,
          team_name: team.teamName,
          team_color: team.teamColor,
          total_points: team.totalPoints,
        })
        .select()
        .single();

      if (teamError || !matchTeam) continue;

      // Create team players
      const teamPlayers = team.players.map((p) => ({
        match_team_id: matchTeam.id,
        player_id: p.id,
      }));

      await supabase.from('match_team_players').insert(teamPlayers);
    }

    setPublishing(false);
    setPublished(true);
  };

  const handleTeamChange = (teamNum: number, field: 'teamName' | 'teamColor', value: string) => {
    if (!result) return;
    setResult({
      ...result,
      teams: result.teams.map(t => t.teamNumber === teamNum ? { ...t, [field]: value } : t)
    });
  };

  const handleMovePlayer = (playerId: string, fromTeamNum: number, toTeamNum: number) => {
    if (!result || fromTeamNum === toTeamNum) return;

    const fromTeam = result.teams.find(t => t.teamNumber === fromTeamNum);
    const toTeam = result.teams.find(t => t.teamNumber === toTeamNum);
    if (!fromTeam || !toTeam) return;

    const playerIndex = fromTeam.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;

    const player = fromTeam.players[playerIndex];

    const newTeams = result.teams.map(team => {
      if (team.teamNumber === fromTeamNum) {
        const newPlayers = [...team.players];
        newPlayers.splice(playerIndex, 1);
        return {
          ...team,
          players: newPlayers,
          totalPoints: newPlayers.reduce((sum, p) => sum + p.total_score, 0),
        };
      }
      if (team.teamNumber === toTeamNum) {
        const newPlayers = [...team.players, player];
        return {
          ...team,
          players: newPlayers,
          totalPoints: newPlayers.reduce((sum, p) => sum + p.total_score, 0),
        };
      }
      return team;
    });

    const totals = newTeams.map(t => t.totalPoints);
    const newMetrics = {
      ...result.metrics,
      standardDeviation: Math.round(calculateStdDev(totals) * 100) / 100,
      maxMinDifference: maxMinDiff(totals),
    };

    const finalTeams = newTeams.map(t => ({
      ...t,
      summary: generateTeamSummary(t.players, selectedPlayers)
    }));

    setResult({ teams: finalTeams, metrics: newMetrics });
  };

  const playersPerTeam = selected.size > 0
    ? `${Math.floor(selected.size / numTeams)}${selected.size % numTeams !== 0 ? ` (+${selected.size % numTeams} extra)` : ''}`
    : '0';

  return (
    <div className="animate-fade-in">
      <h1 className="mb-lg">⚡ Generador de Equipos</h1>

      {/* Step Indicator */}
      <div className="flex items-center gap-md mb-lg" style={{ flexWrap: 'wrap' }}>
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className="flex items-center gap-xs"
            style={{
              color: step >= s ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontWeight: step === s ? 700 : 400,
            }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-full)',
              background: step >= s ? 'var(--accent-primary)' : 'var(--bg-card)',
              color: step >= s ? 'white' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8125rem',
              fontWeight: 700,
            }}>
              {s}
            </div>
            <span className="text-sm">
              {s === 1 ? 'Seleccionar' : s === 2 ? 'Configurar' : 'Resultado'}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Select Players */}
      {step >= 1 && (
        <div className="card mb-lg" id="step-1-select">
          <div className="flex items-center justify-between mb-md">
            <h3 style={{ fontSize: '1rem' }}>Seleccionar Convocados</h3>
            <div className="flex gap-xs">
              <button className="btn btn-ghost btn-sm" onClick={selectAll}>
                Todos
              </button>
              <button className="btn btn-ghost btn-sm" onClick={deselectAll}>
                Ninguno
              </button>
            </div>
          </div>

          <div className="search-bar mb-md">
            <Search size={18} className="search-bar-icon" />
            <input
              type="text"
              className="input"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="text-sm text-muted mb-md">
            {selected.size} de {players.length} jugadores seleccionados
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 'var(--space-sm)',
            maxHeight: '400px',
            overflowY: 'auto',
          }}>
            {filteredPlayers.map((player) => {
              const isSelected = selected.has(player.id);
              return (
                <label
                  key={player.id}
                  className="checkbox-wrapper"
                  style={{
                    padding: 'var(--space-sm)',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                    border: `1px solid ${isSelected ? 'rgba(59, 130, 246, 0.3)' : 'transparent'}`,
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={isSelected}
                    onChange={() => togglePlayer(player.id)}
                  />
                  <PlayerAvatar
                    name={player.name}
                    photoUrl={getPlayerPhotoUrl(player.photo_url)}
                    size="sm"
                  />
                  <div className="flex-1" style={{ minWidth: 0 }}>
                    <div className="text-sm font-semibold truncate">{player.name}</div>
                    <div className="text-xs text-muted">{player.total_score} pts</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: Configure */}
      {step >= 1 && selected.size >= 2 && (
        <div className="card mb-lg" id="step-2-configure">
          <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}>Configurar Equipos</h3>

          <div className="flex gap-md mb-md" style={{ flexWrap: 'wrap' }}>
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                className={`btn ${numTeams === n ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setNumTeams(n); setResult(null); setStep(1); }}
                id={`teams-option-${n}`}
              >
                {n} Equipos
              </button>
            ))}
          </div>

          <div className="text-sm text-muted mb-md">
            {selected.size} jugadores → {numTeams} equipos de ~{playersPerTeam} jugadores
          </div>

          <button
            className="btn btn-success btn-lg"
            onClick={() => { setStep(2); handleGenerate(); }}
            disabled={selected.size < numTeams}
            id="generate-teams-btn"
          >
            <Zap size={20} /> Generar Equipos
          </button>
        </div>
      )}

      {/* Step 3: Result */}
      {step === 3 && result && (
        <div className="animate-slide-up" id="step-3-result">
          {/* Balance Indicator */}
          <div className="card mb-md">
            <div className="flex items-center justify-between mb-sm">
              <span className="text-sm font-semibold">Balance</span>
              <span className={`badge badge-${getBalanceQuality(result.metrics.standardDeviation) === 'excellent' ? 'success' : getBalanceQuality(result.metrics.standardDeviation) === 'good' ? 'warning' : 'danger'}`}>
                {getBalanceLabel(getBalanceQuality(result.metrics.standardDeviation))}
              </span>
            </div>
            <div className="balance-indicator">
              <div className="balance-bar-track">
                <div
                  className={`balance-bar-fill ${getBalanceQuality(result.metrics.standardDeviation)}`}
                  style={{ width: `${Math.max(5, 100 - result.metrics.standardDeviation * 10)}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between mt-sm text-xs text-muted">
              <span>Desviación: {result.metrics.standardDeviation}</span>
              <span>Δ máx-mín: {result.metrics.maxMinDifference} pts</span>
            </div>
          </div>

          {/* Teams */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${result.teams.length}, 1fr)`,
            gap: 'var(--space-md)',
          }} className="mb-lg">
            {result.teams.map((team) => (
              <div
                key={team.teamNumber}
                className="card"
                style={{ borderTop: `3px solid ${team.teamColor}` }}
              >
                <div className="flex items-center justify-between mb-md gap-sm">
                  <input
                    type="text"
                    className="input font-bold"
                    style={{ 
                      color: team.teamColor, 
                      padding: '4px 8px', 
                      background: 'var(--bg-surface)', 
                      border: '1px solid var(--glass-border)',
                      flex: 1
                    }}
                    value={team.teamName}
                    onChange={(e) => handleTeamChange(team.teamNumber, 'teamName', e.target.value)}
                  />
                  <div className="flex items-center gap-sm">
                    <input
                      type="color"
                      value={team.teamColor}
                      onChange={(e) => handleTeamChange(team.teamNumber, 'teamColor', e.target.value)}
                      style={{ cursor: 'pointer', width: '32px', height: '32px', padding: '0', border: 'none', borderRadius: '4px', background: 'transparent' }}
                      title="Cambiar color del equipo"
                    />
                    <span className="badge badge-default font-bold">
                      {team.totalPoints} pts
                    </span>
                  </div>
                </div>
                {team.summary && (
                  <div className="text-xs text-muted mb-sm" style={{ padding: '0 4px', fontStyle: 'italic' }}>
                    {team.summary}
                  </div>
                )}
                <div className="flex flex-col gap-sm">
                  {team.players.map((player) => (
                    <div key={player.id} className="flex items-center gap-sm">
                      <PlayerAvatar
                        name={player.name}
                        photoUrl={getPlayerPhotoUrl(player.photo_url)}
                        size="sm"
                      />
                      <div className="flex-1" style={{ minWidth: 0 }}>
                        <div className="text-sm truncate">{player.name}</div>
                        <div className="text-xs text-muted">{player.total_score} pts</div>
                      </div>
                      <select 
                        className="input text-xs" 
                        style={{ padding: '2px 4px', width: 'auto', minWidth: '60px', background: 'transparent', border: '1px solid var(--glass-border)' }}
                        value={team.teamNumber}
                        onChange={(e) => handleMovePlayer(player.id, team.teamNumber, parseInt(e.target.value))}
                        title="Mover a..."
                      >
                        {result.teams.map(t => (
                          <option key={t.teamNumber} value={t.teamNumber}>Eq {t.teamNumber}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={handleRegenerate} id="regenerate-btn">
              <RotateCw size={18} /> Re-generar
            </button>
            {!published ? (
              <button
                className="btn btn-primary btn-lg"
                onClick={handlePublish}
                disabled={publishing}
                id="publish-btn"
              >
                <Upload size={18} />
                {publishing ? 'Publicando...' : 'Publicar Convocatoria'}
              </button>
            ) : (
              <div className="flex items-center gap-sm" style={{ color: 'var(--accent-secondary)' }}>
                <Check size={20} />
                <span className="font-semibold">¡Convocatoria publicada!</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
