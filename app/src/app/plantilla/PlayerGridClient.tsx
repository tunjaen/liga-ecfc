'use client';

import { useState, useMemo } from 'react';
import type { Player, PlayerLeaderboard } from '@/types';
import { PlayerCard } from '@/components/players/PlayerCard';
import { Search, LayoutGrid, Layers, Scale, X } from 'lucide-react';
import { CompareModal } from './CompareModal';

interface PlayerGridClientProps {
  players: Player[];
  leaderboard?: PlayerLeaderboard[];
}

export default function PlayerGridClient({ players, leaderboard }: PlayerGridClientProps) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'score'>('name');
  
  // Nuevos estados
  const [viewMode, setViewMode] = useState<'grid' | 'tiers'>('grid');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedToCompare, setSelectedToCompare] = useState<string[]>([]);

  const filtered = useMemo(() => {
    let result = players.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );

    if (sortBy === 'score') {
      result = [...result].sort((a, b) => b.total_score - a.total_score);
    } else {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [players, search, sortBy]);

  // Lógica de Tiers (1 a 6) por porcentaje/tamaño equitativo
  const tiers = useMemo(() => {
    if (viewMode !== 'tiers') return [];
    
    // Para Tiers, siempre ordenamos por score descendente, ignorando el `sortBy` actual
    const sorted = [...filtered].sort((a, b) => b.total_score - a.total_score);
    if (sorted.length === 0) return Array.from({ length: 6 }, () => []);

    // Repartir en 6 grupos lo más equitativos posibles
    const chunkSizes = Array(6).fill(Math.floor(sorted.length / 6));
    let remainder = sorted.length % 6;
    let i = 0;
    while (remainder > 0) {
      chunkSizes[i]++;
      remainder--;
      i++;
    }

    const tiersArray: Player[][] = [];
    let start = 0;
    for (const size of chunkSizes) {
      tiersArray.push(sorted.slice(start, start + size));
      start += size;
    }
    return tiersArray;
  }, [filtered, viewMode]);

  const handlePlayerClick = (playerId: string) => {
    if (compareMode) {
      setSelectedToCompare(prev => {
        if (prev.includes(playerId)) return prev.filter(id => id !== playerId);
        if (prev.length < 2) return [...prev, playerId];
        return prev; // Ya hay 2 seleccionados
      });
    }
  };

  const getPlayerById = (id: string) => players.find(p => p.id === id);
  const getLeaderboardById = (id: string) => leaderboard?.find(l => l.id === id);

  const p1 = selectedToCompare.length > 0 ? getPlayerById(selectedToCompare[0]) : undefined;
  const p2 = selectedToCompare.length > 1 ? getPlayerById(selectedToCompare[1]) : undefined;

  return (
    <>
      {/* Compare Banner */}
      {compareMode && (
        <div className="card animate-fade-in mb-md flex items-center justify-between" style={{ background: 'var(--bg-active)', border: '1px solid var(--accent-primary)' }}>
          <div>
            <div className="font-bold" style={{ color: 'var(--accent-primary)' }}>Modo Comparación</div>
            <div className="text-sm text-muted">Selecciona 2 jugadores para compararlos ({selectedToCompare.length}/2)</div>
          </div>
          <button 
            className="btn btn-ghost text-sm" 
            onClick={() => {
              setCompareMode(false);
              setSelectedToCompare([]);
            }}
          >
            <X size={16} /> Cancelar
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-md mb-lg" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar flex-1" style={{ minWidth: '200px' }}>
          <Search size={18} className="search-bar-icon" />
          <input
            type="text"
            className="input"
            placeholder="Buscar jugador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="player-search-input"
          />
        </div>
        
        {viewMode === 'grid' && (
          <select
            className="select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'score')}
            style={{ width: 'auto', minWidth: '160px' }}
            id="player-sort-select"
          >
            <option value="name">Ordenar por nombre</option>
            <option value="score">Ordenar por puntuación</option>
          </select>
        )}

        {/* View Toggles & Actions */}
        <div className="flex gap-sm" style={{ background: 'var(--bg-surface)', padding: '4px', borderRadius: 'var(--radius-lg)' }}>
          <button
            className={`btn btn-sm ${viewMode === 'grid' ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => setViewMode('grid')}
            title="Vista Cuadrícula"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            className={`btn btn-sm ${viewMode === 'tiers' ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => setViewMode('tiers')}
            title="Vista Tiers"
          >
            <Layers size={18} />
          </button>
        </div>

        <button
          className={`btn ${compareMode ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => {
            setCompareMode(!compareMode);
            if (compareMode) setSelectedToCompare([]);
          }}
          title="Comparar Jugadores"
        >
          <Scale size={18} /> Comparar
        </button>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted mb-md">
        {filtered.length} jugador{filtered.length !== 1 ? 'es' : ''}
      </div>

      {/* View: Grid */}
      {viewMode === 'grid' && (
        filtered.length > 0 ? (
          <div className="grid-3">
            {filtered.map((player, index) => (
              <PlayerCard 
                key={player.id} 
                player={player} 
                index={index} 
                onClick={compareMode ? () => handlePlayerClick(player.id) : undefined}
                selected={selectedToCompare.includes(player.id)}
              />
            ))}
          </div>
        ) : (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-title">Sin resultados</div>
              <div className="empty-state-text">
                No se encontraron jugadores con &quot;{search}&quot;
              </div>
            </div>
          </div>
        )
      )}

      {/* View: Tiers */}
      {viewMode === 'tiers' && (
        <div className="flex flex-col gap-lg animate-fade-in">
          {tiers.map((tierPlayers, tierIndex) => {
            if (tierPlayers.length === 0) return null;
            
            const tierNumber = tierIndex + 1;
            // Tier 1: Élite, Tier 6: Promesas
            const tierTitles = ["🏆 Tier 1 (Élite)", "🥇 Tier 2", "🥈 Tier 3", "🥉 Tier 4", "🎯 Tier 5", "🌱 Tier 6 (Promesas)"];
            const tierColors = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#64748b"];

            return (
              <div key={tierNumber} className="card" style={{ borderLeft: `4px solid ${tierColors[tierIndex]}` }}>
                <h3 className="mb-md" style={{ color: tierColors[tierIndex] }}>
                  {tierTitles[tierIndex]} <span className="text-sm text-muted font-normal ml-sm">({tierPlayers.length})</span>
                </h3>
                <div className="grid-3">
                  {tierPlayers.map((player, idx) => (
                    <PlayerCard 
                      key={player.id} 
                      player={player} 
                      index={idx}
                      onClick={compareMode ? () => handlePlayerClick(player.id) : undefined}
                      selected={selectedToCompare.includes(player.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Comparación */}
      {compareMode && selectedToCompare.length === 2 && p1 && p2 && (
        <CompareModal
          player1={p1}
          player2={p2}
          leaderboard1={getLeaderboardById(p1.id)}
          leaderboard2={getLeaderboardById(p2.id)}
          onClose={() => {
            setCompareMode(false);
            setSelectedToCompare([]);
          }}
        />
      )}
    </>
  );
}
