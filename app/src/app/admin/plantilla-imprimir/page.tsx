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
  const [mode, setMode] = useState<'rey' | 'clasico'>('clasico');
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
          <TallyPlantilla match={selectedMatch} mode={mode} />
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
        .print-area .row-num {
          text-align: center;
          font-weight: bold;
          background: #f0f0f0;
          font-size: 10px;
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
          margin-bottom: 8px;
          font-size: 14px;
        }
        .print-area .team-roster-block {
          border: 1.5px solid #000;
          padding: 5px 8px;
          flex: 1;
          min-width: 100px;
        }
        .print-area .team-roster-block strong {
          display: block;
          margin-bottom: 3px;
          font-size: 15px;
          border-bottom: 1.5px solid #000;
          padding-bottom: 3px;
        }
        .print-area .uppercase-notice {
          text-align: center;
          font-size: 14px;
          font-weight: bold;
          border: 2px solid #000;
          padding: 4px;
          margin-bottom: 8px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
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
        .print-area .tally-notice {
          border: 2px solid #000;
          padding: 6px 8px;
          margin-bottom: 10px;
          font-size: 11px;
          line-height: 1.5;
          text-align: center;
        }
        .print-area .tally-table {
          margin-bottom: 12px;
        }
        .print-area .tally-table th.tally-team-header {
          font-size: 14px;
          text-align: left;
          padding: 5px 8px;
          background: #d4d4d4;
          letter-spacing: 0.04em;
        }
        .print-area .tally-swatch {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 1.5px solid #000;
          border-radius: 50%;
          margin-right: 8px;
          vertical-align: -2px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .print-area .tally-table th {
          font-size: 11px;
        }
        .print-area .tally-cells {
          padding: 2px 4px;
        }
        .print-area .tally-boxes {
          display: flex;
          gap: 2px;
          justify-content: center;
          align-items: center;
        }
        .print-area .tally-box {
          display: inline-block;
          border: 1.5px solid #000;
          background: #fff;
          box-sizing: border-box;
          flex-shrink: 0;
        }
        .print-area .tally-proof {
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.08em;
          margin-bottom: 4px;
        }
        .print-area .tally-legend {
          display: flex;
          justify-content: center;
          gap: 32px;
          margin-top: 6px;
        }
        .print-area .tally-legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }
        .print-area .tally-example {
          width: 22px;
          height: 22px;
        }
        .print-area .tally-example-filled {
          background: #000 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .print-area .tally-name {
          font-size: 14px;
          font-weight: bold;
          padding-left: 8px;
          text-transform: uppercase;
        }
        .print-area .tally-table .row-num {
          font-size: 11px;
        }
      `}</style>
    </div>
  );
}

const MAX_GOALS = 12;
const MAX_ASSISTS = 10;

/* Casillas cuadradas, en bloques de 5 para contar rápido */
function TallyBoxes({ size, count }: { size: number; count: number }) {
  return (
    <div className="tally-boxes">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="tally-box"
          style={{ width: `${size}px`, height: `${size}px`, marginLeft: i > 0 && i % 5 === 0 ? '6px' : undefined }}
        />
      ))}
    </div>
  );
}

/* ========================================= */
/*  PLANTILLA DE PALOTES (Rey y Clásico)     */
/* ========================================= */
function TallyPlantilla({ match, mode }: { match: MatchData; mode: 'rey' | 'clasico' }) {
  const teams = match.teams.map(t => ({
    code: getTeamCode(t.team_name),
    name: t.team_name,
    color: t.team_color,
    players: t.players,
  }));
  const codesStr = teams.map(t => `${t.code} = ${t.name}`).join('  |  ');
  const dateStr = new Date(match.match_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const title = mode === 'rey' ? '⚔️ LIGA ECFC — Rey de la Pista' : '🏆 LIGA ECFC — Partido Clásico';

  // Altura de fila adaptada para que todo quepa en un A4 (más espacio cuantos menos jugadores)
  const totalPlayers = teams.reduce((acc, t) => acc + t.players.length, 0);
  const available = 760 - teams.length * 52;
  const rowHeight = Math.max(26, Math.min(48, Math.floor(available / Math.max(totalPlayers, 1))));
  // Casillas cuadradas: tan grandes como permita la fila (y el ancho de la columna)
  const boxSize = Math.max(16, Math.min(20, rowHeight - 8));

  // Numeración continua de filas para que la IA use los # como anclas
  let rowCounter = 0;

  return (
    <div className="print-page">
      <div className="header-block">
        <div>
          <h2>{title}</h2>
          <div style={{ fontSize: '11px' }}>
            <strong>Fecha:</strong> {dateStr} &nbsp;&nbsp;|&nbsp;&nbsp;
            <strong>Códigos:</strong> {codesStr}
          </div>
        </div>
      </div>

      <div className="tally-notice">
        <strong>INSTRUCTIONS</strong> — One square per goal / assist. Use the next empty square in the player&apos;s row.
        <div className="tally-legend">
          <div className="tally-legend-item">
            <span className="tally-box tally-example">
              <svg viewBox="0 0 20 20" width="100%" height="100%" aria-hidden="true">
                <line x1="10" y1="3" x2="10" y2="17" stroke="#000" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </span>
            <span className="tally-box tally-example">
              <svg viewBox="0 0 20 20" width="100%" height="100%" aria-hidden="true">
                <line x1="4" y1="16" x2="16" y2="4" stroke="#000" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </span>
            <span className="tally-box tally-example">
              <svg viewBox="0 0 20 20" width="100%" height="100%" aria-hidden="true">
                <line x1="4" y1="4" x2="16" y2="16" stroke="#000" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="4" y1="16" x2="16" y2="4" stroke="#000" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </span>
            <span><strong>| or / or X = COUNTS</strong> (1 goal / assist)</span>
          </div>
          <div className="tally-legend-item">
            <span className="tally-box tally-example tally-example-filled" />
            <span><strong>FULLY FILLED = CANCELLED</strong> (mistake, does not count)</span>
          </div>
        </div>
      </div>

      {teams.map(t => (
        <table key={t.code} className="tally-table">
          <thead>
            <tr>
              <th colSpan={5} className="tally-team-header">
                <span className="tally-swatch" style={{ background: t.color }} />
                {t.code} — {t.name.toUpperCase()}
              </th>
            </tr>
            <tr>
              <th style={{ width: '24px' }}>#</th>
              <th>Jugador</th>
              <th style={{ width: '40%' }}>⚽ Goles (máx. {MAX_GOALS})</th>
              <th style={{ width: '33%' }}>👟 Asistencias (máx. {MAX_ASSISTS})</th>
              <th style={{ width: '24px' }}>#</th>
            </tr>
          </thead>
          <tbody>
            {t.players.map(p => {
              rowCounter += 1;
              const n = rowCounter;
              return (
                <tr key={p.id} style={{ height: `${rowHeight}px` }}>
                  <td className="row-num">{n}</td>
                  <td className="tally-name">{p.name}</td>
                  <td className="tally-cells"><TallyBoxes size={boxSize} count={MAX_GOALS} /></td>
                  <td className="tally-cells"><TallyBoxes size={boxSize} count={MAX_ASSISTS} /></td>
                  <td className="row-num">{n}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ))}

      <div className="mvp-box">
        ⭐ <strong>MVP (en mayúsculas):</strong> <span className="write-line" style={{ minWidth: '220px' }}></span>
      </div>

      <div className="digi-box">
        📱 <strong>Para digitalizar:</strong> Haz una foto a la hoja, súbela a la IA con el prompt de la app (Admin → Importar Hoja) y pega el JSON.
      </div>
    </div>
  );
}
