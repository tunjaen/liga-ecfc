import { getCurrentMatch, getMatches } from '@/lib/stats';
import { getAppSettings } from '@/lib/settings';
import { PlayerAvatar } from '@/components/players/PlayerAvatar';
import { getPlayerPhotoUrl, formatDate } from '@/lib/utils';
import Link from 'next/link';
import type { Metadata } from 'next';
import { MatchHistoryList } from '@/components/matches/MatchHistoryList';
import { HeroSection } from '@/components/layout/HeroSection';

export const metadata: Metadata = {
  title: 'Equipos Balanceados ⚽ | Inicio',
  description: 'Consulta la convocatoria actual, últimos resultados y el MVP del partido.',
};

export const revalidate = 60;

export default async function HomePage() {
  const [currentMatch, allCompletedMatches, appSettings] = await Promise.all([
    getCurrentMatch().catch(() => null),
    getMatches('completed').catch(() => []),
    getAppSettings(),
  ]);

  const lastMatches = allCompletedMatches.length > 0
    ? allCompletedMatches.filter(m => m.match_date === allCompletedMatches[0].match_date)
    : [];

  return (
    <div className="page-content">
      <div className="container">
        {/* Hero */}
        <HeroSection 
          title={appSettings.title} 
          subtitle={appSettings.subtitle} 
          heroImages={appSettings.hero_images} 
        />

        {/* Current Match */}
        <section className="section" id="current-match-section">
          <h2 className="section-title">📋 Convocatoria Actual</h2>
          {currentMatch ? (
            <div>
              <div className="flex items-center gap-sm mb-md">
                <span className="badge badge-success">Publicada</span>
                <span className="text-sm text-muted">
                  {formatDate(currentMatch.match_date)}
                </span>
              </div>
              <div className={`grid-${currentMatch.teams.length}`}>
                {currentMatch.teams.map((team) => (
                  <div
                    key={team.id}
                    className="card"
                    style={{ borderTop: `3px solid ${team.team_color}` }}
                    id={`team-card-${team.team_number}`}
                  >
                    <div className="flex items-center justify-between mb-md">
                      <h3 style={{ fontSize: '1rem', color: team.team_color }}>
                        {team.team_name}
                      </h3>
                      <span className="badge badge-default">
                        {team.total_points} pts
                      </span>
                    </div>
                    <div className="flex flex-col gap-sm">
                      {team.players.map((player) => (
                        <div key={player.id} className="flex items-center gap-sm">
                          <PlayerAvatar
                            name={player.name}
                            photoUrl={getPlayerPhotoUrl(player.photo_url)}
                            size="sm"
                          />
                          <span className="text-sm flex-1 truncate">
                            {player.name}
                          </span>
                          <span className="text-xs text-muted">
                            {player.total_score}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card text-center" style={{ padding: 'var(--space-md)' }}>
              <div className="text-sm font-semibold" style={{ marginBottom: '4px' }}>Sin convocatoria activa</div>
              <div className="text-xs text-muted">
                No hay equipos publicados para esta semana. El admin publicará la próxima convocatoria pronto.
              </div>
            </div>
          )}
        </section>

        {/* Last Result */}
        <section className="section" id="last-result-section">
          <h2 className="section-title">🏆 Último Resultado</h2>
          {lastMatches.length > 0 ? (
            <MatchHistoryList matches={lastMatches} />
          ) : (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">🏆</div>
                <div className="empty-state-title">Sin resultados aún</div>
                <div className="empty-state-text">
                  Los resultados aparecerán aquí una vez se registren partidos completados.
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Quick Links */}
        <section className="section">
          <div className="grid-3">
            <Link href="/plantilla">
              <div className="card card-interactive text-center" id="quick-link-plantilla">
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>👥</div>
                <div className="font-semibold">Plantilla</div>
                <div className="text-sm text-muted">Ver todos los jugadores</div>
              </div>
            </Link>
            <Link href="/partidos">
              <div className="card card-interactive text-center" id="quick-link-partidos">
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>📅</div>
                <div className="font-semibold">Partidos</div>
                <div className="text-sm text-muted">Historial completo</div>
              </div>
            </Link>
            <Link href="/clasificacion">
              <div className="card card-interactive text-center" id="quick-link-clasificacion">
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>🏅</div>
                <div className="font-semibold">Clasificación</div>
                <div className="text-sm text-muted">Rankings y goleadores</div>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
