import { X } from 'lucide-react';
import type { Player, PlayerLeaderboard } from '@/types';
import { PlayerAvatar } from '@/components/players/PlayerAvatar';
import { getPlayerPhotoUrl } from '@/lib/utils';

interface CompareModalProps {
  player1: Player;
  player2: Player;
  leaderboard1?: PlayerLeaderboard;
  leaderboard2?: PlayerLeaderboard;
  onClose: () => void;
}

export function CompareModal({ player1, player2, leaderboard1, leaderboard2, onClose }: CompareModalProps) {
  // Stat rows generator
  const renderStatRow = (label: string, val1: number, val2: number, invertColor = false) => {
    const isP1Better = invertColor ? val1 < val2 : val1 > val2;
    const isP2Better = invertColor ? val2 < val1 : val2 > val1;
    
    // Normalize for bar width
    const maxVal = Math.max(val1, val2, 1); // Avoid div by 0
    const w1 = `${(val1 / maxVal) * 100}%`;
    const w2 = `${(val2 / maxVal) * 100}%`;

    return (
      <div className="mb-md">
        <div className="flex justify-between text-xs font-semibold mb-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <span>{val1}</span>
          <span className="text-muted">{label}</span>
          <span>{val2}</span>
        </div>
        <div className="flex gap-xs items-center">
          <div className="flex-1 flex justify-end" style={{ height: '8px', background: 'var(--bg-surface)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: w1, height: '100%', background: isP1Better ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
          </div>
          <div className="flex-1" style={{ height: '8px', background: 'var(--bg-surface)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: w2, height: '100%', background: isP2Better ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-content animate-slide-up" style={{ maxWidth: '600px', width: '100%' }}>
        <button className="modal-close" onClick={onClose} id="close-compare-modal">
          <X size={20} />
        </button>

        <h2 className="mb-lg text-center">Comparativa</h2>

        <div className="flex justify-between items-center mb-lg">
          <div className="flex flex-col items-center flex-1">
            <PlayerAvatar name={player1.name} photoUrl={getPlayerPhotoUrl(player1.photo_url)} size="lg" />
            <div className="font-bold mt-sm text-center">{player1.name}</div>
          </div>
          <div className="text-2xl font-bold text-muted mx-md">VS</div>
          <div className="flex flex-col items-center flex-1">
            <PlayerAvatar name={player2.name} photoUrl={getPlayerPhotoUrl(player2.photo_url)} size="lg" />
            <div className="font-bold mt-sm text-center">{player2.name}</div>
          </div>
        </div>

        <div className="card" style={{ background: 'var(--bg-surface)' }}>
          <h4 className="text-center mb-md text-sm text-muted">Atributos Base</h4>
          {renderStatRow('Puntuación Total', player1.total_score, player2.total_score)}
          {renderStatRow('Ataque', player1.attack, player2.attack)}
          {renderStatRow('Defensa', player1.defense, player2.defense)}
          {renderStatRow('Físico', player1.fitness, player2.fitness)}
          {renderStatRow('Técnica', player1.technique, player2.technique)}
          {renderStatRow('IQ', player1.iq, player2.iq)}

          <h4 className="text-center mt-lg mb-md text-sm text-muted">Rendimiento Histórico</h4>
          {renderStatRow('Goles', leaderboard1?.total_goals || 0, leaderboard2?.total_goals || 0)}
          {renderStatRow('Asistencias', leaderboard1?.total_assists || 0, leaderboard2?.total_assists || 0)}
          {renderStatRow('Partidos Jugados', leaderboard1?.matches_played || 0, leaderboard2?.matches_played || 0)}
          
          {/* Winrate calculation */}
          {(() => {
            const wr1 = leaderboard1?.matches_played ? Math.round((leaderboard1.wins / leaderboard1.matches_played) * 100) : 0;
            const wr2 = leaderboard2?.matches_played ? Math.round((leaderboard2.wins / leaderboard2.matches_played) * 100) : 0;
            return renderStatRow('Winrate (%)', wr1, wr2);
          })()}
        </div>
      </div>
    </div>
  );
}
