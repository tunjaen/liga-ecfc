import Link from 'next/link';
import type { Player } from '@/types';
import { PlayerAvatar } from './PlayerAvatar';
import { getPlayerPhotoUrl } from '@/lib/utils';

interface PlayerCardProps {
  player: Player;
  index?: number;
  onClick?: () => void;
  selected?: boolean;
}

export function PlayerCard({ player, index = 0, onClick, selected }: PlayerCardProps) {
  const content = (
    <div
      className={`card card-interactive stagger-item`}
      style={{ 
        animationDelay: `${index * 50}ms`,
        border: selected ? '2px solid var(--accent-primary)' : undefined,
        background: selected ? 'var(--bg-active)' : undefined,
        cursor: 'pointer'
      }}
      id={`player-card-${player.id}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-md mb-md">
        <PlayerAvatar
          name={player.name}
          photoUrl={getPlayerPhotoUrl(player.photo_url)}
        />
        <div className="flex-1" style={{ minWidth: 0 }}>
          <div className="font-semibold truncate">{player.name}</div>
          <div className="text-sm text-muted">
            Puntuación: {player.total_score}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-xs">
        <StatMiniBar label="DEF" value={player.defense} type="defense" />
        <StatMiniBar label="ATK" value={player.attack} type="attack" />
        <StatMiniBar label="FIT" value={player.fitness} type="fitness" />
      </div>
    </div>
  );

  if (onClick) {
    return content;
  }

  return (
    <Link href={`/plantilla/${player.id}`} style={{ textDecoration: 'none' }}>
      {content}
    </Link>
  );
}

function StatMiniBar({
  label,
  value,
  type,
}: {
  label: string;
  value: number;
  type: 'defense' | 'attack' | 'fitness';
}) {
  return (
    <div className="stat-bar-container">
      <span className="stat-bar-label">{label}</span>
      <div className="stat-bar-track">
        <div
          className={`stat-bar-fill ${type}`}
          style={{ width: `${value * 10}%` }}
        />
      </div>
      <span className="stat-bar-value">{value}</span>
    </div>
  );
}
