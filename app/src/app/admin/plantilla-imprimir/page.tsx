'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Player, MatchTeam } from '@/types';
import { formatDate } from '@/lib/utils';
import { Printer } from 'lucide-react';

interface MatchData {
  id: string;
  match_date: string;
  num_teams: number;
  teams: (MatchTeam & { players: Player[] })[];
}

const TEAM_CODE_MAP: Record<string, string> = {
  'Amarillo': 'Y', 'Equipo Amarillo': 'Y',
  'Azul': 'B', 'Equipo Azul': 'B',
  'Rojo': 'R', 'Equipo Rojo': 'R',
  'Verde': 'V', 'Equipo Verde': 'V',
};

function getTeamCode(teamName: string): string {
  return TEAM_CODE_MAP[teamName] || teamName.charAt(0).toUpperCase();
}

export default function PlantillaImprimirPage() {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [mode, setMode] = useState<'rey' | 'clasico'>('rey');
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchMatches = async () => {
      const { data } = await supabase
        .from('matches')
        .select(`
          *,
          teams:match_teams(
            *,
            players:match_team_players(
              player:players(*)
            )
          )
        `)
        .eq('status', 'published')
        .order('match_date', { ascending: false });

      if (data) {
        setMatches(data.map((m: any) => ({
          ...m,
          teams: (m.teams || []).map((t: any) => ({
            ...t,
            players: (t.players || []).map((p: any) => p.player),
          })).sort((a: any, b: any) => a.team_number - b.team_number),
        })));
        if (data.length > 0) setSelectedMatchId(data[0].id);
      }
      setLoading(false);
    };
    fetchMatches();
  }, []);

  const selectedMatch = matches.find(m => m.id === selectedMatchId);

  if (loading) {
    return (
      <div className="animate-fade-in">
        <h1 className="mb-lg">🖨️ Plantilla para Imprimir</h1>
        <div className="skeleton skeleton-card" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Controls - hidden on print */}
      <div className="no-print mb-lg">
        <h1 className="mb-md">🖨️ Plantilla para Imprimir</h1>
        <div className="card mb-md" style={{ padding: 'var(--space-md)' }}>
          <div className="flex gap-md" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="input-group flex-1" style={{ minWidth: '200px' }}>
              <label className="input-label">Convocatoria</label>
              <select className="select" value={selectedMatchId} onChange={e => setSelectedMatchId(e.target.value)}>
                <option value="">-- Selecciona --</option>
                {matches.map(m => (
                  <option key={m.id} value={m.id}>
                    {formatDate(m.match_date)} — {m.num_teams} Equipos
                  </option>
                ))}
              </select>
            </div>
            <div className="input-group" style={{ minWidth: '200px' }}>
              <label className="input-label">Modo de Juego</label>
              <select className="select" value={mode} onChange={e => setMode(e.target.value as 'rey' | 'clasico')}>
                <option value="rey">⚔️ Rey de la Pista</option>
                <option value="clasico">🏆 Clásico</option>
              </select>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => window.print()}
              disabled={!selectedMatch}
            >
              <Printer size={18} /> Imprimir
            </button>
          </div>
        </div>
        {!selectedMatch && (
          <div className="card text-center text-muted" style={{ padding: 'var(--space-xl)' }}>
            Selecciona una convocatoria para generar la plantilla
          </div>
        )}
      </div>

      {/* Printable area */}
      {selectedMatch && (
        <div className="print-area">
          {mode === 'rey' ? (
            <ReyPlantilla match={selectedMatch} />
          ) : (
            <ClasicoPlantilla match={selectedMatch} />
          )}
        </div>
      )}

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area {
            position: absolute;
            left: 0; top: 0;
            width: 100%;
          }
          .no-print { display: none !important; }
          .admin-sidebar, .admin-sidebar-links, .mobile-nav,
          nav, header, footer { display: none !important; }
          .admin-content { padding: 0 !important; margin: 0 !important; }
          .admin-layout { display: block !important; }

          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          .print-page {
            page-break-after: always;
            page-break-inside: avoid;
          }
          .print-page:last-child {
            page-break-after: avoid;
          }
        }

        .print-area {
          font-family: Arial, Helvetica, sans-serif;
          color: #000;
          background: #fff;
          max-width: 720px;
        }
        .print-area table {
          border-collapse: collapse;
          width: 100%;
        }
        .print-area th, .print-area td {
          border: 1.5px solid #000;
          padding: 2px 4px;
          font-size: 10px;
          vertical-align: middle;
        }
        .print-area th {
          background: #e5e5e5;
          font-weight: bold;
          text-align: center;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .print-area .write-line {
          border-bottom: 1px solid #999;
          min-width: 60px;
          display: inline-block;
          height: 16px;
        }
        .print-area h2 {
          font-size: 15px;
          margin: 0 0 4px 0;
          letter-spacing: -0.01em;
        }
        .print-area .header-block {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 6px;
          padding-bottom: 6px;
          border-bottom: 2px solid #000;
        }
        .print-area .team-roster {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 6px;
          font-size: 9px;
        }
        .print-area .team-roster-block {
          border: 1px solid #000;
          padding: 3px 6px;
          flex: 1;
          min-width: 100px;
        }
        .print-area .team-roster-block strong {
          display: block;
          margin-bottom: 1px;
          font-size: 10px;
          border-bottom: 1px solid #ccc;
          padding-bottom: 1px;
        }
        .print-area .example-row td {
          font-style: italic;
          color: #888;
          font-size: 9px;
        }
        .print-area .mvp-box {
          border: 2px solid #000;
          padding: 6px 12px;
          margin-top: 8px;
          font-size: 13px;
        }
        .print-area .notes-box {
          border: 1px solid #999;
          padding: 6px;
          margin-top: 6px;
          min-height: 40px;
          font-size: 9px;
          color: #999;
        }
        .print-area .digi-box {
          margin-top: 6px;
          border: 1px dashed #999;
          padding: 4px 8px;
          font-size: 8px;
          color: #888;
        }
        .print-page {
          padding: 2px;
        }
      `}</style>
    </div>
  );
}

/* ========================================= */
/*  REY DE LA PISTA TEMPLATE                 */
/* ========================================= */
function ReyPlantilla({ match }: { match: MatchData }) {
  const teamCodes = match.teams.map(t => ({ code: getTeamCode(t.team_name), name: t.team_name, players: t.players }));
  const codesStr = teamCodes.map(t => `${t.code} = ${t.name}`).join('  |  ');
  const dateStr = new Date(match.match_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // First player names for example
  const exTeamA = teamCodes[0];
  const exTeamB = teamCodes[1];
  const exPlayer1 = exTeamA?.players[0]?.name || 'Javi';
  const exPlayer2 = exTeamA?.players[1]?.name || 'Alex';
  const exPlayer3 = exTeamB?.players[0]?.name || 'Andres';
  const exPlayer4 = exTeamB?.players[1]?.name || 'Luis';

  const allRows = Array.from({ length: 15 }, (_, i) => i + 1);

  return (
    <div className="print-page">
      <div className="header-block">
        <div>
          <h2>⚔️ LIGA ECFC — Rey de la Pista</h2>
          <div style={{ fontSize: '11px' }}>
            <strong>Fecha:</strong> {dateStr} &nbsp;&nbsp;|&nbsp;&nbsp;
            <strong>Códigos:</strong> {codesStr}
          </div>
        </div>
      </div>

      {/* Player rosters */}
      <div className="team-roster">
        {teamCodes.map(t => (
          <div key={t.code} className="team-roster-block">
            <strong>{t.code} — {t.name}</strong>
            {t.players.map(p => (
              <div key={p.id}>{p.name}</div>
            ))}
          </div>
        ))}
      </div>

      <table>
        <thead>
          <tr>
            <th rowSpan={2} style={{ width: '18px' }}>#</th>
            <th rowSpan={2} style={{ width: '28px' }}>Eq.A</th>
            <th rowSpan={2} style={{ width: '28px' }}>Eq.B</th>
            <th rowSpan={2} style={{ width: '30px' }}>Res.</th>
            <th colSpan={3}>GOL 1</th>
            <th colSpan={3}>GOL 2</th>
            <th colSpan={3}>GOL 3</th>
          </tr>
          <tr>
            <th style={{ fontSize: '7px' }}>Gol.</th>
            <th style={{ fontSize: '7px' }}>Asis.</th>
            <th style={{ fontSize: '7px' }}>Eq</th>
            <th style={{ fontSize: '7px' }}>Gol.</th>
            <th style={{ fontSize: '7px' }}>Asis.</th>
            <th style={{ fontSize: '7px' }}>Eq</th>
            <th style={{ fontSize: '7px' }}>Gol.</th>
            <th style={{ fontSize: '7px' }}>Asis.</th>
            <th style={{ fontSize: '7px' }}>Eq</th>
          </tr>
        </thead>
        <tbody>
          {/* Example row */}
          <tr className="example-row" style={{ height: '22px' }}>
            <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#888' }}>ej.</td>
            <td style={{ textAlign: 'center' }}>{exTeamA?.code}</td>
            <td style={{ textAlign: 'center' }}>{exTeamB?.code}</td>
            <td style={{ textAlign: 'center' }}>2-1</td>
            <td>{exPlayer1}</td>
            <td>{exPlayer2}</td>
            <td style={{ textAlign: 'center' }}>{exTeamA?.code}</td>
            <td>{exPlayer2}</td>
            <td>—</td>
            <td style={{ textAlign: 'center' }}>{exTeamA?.code}</td>
            <td>{exPlayer3}</td>
            <td>{exPlayer4}</td>
            <td style={{ textAlign: 'center' }}>{exTeamB?.code}</td>
          </tr>
          {allRows.map(n => (
            <tr key={n} style={{ height: '24px' }}>
              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{n}</td>
              <td style={{ textAlign: 'center' }}></td>
              <td style={{ textAlign: 'center' }}></td>
              <td style={{ textAlign: 'center' }}></td>
              <td></td><td></td><td></td>
              <td></td><td></td><td></td>
              <td></td><td></td><td></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mvp-box">
        ⭐ <strong>MVP Global:</strong> <span className="write-line" style={{ minWidth: '200px' }}></span>
      </div>

      <div className="notes-box">
        📝 Notas:
      </div>

      <div className="digi-box">
        📱 <strong>Para digitalizar:</strong> Sube la foto a ChatGPT con el prompt de la app (Admin → Importar Hoja) y pega el JSON.
      </div>
    </div>
  );
}

/* ========================================= */
/*  CLÁSICO TEMPLATE                         */
/* ========================================= */
function ClasicoPlantilla({ match }: { match: MatchData }) {
  const teamCodes = match.teams.map(t => ({ code: getTeamCode(t.team_name), name: t.team_name, players: t.players }));
  const codesStr = teamCodes.map(t => `${t.code} = ${t.name}`).join('  |  ');
  const dateStr = new Date(match.match_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const goalRows = Array.from({ length: 20 }, (_, i) => i + 1);
  const exTeamA = teamCodes[0];
  const exPlayer1 = exTeamA?.players[0]?.name || 'Javi';
  const exPlayer2 = exTeamA?.players[1]?.name || 'Alex';

  return (
    <div className="print-page">
      <div className="header-block">
        <div>
          <h2>🏆 LIGA ECFC — Partido Clásico</h2>
          <div style={{ fontSize: '11px' }}>
            <strong>Fecha:</strong> {dateStr} &nbsp;&nbsp;|&nbsp;&nbsp;
            <strong>Códigos:</strong> {codesStr}
          </div>
        </div>
      </div>

      {/* Player rosters */}
      <div className="team-roster">
        {teamCodes.map(t => (
          <div key={t.code} className="team-roster-block">
            <strong>{t.code} — {t.name}</strong>
            {t.players.map(p => (
              <div key={p.id}>{p.name}</div>
            ))}
          </div>
        ))}
      </div>

      {/* Scoreboard */}
      <div style={{ marginBottom: '8px' }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: '100px' }}>Marcador Final</th>
              {teamCodes.map(t => (
                <th key={t.code}>{t.code} ({t.name})</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr style={{ height: '28px' }}>
              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>Goles</td>
              {teamCodes.map(t => (
                <td key={t.code} style={{ textAlign: 'center', fontSize: '14px' }}></td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Goals table */}
      <table>
        <thead>
          <tr>
            <th style={{ width: '22px' }}>#</th>
            <th>Goleador</th>
            <th>Asistente</th>
            <th style={{ width: '30px' }}>Eq</th>
            <th style={{ width: '30px' }}>Min.</th>
          </tr>
        </thead>
        <tbody>
          {/* Example row */}
          <tr className="example-row" style={{ height: '22px' }}>
            <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#888' }}>ej.</td>
            <td>{exPlayer1}</td>
            <td>{exPlayer2}</td>
            <td style={{ textAlign: 'center' }}>{exTeamA?.code}</td>
            <td style={{ textAlign: 'center' }}>5</td>
          </tr>
          {goalRows.map(n => (
            <tr key={n} style={{ height: '24px' }}>
              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{n}</td>
              <td></td>
              <td></td>
              <td style={{ textAlign: 'center' }}></td>
              <td style={{ textAlign: 'center' }}></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mvp-box">
        ⭐ <strong>MVP:</strong> <span className="write-line" style={{ minWidth: '200px' }}></span>
      </div>

      <div className="notes-box">
        📝 Notas:
      </div>

      <div className="digi-box">
        📱 <strong>Para digitalizar:</strong> Sube la foto a ChatGPT con el prompt de la app (Admin → Importar Hoja) y pega el JSON.
      </div>
    </div>
  );
}
