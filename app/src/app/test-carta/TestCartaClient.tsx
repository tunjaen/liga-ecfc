'use client';

import { useState, useEffect } from 'react';
import type { Player } from '@/types';
import { FutCard } from '@/components/players/FutCard';
import { DownloadFutCardBtn } from '@/components/players/DownloadFutCardBtn';
import { Sparkles, RefreshCw, User, Shield, Target, Activity, Zap, Brain, Globe } from 'lucide-react';

interface Props {
  initialPlayers: Player[];
}

export function TestCartaClient({ initialPlayers }: Props) {
  // Select first player by default, or fallback to a template player
  const defaultPlayer: Player = {
    id: 'temp-id',
    name: 'Selecciona Jugador',
    photo_url: null,
    defense: 5,
    attack: 5,
    fitness: 5,
    technique: 5,
    iq: 5,
    total_score: 25,
    country: 'es',
    is_active: true,
    created_at: new Date().toISOString(),
  };

  const playersList = initialPlayers.length > 0 ? initialPlayers : [defaultPlayer];

  const [selectedPlayerId, setSelectedPlayerId] = useState(playersList[0].id);
  const [name, setName] = useState(playersList[0].name);
  const [photoUrl, setPhotoUrl] = useState<string | null>(playersList[0].photo_url);
  const [country, setCountry] = useState(playersList[0].country || 'es');
  const [defense, setDefense] = useState(playersList[0].defense);
  const [attack, setAttack] = useState(playersList[0].attack);
  const [fitness, setFitness] = useState(playersList[0].fitness);
  const [technique, setTechnique] = useState(playersList[0].technique || 5);
  const [iq, setIq] = useState(playersList[0].iq || 5);
  const [isMvp, setIsMvp] = useState(true); // Default to true in laboratory to showcase the effect

  // Sync state when selected player changes
  useEffect(() => {
    const player = playersList.find(p => p.id === selectedPlayerId);
    if (player) {
      setName(player.name);
      setPhotoUrl(player.photo_url);
      setCountry(player.country || 'es');
      setDefense(player.defense);
      setAttack(player.attack);
      setFitness(player.fitness);
      setTechnique(player.technique || 5);
      setIq(player.iq || 5);
    }
  }, [selectedPlayerId]);

  // Handle resetting current player
  const handleReset = () => {
    const player = playersList.find(p => p.id === selectedPlayerId);
    if (player) {
      setName(player.name);
      setPhotoUrl(player.photo_url);
      setCountry(player.country || 'es');
      setDefense(player.defense);
      setAttack(player.attack);
      setFitness(player.fitness);
      setTechnique(player.technique || 5);
      setIq(player.iq || 5);
    }
  };

  // Calculate score dynamically (average or total)
  // In our schema, total_score was generated as defense + attack + fitness.
  // With technique and iq, let's keep the formula consistent or represent it as total sum / average.
  // To keep total_score in range (e.g. 1-99 like FIFA cards):
  // Let's compute it as a formula that scales to ~99. 
  // For instance, average of stats * 9.9
  const calculatedTotalScore = Math.round(
    ((defense + attack + fitness + technique + iq) / 5) * 9.9
  );

  const mockPlayer: Player = {
    id: selectedPlayerId,
    name,
    photo_url: photoUrl,
    defense,
    attack,
    fitness,
    technique,
    iq,
    total_score: calculatedTotalScore,
    country,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  const countries = [
    { code: 'es', name: 'España 🇪🇸' },
    { code: 'ar', name: 'Argentina 🇦🇷' },
    { code: 'br', name: 'Brasil 🇧🇷' },
    { code: 'fr', name: 'Francia 🇫🇷' },
    { code: 'it', name: 'Italia 🇮🇹' },
    { code: 'de', name: 'Alemania 🇩🇪' },
    { code: 'gb', name: 'Inglaterra 🇬🇧' },
    { code: 'pt', name: 'Portugal 🇵🇹' },
    { code: 'co', name: 'Colombia 🇨🇴' },
    { code: 'uy', name: 'Uruguay 🇺🇾' },
    { code: 'mx', name: 'México 🇲🇽' },
    { code: 'cl', name: 'Chile 🇨🇱' },
  ];

  return (
    <div style={{ paddingBottom: 'var(--space-2xl)' }}>
      {/* Header */}
      <div className="flex flex-col gap-sm mb-xl">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-sm">
          Laboratorio de Cartas FUT <span style={{ color: 'var(--accent-gold)' }}>🧪</span>
        </h1>
        <p className="text-muted" style={{ maxWidth: '600px' }}>
          Personaliza estadísticas, cambia de jugador o activa el resplandor de energía dorada (MVP) para previsualizar y descargar la carta perfecta en tiempo real.
        </p>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: 'var(--space-xl)', alignItems: 'start' }}>
        
        {/* Controls Card */}
        <div className="card" style={{ padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          
          <div className="flex items-center justify-between border-b pb-md" style={{ borderColor: 'var(--glass-border)' }}>
            <h2 className="text-xl font-bold flex items-center gap-sm" style={{ margin: 0 }}>
              Controles de la Carta
            </h2>
            <button 
              className="btn btn-ghost flex items-center gap-xs text-sm" 
              onClick={handleReset}
              title="Restablecer valores originales del jugador"
            >
              <RefreshCw size={16} /> Reajustar
            </button>
          </div>

          {/* Player Selector */}
          <div className="flex flex-col gap-xs">
            <label className="font-semibold text-sm text-muted">Seleccionar Jugador Plantilla</label>
            <select
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="form-control"
              style={{
                width: '100%',
                padding: 'var(--space-sm) var(--space-md)',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
              }}
            >
              {playersList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Punt. Base: {p.total_score})
                </option>
              ))}
            </select>
          </div>

          {/* Toggle MVP */}
          <div className="flex items-center justify-between card" style={{ padding: 'var(--space-md)', background: isMvp ? 'rgba(251, 191, 36, 0.08)' : 'var(--bg-surface)', border: isMvp ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid var(--glass-border)' }}>
            <div className="flex flex-col">
              <span className="font-bold flex items-center gap-xs" style={{ color: isMvp ? 'var(--accent-gold)' : 'inherit' }}>
                <Sparkles size={18} /> Efecto Resplandor MVP
              </span>
              <span className="text-xs text-muted">Aplica fondo dorado y el resplandor animado premium.</span>
            </div>
            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px' }}>
              <input 
                type="checkbox" 
                checked={isMvp} 
                onChange={(e) => setIsMvp(e.target.checked)} 
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span 
                className="slider round" 
                style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: isMvp ? 'var(--accent-gold)' : '#ccc',
                  transition: '.4s',
                  borderRadius: '34px'
                }}
              >
                <span 
                  style={{
                    position: 'absolute',
                    content: '""',
                    height: '18px',
                    width: '18px',
                    left: isMvp ? '28px' : '4px',
                    bottom: '4px',
                    backgroundColor: 'white',
                    transition: '.4s',
                    borderRadius: '50%'
                  }}
                />
              </span>
            </label>
          </div>

          {/* Name & Country */}
          <div className="grid-2" style={{ gridTemplateColumns: '1.2fr 0.8fr', gap: 'var(--space-md)' }}>
            <div className="flex flex-col gap-xs">
              <label className="font-semibold text-sm text-muted flex items-center gap-xs">
                <User size={14} /> Nombre del Jugador
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-control"
                placeholder="Nombre"
                style={{
                  width: '100%',
                  padding: 'var(--space-sm) var(--space-md)',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-semibold text-sm text-muted flex items-center gap-xs">
                <Globe size={14} /> Bandera
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="form-control"
                style={{
                  width: '100%',
                  padding: 'var(--space-sm) var(--space-md)',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                }}
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Statistics Sliders */}
          <div className="flex flex-col gap-md">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted border-b pb-xs" style={{ borderColor: 'var(--glass-border)' }}>
              Atributos de Habilidad
            </h3>

            {/* DEF Slider */}
            <div className="flex flex-col gap-xs">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold flex items-center gap-xs text-blue-400">
                  <Shield size={14} /> DEF (Defensa)
                </span>
                <span className="font-extrabold">{defense}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={defense}
                onChange={(e) => setDefense(Number(e.target.value))}
                style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
            </div>

            {/* ATK Slider */}
            <div className="flex flex-col gap-xs">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold flex items-center gap-xs text-red-400">
                  <Target size={14} /> ATK (Ataque)
                </span>
                <span className="font-extrabold">{attack}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={attack}
                onChange={(e) => setAttack(Number(e.target.value))}
                style={{ accentColor: 'var(--accent-danger)', cursor: 'pointer' }}
              />
            </div>

            {/* FIT Slider */}
            <div className="flex flex-col gap-xs">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold flex items-center gap-xs text-emerald-400">
                  <Activity size={14} /> FIT (Físico)
                </span>
                <span className="font-extrabold">{fitness}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={fitness}
                onChange={(e) => setFitness(Number(e.target.value))}
                style={{ accentColor: 'var(--accent-secondary)', cursor: 'pointer' }}
              />
            </div>

            {/* TEC Slider */}
            <div className="flex flex-col gap-xs">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold flex items-center gap-xs text-amber-500">
                  <Zap size={14} /> TEC (Técnica)
                </span>
                <span className="font-extrabold">{technique}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={technique}
                onChange={(e) => setTechnique(Number(e.target.value))}
                style={{ accentColor: '#f59e0b', cursor: 'pointer' }}
              />
            </div>

            {/* IQ Slider */}
            <div className="flex flex-col gap-xs">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold flex items-center gap-xs text-violet-400">
                  <Brain size={14} /> IQ (Inteligencia)
                </span>
                <span className="font-extrabold">{iq}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={iq}
                onChange={(e) => setIq(Number(e.target.value))}
                style={{ accentColor: '#a78bfa', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* Card Preview Column */}
        <div style={{ position: 'sticky', top: 'calc(var(--nav-height) + var(--space-md))', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="card" style={{ padding: 'var(--space-md)', textAlign: 'center', background: 'var(--bg-surface)' }}>
            <span className="text-sm font-bold text-muted uppercase tracking-wider">Vista Previa Real</span>
          </div>

          <div style={{ width: '100%', position: 'relative' }}>
            <FutCard player={mockPlayer} isMvp={isMvp} id="fut-card-container" />
          </div>

          <div className="card" style={{ padding: 'var(--space-md)' }}>
            <div className="text-center text-xs text-muted mb-sm">
              Puntuación Promedio Calculada: <span className="font-bold text-primary">{calculatedTotalScore}</span> (Estilo FIFA)
            </div>
            <DownloadFutCardBtn targetId="fut-card-container" playerName={mockPlayer.name} />
          </div>
        </div>
      </div>
    </div>
  );
}
