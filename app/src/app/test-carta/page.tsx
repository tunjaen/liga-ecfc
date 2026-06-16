import { getPlayers } from '@/lib/stats';
import { TestCartaClient } from './TestCartaClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Laboratorio de Cartas FUT 🧪 | Equipos Balanceados',
  description: 'Página de pruebas para ver y ajustar el diseño de la carta FUT de los jugadores con efectos visuales y modo MVP.',
};

export default async function TestCartaPage() {
  const players = await getPlayers(false).catch(() => []); // Fetch all players (active and inactive)

  return (
    <div className="page-content">
      <div className="container">
        <TestCartaClient initialPlayers={players} />
      </div>
    </div>
  );
}
