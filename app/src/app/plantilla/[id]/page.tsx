import { getPlayer, getPlayerStats, getCurrentMvpId } from '@/lib/stats';
import { FutCard } from '@/components/players/FutCard';
import { DownloadFutCardBtn } from '@/components/players/DownloadFutCardBtn';
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
    description: `Ficha de ${player.name} - DEF: ${player.defense}, ATK: ${player.attack}, FIT: ${player.fitness}, TEC: ${player.technique}, IQ: ${player.iq}`,
  };
}

export default async function PlayerDetailPage({ params }: Props) {
  const { id } = await params;
  const player = await getPlayer(id);
  if (!player) notFound();

  const { stats } = await getPlayerStats(id).catch(() => ({ stats: null }));
  const currentMvpId = await getCurrentMvpId();
  const isMvp = player.id === currentMvpId;

  return (
    <div className="page-content">
      <div className="container" style={{ maxWidth: '700px' }}>
        {/* Back link */}
        <Link href="/plantilla" className="flex items-center gap-xs text-muted text-sm mb-lg" style={{ textDecoration: 'none' }}>
          ← Volver a la plantilla
        </Link>

        {/* Player Header - FUT Card Style */}
        <FutCard player={player} isMvp={isMvp} id="fut-card-container" className="animate-fade-in" />


        {/* Stats Bar Chart */}
        <div className="card mb-xl animate-slide-up" style={{ padding: 'var(--space-md)', maxWidth: '384px', margin: '0 auto' }}>
          <div className="flex flex-col gap-sm">
            {[
              { label: 'DEF', value: player.defense, color: 'var(--accent-primary)' },
              { label: 'ATK', value: player.attack, color: 'var(--accent-danger)' },
              { label: 'FIT', value: player.fitness, color: 'var(--accent-secondary)' },
              { label: 'TEC', value: player.technique, color: '#f59e0b' },
              { label: 'IQ', value: player.iq, color: '#a78bfa' },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-sm">
                <span style={{ width: '40px', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)' }}>{stat.label}</span>
                <div style={{ flex: 1, height: '8px', background: 'var(--bg-surface)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${(stat.value / 10) * 100}%`,
                      height: '100%',
                      background: stat.color,
                      borderRadius: '4px'
                    }}
                  />
                </div>
                <span style={{ width: '20px', textAlign: 'right', fontWeight: 800, fontSize: '0.9rem' }}>{stat.value}</span>
              </div>
            ))}
          </div>
          
          <DownloadFutCardBtn targetId="fut-card-container" playerName={player.name} />
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
