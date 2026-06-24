'use client';

import { useState } from 'react';
import type { MatchDetail, MatchEventWithPlayer } from '@/types';
import { formatDate } from '@/lib/utils';
import { PlayerAvatar } from '@/components/players/PlayerAvatar';
import { getPlayerPhotoUrl } from '@/lib/utils';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react';

interface MatchHistoryListProps {
  matches: MatchDetail[];
}

interface TeamStanding {
  teamName: string;
  teamColor: string;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
}

export function MatchHistoryList({ matches }: MatchHistoryListProps) {
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const toggleGroup = (dateId: string) => {
    setExpandedGroups(prev =>
      prev.includes(dateId) ? prev.filter(d => d !== dateId) : [...prev, dateId]
    );
  };

  // Group matches
  // Matches with num_teams === 2 on the same date will be grouped if there's more than 1.
  const groups: { type: 'single' | 'rey', dateStr: string, matches: MatchDetail[] }[] = [];
  
  const matchesByDate = new Map<string, MatchDetail[]>();
  matches.forEach(m => {
    const d = m.match_date;
    if (!matchesByDate.has(d)) matchesByDate.set(d, []);
    matchesByDate.get(d)!.push(m);
  });

  matchesByDate.forEach((dateMatches, dateStr) => {
    const reyMatches = dateMatches.filter(m => m.num_teams === 2);
    const otherMatches = dateMatches.filter(m => {
      if (m.num_teams !== 2) {
        // Un partido con más de 2 equipos y 0 goles en total es el "esqueleto" del Matchmaker
        // y no debe mostrarse como un partido jugado (especialmente si ya importamos los mini-partidos).
        const totalGoals = m.teams.reduce((acc, t) => acc + (t.goals_scored || 0), 0);
        return totalGoals > 0;
      }
      return false;
    });

    if (reyMatches.length > 1) {
      groups.push({ type: 'rey', dateStr, matches: reyMatches });
    } else {
      // If only 1, treat as single
      reyMatches.forEach(m => groups.push({ type: 'single', dateStr, matches: [m] }));
    }
    
    otherMatches.forEach(m => groups.push({ type: 'single', dateStr, matches: [m] }));
  });

  // Sort groups by date descending
  groups.sort((a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime());

  const calculateStandings = (groupMatches: MatchDetail[]): TeamStanding[] => {
    const standingsMap = new Map<string, TeamStanding>();

    groupMatches.forEach(match => {
      if (match.teams.length !== 2) return;
      
      const t1 = match.teams[0];
      const t2 = match.teams[1];
      
      const t1Goals = t1.goals_scored || 0;
      const t2Goals = t2.goals_scored || 0;

      const initTeam = (name: string, color: string) => {
        // Standardize team names to group them correctly (e.g. "Equipo Amarillo" -> "Amarillo")
        const baseName = name.replace('Equipo ', '').trim();
        if (!standingsMap.has(baseName)) {
          standingsMap.set(baseName, {
            teamName: baseName,
            teamColor: color,
            points: 0, played: 0, wins: 0, draws: 0, losses: 0,
            goalsFor: 0, goalsAgainst: 0, goalDiff: 0
          });
        }
        return baseName;
      };

      const name1 = initTeam(t1.team_name, t1.team_color);
      const name2 = initTeam(t2.team_name, t2.team_color);

      const st1 = standingsMap.get(name1)!;
      const st2 = standingsMap.get(name2)!;

      st1.played++; st2.played++;
      st1.goalsFor += t1Goals; st2.goalsFor += t2Goals;
      st1.goalsAgainst += t2Goals; st2.goalsAgainst += t1Goals;

      if (t1Goals > t2Goals) {
        st1.wins++; st1.points += 3;
        st2.losses++;
      } else if (t1Goals < t2Goals) {
        st2.wins++; st2.points += 3;
        st1.losses++;
      } else {
        st1.draws++; st1.points += 1;
        st2.draws++; st2.points += 1;
      }
    });

    const standings = Array.from(standingsMap.values());
    standings.forEach(st => st.goalDiff = st.goalsFor - st.goalsAgainst);
    
    // Sort by points, then goal diff, then goals for
    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      return b.goalsFor - a.goalsFor;
    });

    return standings;
  };

  const getMatchGoalEvents = (match: MatchDetail): MatchEventWithPlayer[] => {
    return (match.events || []).filter(e => e.event_type === 'goal');
  };

  const getMatchAssistEvents = (match: MatchDetail): MatchEventWithPlayer[] => {
    return (match.events || []).filter(e => e.event_type === 'assist');
  };

  const renderSingleMatch = (match: MatchDetail, index: number) => {
    const winningTeam = match.teams.find(t => t.is_winner);
    const goalEvents = getMatchGoalEvents(match);
    const assistEvents = getMatchAssistEvents(match);

    return (
      <div
        key={match.id}
        className="card stagger-item"
        style={{ animationDelay: `${index * 50}ms`, marginBottom: 'var(--space-md)' }}
        id={`match-card-${match.id}`}
      >
        <Link href={`/partidos/${match.id}`}>
          <div className="card-interactive" style={{ padding: 0 }}>
            <div className="flex items-center justify-between mb-md">
              <span className="text-sm text-muted">
                {formatDate(match.match_date)}
              </span>
            </div>

            <div className="score-display">
              {match.teams.map((team, i) => (
                <div key={team.id} style={{ display: 'contents' }}>
                  {i > 0 && <span className="score-vs">VS</span>}
                  <div className="score-team">
                    <span className="score-team-name" style={{ color: team.team_color }}>
                      {team.team_name}
                    </span>
                    <span
                      className="score-number"
                      style={{
                        color: team.is_winner ? 'var(--accent-secondary)' : 'var(--text-primary)',
                        fontSize: '2rem',
                      }}
                    >
                      {team.goals_scored}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Winning team avatars */}
            {winningTeam && (
              <div className="winner-avatars-section mt-md">
                <div className="flex items-center justify-center gap-xs mb-sm">
                  <Trophy size={14} style={{ color: 'var(--accent-warning)' }} />
                  <span className="text-xs font-semibold" style={{ color: winningTeam.team_color }}>
                    {winningTeam.team_name}
                  </span>
                </div>
                <div className="flex justify-center" style={{ gap: '4px', flexWrap: 'wrap' }}>
                  {winningTeam.players.map((player) => (
                    <PlayerAvatar
                      key={player.id}
                      name={player.name}
                      photoUrl={getPlayerPhotoUrl(player.photo_url)}
                      size="sm"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Goal & assist summary */}
            {goalEvents.length > 0 && (
              <div className="match-events-summary mt-md">
                {goalEvents.map((event) => {
                  const assist = assistEvents.find(
                    (a) => a.match_id === event.match_id && a.minute === event.minute && a.match_team_id === event.match_team_id
                  );
                  const team = match.teams.find((t) => t.id === event.match_team_id);
                  return (
                    <div key={event.id} className="match-event-row">
                      <span className="match-event-icon">⚽</span>
                      <span className="match-event-name" style={{ color: team?.team_color }}>
                        {event.player.name}
                      </span>
                      {assist && (
                        <>
                          <span className="match-event-icon assist-icon">👟</span>
                          <span className="match-event-name text-muted">
                            {assist.player.name}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Link>

        {/* MVP Section (separate, clickable, links to player profile) */}
        {match.mvp_player && (
          <Link href={`/plantilla/${match.mvp_player.id}`}>
            <div className="mvp-highlight-card mt-md" id={`mvp-card-${match.id}`}>
              <div className="mvp-highlight-inner">
                <span className="mvp-star">⭐</span>
                <span className="mvp-label">MVP</span>
                <PlayerAvatar
                  name={match.mvp_player.name}
                  photoUrl={getPlayerPhotoUrl(match.mvp_player.photo_url)}
                  size="sm"
                />
                <span className="mvp-name">{match.mvp_player.name}</span>
                <ChevronDown size={14} className="mvp-arrow" />
              </div>
            </div>
          </Link>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-md">
      {groups.map((group, groupIndex) => {
        if (group.type === 'single') {
          return renderSingleMatch(group.matches[0], groupIndex);
        }

        // Rey de la pista
        const isExpanded = expandedGroups.includes(group.dateStr);
        const standings = calculateStandings(group.matches);
        // Find MVP for the day (from the last match typically, or just the first one that has it)
        const mvp = group.matches.map(m => m.mvp_player).find(p => p != null);

        return (
          <div 
            key={`rey-${group.dateStr}`} 
            className="card stagger-item mb-md"
            style={{ animationDelay: `${groupIndex * 50}ms`, padding: 0, overflow: 'hidden' }}
          >
            {/* Header (clickable) */}
            <div 
              className="p-md cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              onClick={() => toggleGroup(group.dateStr)}
              style={{ padding: 'var(--space-md)' }}
            >
              <div className="flex items-center justify-between mb-sm">
                <div className="flex items-center gap-sm">
                  <span className="badge" style={{ background: 'var(--accent-warning)', color: '#000', fontWeight: 'bold' }}>
                    👑 Rey de la Pista
                  </span>
                  <span className="text-sm text-muted">
                    {formatDate(group.dateStr)} • {group.matches.length} partidos
                  </span>
                </div>
                {isExpanded ? <ChevronUp size={20} className="text-muted" /> : <ChevronDown size={20} className="text-muted" />}
              </div>

              {/* Winning team avatars */}
              {standings.length > 0 && (() => {
                const winnerName = standings[0].teamName;
                const winnerColor = standings[0].teamColor;
                // Collect unique players from the winning team across all matches
                const winnerPlayersMap = new Map<string, typeof group.matches[0]['teams'][0]['players'][0]>();
                group.matches.forEach(m => {
                  m.teams.forEach(t => {
                    const baseName = t.team_name.replace('Equipo ', '').trim();
                    if (baseName === winnerName) {
                      t.players.forEach(p => {
                        if (!winnerPlayersMap.has(p.id)) winnerPlayersMap.set(p.id, p);
                      });
                    }
                  });
                });
                const winnerPlayers = Array.from(winnerPlayersMap.values());

                return winnerPlayers.length > 0 ? (
                  <div className="winner-avatars-section mb-md" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-xs mb-sm">
                      <span className="text-xs font-semibold" style={{ color: winnerColor }}>
                        {winnerName}
                      </span>
                      <Trophy size={14} style={{ color: 'var(--accent-warning)' }} />
                    </div>
                    <div className="flex justify-center" style={{ gap: '4px', flexWrap: 'wrap' }}>
                      {winnerPlayers.map((player) => (
                        <PlayerAvatar
                          key={player.id}
                          name={player.name}
                          photoUrl={getPlayerPhotoUrl(player.photo_url)}
                          size="sm"
                        />
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* MVP Section (separate, clickable, links to player profile) */}
              {mvp && (
                <Link href={`/plantilla/${mvp.id}`} onClick={(e) => e.stopPropagation()}>
                  <div className="mvp-highlight-card mb-md" id={`mvp-rey-${group.dateStr}`}>
                    <div className="mvp-highlight-inner">
                      <span className="mvp-star">⭐</span>
                      <span className="mvp-label">MVP de la sesión</span>
                      <PlayerAvatar
                        name={mvp.name}
                        photoUrl={getPlayerPhotoUrl(mvp.photo_url)}
                        size="sm"
                      />
                      <span className="mvp-name">{mvp.name}</span>
                      <ChevronDown size={14} className="mvp-arrow" />
                    </div>
                  </div>
                </Link>
              )}

              {/* Standings Table */}
              <div className="overflow-x-auto mt-sm">
                <table className="w-full text-sm text-left" style={{ minWidth: '300px' }}>
                  <thead>
                    <tr className="text-xs text-muted border-b border-[var(--border-color)]">
                      <th className="pb-xs text-left">Equipo</th>
                      <th className="pb-xs text-center">Pts</th>
                      <th className="pb-xs text-center">PJ</th>
                      <th className="pb-xs text-center">G</th>
                      <th className="pb-xs text-center">E</th>
                      <th className="pb-xs text-center">P</th>
                      <th className="pb-xs text-center">GF</th>
                      <th className="pb-xs text-center">GC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((st, i) => (
                      <tr key={st.teamName} className="border-b border-[var(--border-color)] last:border-0">
                        <td className="py-xs font-semibold flex items-center gap-xs">
                          <span style={{ color: st.teamColor }}>{st.teamName}</span>
                          {i === 0 && <Trophy size={14} style={{ color: 'var(--accent-warning)' }} />}
                        </td>
                        <td className="py-xs text-center font-bold">{st.points}</td>
                        <td className="py-xs text-center">{st.played}</td>
                        <td className="py-xs text-center text-success">{st.wins}</td>
                        <td className="py-xs text-center text-muted">{st.draws}</td>
                        <td className="py-xs text-center text-danger">{st.losses}</td>
                        <td className="py-xs text-center">{st.goalsFor}</td>
                        <td className="py-xs text-center">{st.goalsAgainst}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Expanded Matches */}
            {isExpanded && (
              <div className="p-md" style={{ background: 'var(--bg-body)', borderTop: '1px solid var(--border-color)', padding: 'var(--space-md)' }}>
                <h4 className="text-sm text-muted mb-sm uppercase tracking-wider font-semibold">Mini-partidos</h4>
                <div className="flex flex-col gap-sm">
                  {group.matches.map((match, i) => {
                    const goalEvents = getMatchGoalEvents(match);
                    const assistEvents = getMatchAssistEvents(match);

                    return (
                      <Link key={match.id} href={`/partidos/${match.id}`}>
                        <div className="card card-interactive" style={{ padding: 'var(--space-sm)' }}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted font-bold">#{group.matches.length - i}</span>
                            <div className="flex items-center gap-md">
                              <span className="font-semibold" style={{ color: match.teams[0].team_color }}>
                                {match.teams[0].team_name}
                              </span>
                              <span className="font-bold text-lg">
                                {match.teams[0].goals_scored} - {match.teams[1].goals_scored}
                              </span>
                              <span className="font-semibold" style={{ color: match.teams[1].team_color }}>
                                {match.teams[1].team_name}
                              </span>
                            </div>
                          </div>

                          {/* Goal & assist events for mini-match */}
                          {goalEvents.length > 0 && (
                            <div className="match-events-summary mt-sm">
                              {goalEvents.map((event) => {
                                const assist = assistEvents.find(
                                  (a) => a.match_id === event.match_id && a.minute === event.minute && a.match_team_id === event.match_team_id
                                );
                                const team = match.teams.find((t) => t.id === event.match_team_id);
                                return (
                                  <div key={event.id} className="match-event-row">
                                    <span className="match-event-icon">⚽</span>
                                    <span className="match-event-name" style={{ color: team?.team_color }}>
                                      {event.player.name}
                                    </span>
                                    {assist && (
                                      <>
                                        <span className="match-event-icon assist-icon">👟</span>
                                        <span className="match-event-name text-muted">
                                          {assist.player.name}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
