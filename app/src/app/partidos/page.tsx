import { getMatches } from '@/lib/stats';
import type { Metadata } from 'next';
import { MatchHistoryList } from '@/components/matches/MatchHistoryList';

export const metadata: Metadata = {
  title: 'Partidos | Equipos Balanceados ⚽',
  description: 'Historial completo de partidos con resultados, goles y MVPs.',
};

export const revalidate = 60;

export default async function PartidosPage() {
  const matches = await getMatches('completed').catch(() => []);

  return (
    <div className="page-content">
      <div className="container">
        <h1 className="mb-lg">📅 Historial de Partidos</h1>

        {matches.length > 0 ? (
          <MatchHistoryList matches={matches} />
        ) : (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <div className="empty-state-title">Sin partidos registrados</div>
              <div className="empty-state-text">
                El historial de partidos aparecerá aquí una vez se registren resultados.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
