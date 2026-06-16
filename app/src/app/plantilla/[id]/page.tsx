import { getPlayer, getPlayerStats, getCurrentMvpId } from '@/lib/stats';
import { PlayerAvatar } from '@/components/players/PlayerAvatar';
import { StatRadar } from '@/components/players/StatRadar';
import { FutPlayerImage } from '@/components/players/FutPlayerImage';
import { getPlayerPhotoUrl, formatDate } from '@/lib/utils';
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
  const bgImage = isMvp ? '/mvp.png' : '/default.png';

  return (
    <div className="page-content">
      <div className="container" style={{ maxWidth: '700px' }}>
        {/* Back link */}
        <Link href="/plantilla" className="flex items-center gap-xs text-muted text-sm mb-lg" style={{ textDecoration: 'none' }}>
          ← Volver a la plantilla
        </Link>

        {/* Player Header - FUT Card Style */}
        <div
          id="fut-card-container"
          className="fut-card relative mb-xl animate-fade-in"
          style={{
            width: '100%',
            maxWidth: '384px',
            aspectRatio: '2/3',
            height: 'auto',
            margin: '0 auto',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '24px'
          }}
        >
          <img 
            src={bgImage} 
            alt={isMvp ? "MVP Card Background" : "Card Background"} 
            style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0, objectFit: 'cover' }} 
          />
          
          <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>

            {/* Top left section */}
            <div style={{ position: 'absolute', top: '15%', left: '15%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2%', zIndex: 2 }}>
              <div style={{
                fontSize: 'clamp(2.5rem, 12vw, 3.2rem)',
                fontWeight: 900,
                lineHeight: 1,
                color: '#000',
                textShadow: '-2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff, 2px 2px 0 #fff'
              }}>
                {player.total_score}
              </div>
              {player.country && (
                <img
                  src={`https://flagcdn.com/w40/${player.country.toLowerCase()}.png`}
                  alt={player.country}
                  style={{ width: 'clamp(30px, 10vw, 40px)', height: 'auto', border: '1px solid rgba(0,0,0,0.2)', borderRadius: '2px', marginTop: '20px' }}
                />
              )}
              <img src="/escudo.png" alt="Team Logo" style={{ width: 'clamp(32px, 12vw, 44px)', marginTop: '20px' }} />
            </div>

            {/* Player Image */}
            <div style={{ position: 'absolute', top: '12%', left: '16%', width: '68%', aspectRatio: '1/1', zIndex: 1 }}>
              <FutPlayerImage 
                playerName={player.name} 
                defaultPhotoUrl={getPlayerPhotoUrl(player.photo_url) || undefined} 
              />
            </div>

            {/* Player Name */}
            <div style={{ position: 'absolute', top: '58%', left: 0, width: '100%', textAlign: 'center', zIndex: 2 }}>
              <h1 style={{
                fontSize: 'clamp(1.2rem, 7vw, 1.8rem)',
                fontWeight: 900,
                color: '#000',
                textTransform: 'uppercase',
                margin: 0,
                letterSpacing: '1px',
                paddingBottom: '2%',
                width: '80%',
                marginInline: 'auto'
              }}>
                {player.name}
              </h1>
            </div>

            {/* Stats Radar */}
            <div style={{ position: 'absolute', top: '62.5%', left: '0', width: '100%', height: '30%', display: 'flex', justifyContent: 'center', zIndex: 2 }}>
              <div style={{ width: '60%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <StatRadar
                  defense={player.defense}
                  attack={player.attack}
                  fitness={player.fitness}
                  technique={player.technique}
                  iq={player.iq}
                  size={200}
                />
              </div>
            </div>

          </div>
        </div>

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
