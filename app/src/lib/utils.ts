import type { Player } from '@/types';

/**
 * Returns the player's initials (first letter of first and last name).
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Formats a date string to a localized date.
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formats a date string to a short format (e.g., "12 Jun").
 */
export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Returns the Supabase Storage URL for a player photo.
 */
export function getPlayerPhotoUrl(photoPath: string | null): string | null {
  if (!photoPath) return null;
  if (photoPath.startsWith('http')) return photoPath;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/player-photos/${photoPath}`;
}

/**
 * Returns a CSS color value based on a stat value (1-10).
 * Used for stat visualization.
 */
export function getStatColor(value: number): string {
  if (value >= 8) return 'var(--accent-secondary)';
  if (value >= 5) return 'var(--accent-primary)';
  if (value >= 3) return 'var(--accent-warning)';
  return 'var(--accent-danger)';
}

/**
 * Determines the balance quality based on standard deviation.
 */
export function getBalanceQuality(stdDev: number): 'excellent' | 'good' | 'poor' {
  if (stdDev <= 2) return 'excellent';
  if (stdDev <= 5) return 'good';
  return 'poor';
}

/**
 * Returns a human-readable label for balance quality.
 */
export function getBalanceLabel(quality: 'excellent' | 'good' | 'poor'): string {
  switch (quality) {
    case 'excellent':
      return 'Balance excelente';
    case 'good':
      return 'Balance aceptable';
    case 'poor':
      return 'Balance mejorable';
  }
}

/**
 * Calculates the winrate percentage.
 */
export function calculateWinrate(wins: number, totalPlayed: number): number {
  if (totalPlayed === 0) return 0;
  return Math.round((wins / totalPlayed) * 100 * 10) / 10;
}

/**
 * Sorts players by total_score descending.
 */
export function sortPlayersByScore(players: Player[]): Player[] {
  return [...players].sort((a, b) => b.total_score - a.total_score);
}
