import { getLeaderboard, getTopScorers, getTopAssisters } from '@/lib/stats';
import LeaderboardClient from './LeaderboardClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Clasificación | Equipos Balanceados ⚽',
  description: 'Ranking general, goleadores y asistentes del grupo de fútbol.',
};

export const revalidate = 60;

export default async function ClasificacionPage() {
  const [leaderboard, topScorers, topAssisters] = await Promise.all([
    getLeaderboard().catch(() => []),
    getTopScorers().catch(() => []),
    getTopAssisters().catch(() => []),
  ]);

  return (
    <div className="page-content">
      <div className="container">
        <h1 className="mb-lg">🏅 Clasificación</h1>
        <LeaderboardClient
          leaderboard={leaderboard}
          topScorers={topScorers}
          topAssisters={topAssisters}
        />
      </div>
    </div>
  );
}
