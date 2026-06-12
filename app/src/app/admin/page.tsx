import { getPlayers, getMatches } from '@/lib/stats';
import Link from 'next/link';
import { Users, Shuffle, ClipboardCheck } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin | Equipos Balanceados ⚽',
};

export const revalidate = 0;

export default async function AdminDashboard() {
  const [players, completedMatches, publishedMatches] = await Promise.all([
    getPlayers().catch(() => []),
    getMatches('completed').catch(() => []),
    getMatches('published').catch(() => []),
  ]);

  const pendingMatch = publishedMatches.length > 0 ? publishedMatches[0] : null;

  return (
    <div className="animate-fade-in">
      <h1 className="mb-lg">⚙️ Panel de Administración</h1>

      {/* Stats */}
      <div className="grid-3 mb-lg">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
            👥
          </div>
          <div>
            <div className="stat-card-value">{players.length}</div>
            <div className="stat-card-label">Jugadores activos</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
            📅
          </div>
          <div>
            <div className="stat-card-value">{completedMatches.length}</div>
            <div className="stat-card-label">Partidos jugados</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
            📋
          </div>
          <div>
            <div className="stat-card-value" style={{ color: pendingMatch ? 'var(--accent-warning)' : 'var(--text-muted)' }}>
              {pendingMatch ? '1' : '0'}
            </div>
            <div className="stat-card-label">Pendiente de resultado</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="section-title">Acciones Rápidas</h2>
      <div className="grid-3">
        <Link href="/admin/jugadores">
          <div className="card card-interactive text-center" id="admin-action-jugadores">
            <Users size={32} color="var(--accent-primary)" style={{ margin: '0 auto var(--space-sm)' }} />
            <div className="font-semibold mb-xs">Gestionar Jugadores</div>
            <div className="text-sm text-muted">Añadir, editar o desactivar</div>
          </div>
        </Link>

        <Link href="/admin/matchmaker">
          <div className="card card-interactive text-center" id="admin-action-matchmaker">
            <Shuffle size={32} color="var(--accent-secondary)" style={{ margin: '0 auto var(--space-sm)' }} />
            <div className="font-semibold mb-xs">Generar Equipos</div>
            <div className="text-sm text-muted">Seleccionar y balancear</div>
          </div>
        </Link>

        <Link href="/admin/registrar">
          <div className="card card-interactive text-center" id="admin-action-registrar">
            <ClipboardCheck size={32} color="var(--accent-warning)" style={{ margin: '0 auto var(--space-sm)' }} />
            <div className="font-semibold mb-xs">Registrar Resultado</div>
            <div className="text-sm text-muted">Goles, asistencias, MVP</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
