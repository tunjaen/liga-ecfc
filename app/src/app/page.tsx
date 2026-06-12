import { getCurrentMatch, getLastResult } from '@/lib/stats';
import { PlayerAvatar } from '@/components/players/PlayerAvatar';
import { getPlayerPhotoUrl, formatDate } from '@/lib/utils';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Equipos Balanceados ⚽ | Inicio',
  description: 'Consulta la convocatoria actual, últimos resultados y el MVP del partido.',
};

export const revalidate = 60;

export default async function HomePage() {
  const [currentMatch, lastResult] = await Promise.all([
    getCurrentMatch().catch(() => null),
    getLastResult().catch(() => null),
  ]);

  return (
    <div className="page-content">
      <div className="container">
        {/* Hero */}
        <section 
          className="hero" 
          id="hero-section"
          style={{
            position: 'relative',
            backgroundImage: 'url("/fondo-cabecera.avif")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            overflow: 'hidden'
          }}
        >
          {/* Capa oscura para asegurar que el texto sea legible sobre el fondo */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            zIndex: 0
          }} />
          
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1 className="hero-title" style={{ color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
              ECFC
            </h1>
            <p className="hero-subtitle" style={{ color: 'rgba(255, 255, 255, 0.9)', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
              La escusa para ir al Blue Moon
            </p>
            <img 
              src="/escudo.png" 
              alt="Escudo ECFC" 
              style={{ 
                width: '120px', 
                height: 'auto', 
                marginTop: 'var(--space-md)',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))'
              }} 
            />
          </div>
        </section>

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
          {lastResult ? (
            <Link href={`/partidos/${lastResult.id}`}>
              <div className="card card-interactive">
                <div className="text-sm text-muted mb-md">
                  {formatDate(lastResult.match_date)}
                </div>
                <div className="score-display">
                  {lastResult.teams.map((team, i) => (
                    <div key={team.id} className="flex items-center gap-md" style={{ flex: 1 }}>
                      {i > 0 && <span className="score-vs">VS</span>}
                      <div className="score-team">
                        <span
                          className="score-team-name"
                          style={{ color: team.team_color }}
                        >
                          {team.team_name}
                        </span>
                        <span className="score-number" style={{
                          color: team.is_winner ? 'var(--accent-secondary)' : 'var(--text-primary)',
                        }}>
                          {team.goals_scored}
                        </span>
                        {team.is_winner && (
                          <span className="badge badge-success">Victoria</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* MVP */}
                {lastResult.mvp_player && (
                  <div className="flex items-center gap-sm mt-lg" style={{
                    padding: 'var(--space-sm) var(--space-md)',
                    background: 'rgba(251, 191, 36, 0.08)',
                    borderRadius: 'var(--radius-md)',
                  }}>
                    <span className="badge badge-mvp">⭐ MVP</span>
                    <PlayerAvatar
                      name={lastResult.mvp_player.name}
                      photoUrl={getPlayerPhotoUrl(lastResult.mvp_player.photo_url)}
                      size="sm"
                    />
                    <span className="font-semibold text-sm">
                      {lastResult.mvp_player.name}
                    </span>
                  </div>
                )}
              </div>
            </Link>
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
