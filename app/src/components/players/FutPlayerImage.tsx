'use client';

import { useState } from 'react';

interface Props {
  playerName: string;
  defaultPhotoUrl?: string;
}

export function FutPlayerImage({ playerName, defaultPhotoUrl }: Props) {
  const [clicks, setClicks] = useState(0);
  const [isEasterEgg, setIsEasterEgg] = useState(false);
  
  // Detectar si el jugador es "Emi"
  const isEmi = playerName.trim().toLowerCase() === 'emi';

  const handleClick = () => {
    if (!isEmi || isEasterEgg) return;
    
    const newClicks = clicks + 1;
    setClicks(newClicks);
    
    if (newClicks >= 3) {
      setIsEasterEgg(true);
    }
  };

  return (
    <div 
      onClick={handleClick}
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        cursor: isEmi && !isEasterEgg ? 'pointer' : 'default'
      }}
    >
      {/* Imagen secreta (Emile) - Aparece con transición de 3 segundos */}
      {isEmi && (
        <img
          src="/emile.png"
          alt="Emile"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            opacity: isEasterEgg ? 1 : 0,
            transition: 'opacity 3s ease-in-out',
            zIndex: 2,
            pointerEvents: 'none', // Para que los clicks no interfieran
            borderBottom: '2px solid transparent'
          }}
        />
      )}

      {/* Imagen original - Desaparece suavemente */}
      <div style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        opacity: isEasterEgg ? 0 : 1,
        transition: 'opacity 3s ease-in-out',
        zIndex: 1
      }}>
        {defaultPhotoUrl ? (
          <img
            src={defaultPhotoUrl}
            alt={playerName}
            style={{ width: '100%', height: '100%', objectFit: 'contain', borderBottom: '2px solid transparent' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '4rem', color: '#000', opacity: 0.2, fontWeight: 900 }}>{playerName.charAt(0)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
