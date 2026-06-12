import { getInitials } from '@/lib/utils';

interface PlayerAvatarProps {
  name: string;
  photoUrl: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'player-avatar-sm',
  md: '',
  lg: 'player-avatar-lg',
  xl: 'player-avatar-xl',
};

export function PlayerAvatar({ name, photoUrl, size = 'md', className = '' }: PlayerAvatarProps) {
  const sizeClass = sizeMap[size];

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`player-avatar ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <div
      className={`player-avatar player-avatar-placeholder ${sizeClass} ${className}`}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
}
