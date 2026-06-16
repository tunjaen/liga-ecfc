import { getPlayers, getLeaderboard } from '@/lib/stats';
import PlayerGridClient from './PlayerGridClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Plantilla | Equipos Balanceados ⚽',
  description: 'Directorio completo de jugadores con sus estadísticas y puntuaciones.',
};

export const revalidate = 60;

export default async function PlantillaPage() {
  const players = await getPlayers().catch(() => []);
  const leaderboard = await getLeaderboard().catch(() => []);

  return (
    <div className="page-content">
      <div className="container">
        <h1 className="mb-lg">Plantilla</h1>
        <PlayerGridClient players={players} leaderboard={leaderboard} />
      </div>
    </div>
  );
}
