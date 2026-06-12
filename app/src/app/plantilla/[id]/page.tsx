import { getPlayer, getPlayerStats } from '@/lib/stats';
import { PlayerAvatar } from '@/components/players/PlayerAvatar';
import { StatRadar } from '@/components/players/StatRadar';
import { getPlayerPhotoUrl, formatDate } from '@/lib/utils';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const player = await getPlayer(id);
  if (!player) return { title: 'Jugador no encontrado' };
  return {
    title: `${player.name} | Equipos Balanceados ⚽`,
    description: `Ficha de ${player.name} - DEF: ${player.defense}, ATK: ${player.attack}, FIT: ${player.fitness}`,
  };
}

export default async function PlayerDetailPage({ params }: Props) {
  const { id } = await params;
  const player = await getPlayer(id);
  if (!player) notFound();

  const { stats } = await getPlayerStats(id).catch(() => ({ stats: null }));

  return (
    <div className="page-content">
      <div className="container" style={{ maxWidth: '700px' }}>
        {/* Back link */}
        <Link href="/plantilla" className="flex items-center gap-xs text-muted text-sm mb-lg" style={{ textDecoration: 'none' }}>
          ← Volver a la plantilla
        </Link>

        {/* Player Header */}
        <div className="card animate-fade-in" id="player-detail-card">
          <div className="flex flex-col items-center text-center mb-lg" style={{ gap: 'var(--space-md)' }}>
            <PlayerAvatar
              name={player.name}
              photoUrl={getPlayerPhotoUrl(player.photo_url)}
              size="xl"
            />
            <div>
              <h1 style={{ fontSize: '1.75rem', marginBottom: 'var(--space-xs)' }}>
                {player.name}
              </h1>
              <span className="badge badge-primary" style={{ fontSize: '0.875rem', padding: '0.375rem 1rem' }}>
                Puntuación: {player.total_score}
              </span>
            </div>
          </div>

          {/* Radar Chart */}
          <StatRadar
            defense={player.defense}
            attack={player.attack}
            fitness={player.fitness}
            size={220}
          />
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid-2 mt-lg animate-slide-up" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
                📊
              </div>
              <div>
                <div className="stat-card-value">{stats.matches_played}</div>
                <div className="stat-card-label">Partidos</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                🏆
              </div>
              <div>
                <div className="stat-card-value" style={{ color: 'var(--accent-secondary)' }}>
                  {stats.wins}
                </div>
                <div className="stat-card-label">Victorias ({stats.winrate}%)</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: 'rgba(34, 211, 238, 0.15)' }}>
                ⚽
              </div>
              <div>
                <div className="stat-card-value" style={{ color: 'var(--accent-goal)' }}>
                  {stats.total_goals}
                </div>
                <div className="stat-card-label">Goles</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: 'rgba(167, 139, 250, 0.15)' }}>
                👟
              </div>
              <div>
                <div className="stat-card-value" style={{ color: 'var(--accent-assist)' }}>
                  {stats.total_assists}
                </div>
                <div className="stat-card-label">Asistencias</div>
              </div>
            </div>

            {stats.mvp_awards > 0 && (
              <div className="stat-card" style={{ gridColumn: 'span 2' }}>
                <div className="stat-card-icon" style={{ background: 'rgba(251, 191, 36, 0.15)' }}>
                  ⭐
                </div>
                <div>
                  <div className="stat-card-value" style={{ color: 'var(--accent-gold)' }}>
                    {stats.mvp_awards}
                  </div>
                  <div className="stat-card-label">Premios MVP</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
