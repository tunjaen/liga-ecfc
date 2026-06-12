import { getMatches } from '@/lib/stats';
import { formatDate } from '@/lib/utils';
import { PlayerAvatar } from '@/components/players/PlayerAvatar';
import { getPlayerPhotoUrl } from '@/lib/utils';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Partidos | Equipos Balanceados ⚽',
  description: 'Historial completo de partidos con resultados, goles y MVPs.',
};

export const revalidate = 60;

export default async function PartidosPage() {
  const matches = await getMatches('completed').catch(() => []);

  return (
    <div className="page-content">
      <div className="container">
        <h1 className="mb-lg">📅 Historial de Partidos</h1>

        {matches.length > 0 ? (
          <div className="flex flex-col gap-md">
            {matches.map((match, index) => (
              <Link key={match.id} href={`/partidos/${match.id}`}>
                <div
                  className="card card-interactive stagger-item"
                  style={{ animationDelay: `${index * 50}ms` }}
                  id={`match-card-${match.id}`}
                >
                  <div className="flex items-center justify-between mb-md">
                    <span className="text-sm text-muted">
                      {formatDate(match.match_date)}
                    </span>
                    {match.mvp_player && (
                      <span className="badge badge-mvp">⭐ MVP: {match.mvp_player.name}</span>
                    )}
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

                  {/* Player avatars */}
                  <div className="flex justify-between mt-md" style={{ gap: 'var(--space-lg)' }}>
                    {match.teams.map((team) => (
                      <div key={team.id} className="flex" style={{ gap: '-8px', flexWrap: 'wrap', justifyContent: 'center', flex: 1 }}>
                        {team.players.slice(0, 6).map((player) => (
                          <PlayerAvatar
                            key={player.id}
                            name={player.name}
                            photoUrl={getPlayerPhotoUrl(player.photo_url)}
                            size="sm"
                          />
                        ))}
                        {team.players.length > 6 && (
                          <span className="text-xs text-muted" style={{ alignSelf: 'center' }}>
                            +{team.players.length - 6}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <div className="empty-state-title">Sin partidos registrados</div>
              <div className="empty-state-text">
                El historial de partidos aparecerá aquí una vez se registren resultados.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
