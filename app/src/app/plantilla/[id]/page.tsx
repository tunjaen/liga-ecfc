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
    description: `Ficha de ${player.name} - DEF: ${player.defense}, ATK: ${player.attack}, FIT: ${player.fitness}, TEC: ${player.technique}, IQ: ${player.iq}`,
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

        {/* Player Header - FUT Card Style */}
        <div
          className="fut-card relative mb-xl animate-fade-in"
          style={{
            width: '320px',
            height: '480px',
            margin: '0 auto',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '24px' /* Ajustado al borde de la imagen default */
          }}
        >
          <img
            src="/default.png"
            alt="Card Background"
            style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0, objectFit: 'cover' }}
          />

          <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>

            {/* Top left section */}
            <div style={{ position: 'absolute', top: '15%', left: '15%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', zIndex: 2 }}>
              <div style={{
                fontSize: '2.8rem',
                fontWeight: 900,
                lineHeight: 1,
                color: '#000',
                WebkitTextStroke: '2px white'
              }}>
                {player.total_score}
              </div>
              {player.country && (
                <img
                  src={`https://flagcdn.com/w40/${player.country.toLowerCase()}.png`}
                  alt={player.country}
                  style={{ width: '36px', height: 'auto', border: '1px solid rgba(0,0,0,0.2)', borderRadius: '2px' }}
                />
              )}
              <img src="/escudo.png" alt="Team Logo" style={{ width: '40px', marginTop: '6px' }} />
            </div>

            {/* Player Image */}
            <div style={{ position: 'absolute', top: '10%', left: '15%', width: '228px', height: '228px', zIndex: 1 }}>
              {player.photo_url ? (
                <img
                  src={getPlayerPhotoUrl(player.photo_url) || undefined}
                  alt={player.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', borderBottom: '2px solid transparent' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: '4rem', color: '#000', opacity: 0.2, fontWeight: 900 }}>{player.name.charAt(0)}</div>
                </div>
              )}
            </div>

            {/* Player Name */}
            <div style={{ position: 'absolute', top: '58%', left: 0, width: '100%', textAlign: 'center', zIndex: 2 }}>
              <h1 style={{
                fontSize: '1.5rem',
                fontWeight: 900,
                color: '#000',
                textTransform: 'uppercase',
                margin: 0,
                letterSpacing: '1px',

                paddingBottom: '4px',
                width: '80%',
                marginInline: 'auto'
              }}>
                {player.name}
              </h1>
            </div>

            {/* Stats Radar */}
            <div style={{ position: 'absolute', top: '65%', left: 0, width: '100%', display: 'flex', justifyContent: 'center', zIndex: 2 }}>
              <StatRadar
                defense={player.defense}
                attack={player.attack}
                fitness={player.fitness}
                technique={player.technique}
                iq={player.iq}
                size={120}
              />
            </div>

          </div>
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
