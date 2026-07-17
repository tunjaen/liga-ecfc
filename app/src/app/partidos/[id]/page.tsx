import { getMatchDetail } from '@/lib/stats';
import { PlayerAvatar } from '@/components/players/PlayerAvatar';
import { getPlayerPhotoUrl, formatDate } from '@/lib/utils';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const match = await getMatchDetail(id);
  if (!match) return { title: 'Partido no encontrado' };
  const teamNames = match.teams.map((t) => t.team_name).join(' vs ');
  return {
    title: `${teamNames} | Equipos Balanceados ⚽`,
    description: `Detalle del partido del ${formatDate(match.match_date)}`,
  };
}

export default async function MatchDetailPage({ params }: Props) {
  const { id } = await params;
  const match = await getMatchDetail(id);
  if (!match) notFound();

  const goalEvents = match.events.filter((e) => e.event_type === 'goal');
  const assistEvents = match.events.filter((e) => e.event_type === 'assist');

  return (
    <div className="page-content">
      <div className="container" style={{ maxWidth: '800px' }}>
        {/* Back link */}
        <Link href="/partidos" className="flex items-center gap-xs text-muted text-sm mb-lg">
          ← Volver al historial
        </Link>

        {/* Score Card */}
        <div className="card animate-fade-in mb-lg" id="match-score-card">
          <div className="text-center text-sm text-muted mb-md">
            {formatDate(match.match_date)}
          </div>

          <div className="score-display" style={{ padding: 'var(--space-lg) 0' }}>
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
                    }}
                  >
                    {team.goals_scored}
                  </span>
                  {team.is_winner && <span className="badge badge-success">Victoria</span>}
                </div>
              </div>
            ))}
          </div>

          {/* MVP */}
          {match.mvp_player && (
            <div className="flex items-center justify-center gap-sm mt-md" style={{
              padding: 'var(--space-sm) var(--space-md)',
              background: 'rgba(251, 191, 36, 0.08)',
              borderRadius: 'var(--radius-md)',
            }}>
              <span className="badge badge-mvp">⭐ MVP</span>
              <PlayerAvatar
                name={match.mvp_player.name}
                photoUrl={getPlayerPhotoUrl(match.mvp_player.photo_url)}
                size="sm"
              />
              <Link href={`/plantilla/${match.mvp_player.id}`} className="font-semibold text-sm">
                {match.mvp_player.name}
              </Link>
            </div>
          )}
        </div>

        {/* Teams & Lineups */}
        <div className="grid-2 mb-lg" style={{ gridTemplateColumns: `repeat(${match.teams.length}, 1fr)` }}>
          {match.teams.map((team) => (
            <div key={team.id} className="card animate-slide-up" style={{ borderTop: `3px solid ${team.team_color}` }}>
              <h3 style={{ fontSize: '1rem', color: team.team_color, marginBottom: 'var(--space-sm)' }}>
                {team.team_name}
              </h3>
              <div className="text-xs text-muted mb-md">
                Balance: {team.total_points} pts
              </div>
              <div className="flex flex-col gap-sm">
                {team.players.map((player) => {
                  const playerGoals = goalEvents.filter((e) => e.player_id === player.id).length;
                  const playerAssists = assistEvents.filter((e) => e.player_id === player.id).length;

                  return (
                    <Link key={player.id} href={`/plantilla/${player.id}`}>
                      <div className="flex items-center gap-sm">
                        <PlayerAvatar
                          name={player.name}
                          photoUrl={getPlayerPhotoUrl(player.photo_url)}
                          size="sm"
                        />
                        <span className="text-sm flex-1 truncate">{player.name}</span>
                        {playerGoals > 0 && (
                          <span className="badge badge-goal">⚽ {playerGoals}</span>
                        )}
                        {playerAssists > 0 && (
                          <span className="badge badge-assist">👟 {playerAssists}</span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Goal Timeline */}
        {goalEvents.length > 0 && (() => {
          // Sort events by created_at to pair goals with their assists by insertion order
          const sortedGoals = [...goalEvents].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          const sortedAssists = [...assistEvents].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

          // Build a map: for each goal, find the assist inserted right after it
          const goalAssistMap = new Map<string, typeof assistEvents[0]>();
          const usedAssists = new Set<string>();

          for (const goal of sortedGoals) {
            // Find the first unused assist from the same team that was created right after this goal
            const matchingAssist = sortedAssists.find(
              (a) =>
                !usedAssists.has(a.id) &&
                a.match_team_id === goal.match_team_id &&
                a.player_id !== goal.player_id &&
                new Date(a.created_at).getTime() >= new Date(goal.created_at).getTime()
            );
            if (matchingAssist) {
              goalAssistMap.set(goal.id, matchingAssist);
              usedAssists.add(matchingAssist.id);
            }
          }

          return (
            <div className="card animate-slide-up">
              <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}>⚽ Goles del partido</h3>
              <div className="timeline">
                {sortedGoals.map((event) => {
                  const assist = goalAssistMap.get(event.id);
                  const team = match.teams.find((t) => t.id === event.match_team_id);

                  return (
                    <div key={event.id} className="timeline-item">
                      <div className="timeline-icon goal" style={{ borderLeft: `3px solid ${team?.team_color || 'var(--accent-goal)'}` }}>
                        ⚽
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-player">{event.player.name}</div>
                        <div className="timeline-detail">
                          {event.minute && <span>{event.minute}&apos; · </span>}
                          <span style={{ color: team?.team_color }}>{team?.team_name}</span>
                          {assist && (
                            <span> · Asist: {assist.player.name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
