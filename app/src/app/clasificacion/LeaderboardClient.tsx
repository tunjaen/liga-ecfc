'use client';

import { useState } from 'react';
import type { PlayerLeaderboard } from '@/types';
import { PlayerAvatar } from '@/components/players/PlayerAvatar';
import { getPlayerPhotoUrl } from '@/lib/utils';
import Link from 'next/link';

interface LeaderboardClientProps {
  leaderboard: PlayerLeaderboard[];
  topScorers: PlayerLeaderboard[];
  topAssisters: PlayerLeaderboard[];
}

type TabKey = 'general' | 'goleadores' | 'asistentes';

export default function LeaderboardClient({
  leaderboard,
  topScorers,
  topAssisters,
}: LeaderboardClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('general');

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'general', label: 'General', icon: '🏆' },
    { key: 'goleadores', label: 'Goleadores', icon: '⚽' },
    { key: 'asistentes', label: 'Asistentes', icon: '👟' },
  ];

  return (
    <>
      {/* Tabs */}
      <div className="tabs" id="leaderboard-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
            id={`tab-${tab.key}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* General Leaderboard */}
      {activeTab === 'general' && (
        <div className="table-container animate-fade-in">
          <table className="table" id="leaderboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Jugador</th>
                <th>PJ</th>
                <th>PG</th>
                <th>PP</th>
                <th>Win%</th>
                <th>⚽</th>
                <th>👟</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((player, index) => (
                <tr key={player.id}>
                  <td>
                    {index < 3 ? (
                      <span className={`medal medal-${['gold', 'silver', 'bronze'][index]}`}>
                        {index + 1}
                      </span>
                    ) : (
                      <span className="text-muted">{index + 1}</span>
                    )}
                  </td>
                  <td>
                    <Link href={`/plantilla/${player.id}`} className="flex items-center gap-sm">
                      {player.country && (
                        <img
                          src={`https://flagcdn.com/w20/${player.country.toLowerCase()}.png`}
                          alt={player.country}
                          title={player.country}
                          style={{ width: '20px', height: 'auto', borderRadius: '2px' }}
                        />
                      )}
                      <PlayerAvatar
                        name={player.name}
                        photoUrl={getPlayerPhotoUrl(player.photo_url)}
                        size="sm"
                      />
                      <span className="font-semibold">{player.name}</span>
                    </Link>
                  </td>
                  <td>{player.matches_played}</td>
                  <td style={{ color: 'var(--accent-secondary)' }}>{player.wins}</td>
                  <td style={{ color: 'var(--accent-danger)' }}>{player.losses}</td>
                  <td>
                    <span className="font-semibold">{player.winrate}%</span>
                  </td>
                  <td>{player.total_goals}</td>
                  <td>{player.total_assists}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Top Scorers */}
      {activeTab === 'goleadores' && (
        <div className="animate-fade-in">
          {topScorers.length > 0 ? (
            <div className="flex flex-col gap-sm">
              {topScorers.map((player, index) => (
                <Link key={player.id} href={`/plantilla/${player.id}`}>
                  <div className="card card-interactive flex items-center gap-md">
                    <div style={{ width: '32px', textAlign: 'center' }}>
                      {index < 3 ? (
                        <span className={`medal medal-${['gold', 'silver', 'bronze'][index]}`}>
                          {index + 1}
                        </span>
                      ) : (
                        <span className="text-muted font-semibold">{index + 1}</span>
                      )}
                    </div>
                    {player.country && (
                      <img
                        src={`https://flagcdn.com/w20/${player.country.toLowerCase()}.png`}
                        alt={player.country}
                        title={player.country}
                        style={{ width: '20px', height: 'auto', borderRadius: '2px' }}
                      />
                    )}
                    <PlayerAvatar
                      name={player.name}
                      photoUrl={getPlayerPhotoUrl(player.photo_url)}
                    />
                    <div className="flex-1">
                      <div className="font-semibold">{player.name}</div>
                      <div className="text-xs text-muted">
                        {player.matches_played} partidos
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold" style={{ fontSize: '1.25rem', color: 'var(--accent-goal)' }}>
                        {player.total_goals}
                      </div>
                      <div className="text-xs text-muted">goles</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">⚽</div>
                <div className="empty-state-title">Sin goles registrados</div>
                <div className="empty-state-text">Los goleadores aparecerán aquí.</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Assisters */}
      {activeTab === 'asistentes' && (
        <div className="animate-fade-in">
          {topAssisters.length > 0 ? (
            <div className="flex flex-col gap-sm">
              {topAssisters.map((player, index) => (
                <Link key={player.id} href={`/plantilla/${player.id}`}>
                  <div className="card card-interactive flex items-center gap-md">
                    <div style={{ width: '32px', textAlign: 'center' }}>
                      {index < 3 ? (
                        <span className={`medal medal-${['gold', 'silver', 'bronze'][index]}`}>
                          {index + 1}
                        </span>
                      ) : (
                        <span className="text-muted font-semibold">{index + 1}</span>
                      )}
                    </div>
                    {player.country && (
                      <img
                        src={`https://flagcdn.com/w20/${player.country.toLowerCase()}.png`}
                        alt={player.country}
                        title={player.country}
                        style={{ width: '20px', height: 'auto', borderRadius: '2px' }}
                      />
                    )}
                    <PlayerAvatar
                      name={player.name}
                      photoUrl={getPlayerPhotoUrl(player.photo_url)}
                    />
                    <div className="flex-1">
                      <div className="font-semibold">{player.name}</div>
                      <div className="text-xs text-muted">
                        {player.matches_played} partidos
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold" style={{ fontSize: '1.25rem', color: 'var(--accent-assist)' }}>
                        {player.total_assists}
                      </div>
                      <div className="text-xs text-muted">asistencias</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">👟</div>
                <div className="empty-state-title">Sin asistencias registradas</div>
                <div className="empty-state-text">Las asistencias aparecerán aquí.</div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
