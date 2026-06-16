import type { Player } from '@/types';
import { FutPlayerImage } from './FutPlayerImage';
import { StatRadar } from './StatRadar';
import { getPlayerPhotoUrl } from '@/lib/utils';

interface FutCardProps {
  player: Player;
  isMvp: boolean;
  id?: string;
  className?: string;
}

export function FutCard({ player, isMvp, id = 'fut-card-container', className = '' }: FutCardProps) {
  const bgImage = isMvp ? '/mvp.png' : '/default.png';

  return (
    <div
      id={id}
      className={`fut-card-wrapper relative ${isMvp ? 'is-mvp-wrapper' : ''} ${className}`}
      style={{
        width: '100%',
        maxWidth: '384px',
        aspectRatio: '2/3',
        height: 'auto',
        margin: '0 auto',
        position: 'relative',
      }}
    >
      <div
        className={`fut-card relative ${isMvp ? 'is-mvp' : ''}`}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          overflow: 'hidden',
          borderRadius: '24px',
          WebkitMaskImage: `url('${bgImage}')`,
          WebkitMaskSize: 'cover',
          WebkitMaskPosition: 'center',
          maskImage: `url('${bgImage}')`,
          maskSize: 'cover',
          maskPosition: 'center',
        }}
      >
        <img
        src={bgImage}
        alt={isMvp ? 'MVP Card Background' : 'Card Background'}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 0,
          objectFit: 'cover',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top left section */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: '15%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2%',
            zIndex: 2,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(2.5rem, 12vw, 3.2rem)',
              fontWeight: 900,
              lineHeight: 1,
              color: '#000',
              textShadow:
                '-2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff, 2px 2px 0 #fff',
            }}
          >
            {player.total_score}
          </div>
          {player.country && (
            <img
              src={`https://flagcdn.com/w40/${player.country.toLowerCase()}.png`}
              alt={player.country}
              style={{
                width: 'clamp(30px, 10vw, 40px)',
                height: 'auto',
                border: '1px solid rgba(0,0,0,0.2)',
                borderRadius: '2px',
                marginTop: '20px',
              }}
            />
          )}
          <img
            src="/escudo.png"
            alt="Team Logo"
            style={{ width: 'clamp(32px, 12vw, 44px)', marginTop: '20px' }}
          />
        </div>

        {/* Player Image */}
        <div
          style={{
            position: 'absolute',
            top: '12%',
            left: '16%',
            width: '68%',
            aspectRatio: '1/1',
            zIndex: 1,
          }}
        >
          <FutPlayerImage
            playerName={player.name}
            defaultPhotoUrl={getPlayerPhotoUrl(player.photo_url) || undefined}
          />
        </div>

        {/* Player Name */}
        <div
          style={{
            position: 'absolute',
            top: '58%',
            left: 0,
            width: '100%',
            textAlign: 'center',
            zIndex: 2,
          }}
        >
          <h1
            style={{
              fontSize: 'clamp(1.2rem, 7vw, 1.8rem)',
              fontWeight: 900,
              color: '#000',
              textTransform: 'uppercase',
              margin: 0,
              letterSpacing: '1px',
              paddingBottom: '2%',
              width: '80%',
              marginInline: 'auto',
            }}
          >
            {player.name}
          </h1>
        </div>

        {/* Stats Radar */}
        <div
          style={{
            position: 'absolute',
            top: '62.5%',
            left: '0',
            width: '100%',
            height: '30%',
            display: 'flex',
            justifyContent: 'center',
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: '60%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
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
    </div>
  );
}
