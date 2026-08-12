'use client';

import { useState, useRef } from 'react';

interface Props {
  playerName: string;
  defaultPhotoUrl?: string;
}

export function FutPlayerImage({ playerName, defaultPhotoUrl }: Props) {
  const [clicks, setClicks] = useState(0);
  const [isEasterEgg, setIsEasterEgg] = useState(false);
  const nicoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const normalizedName = playerName.trim().toLowerCase();
  const isEmi = normalizedName === 'emi';
  const isToto = normalizedName === 'toto';
  const isNico = normalizedName === 'nico';

  const handleClick = () => {
    if ((!isEmi && !isToto) || isEasterEgg) return;
    
    const newClicks = clicks + 1;
    setClicks(newClicks);
    
    if (newClicks >= 3) {
      setIsEasterEgg(true);
    }
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isNico || isEasterEgg) return;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const xRatio = x / rect.width;
    const yRatio = y / rect.height;

    // Proporciones del cuello en imagen 317x317 (X: 120-197, Y: 216-263)
    const minX = 120 / 317;
    const maxX = 197 / 317;
    const minY = 216 / 317;
    const maxY = 263 / 317;

    if (xRatio >= minX && xRatio <= maxX && yRatio >= minY && yRatio <= maxY) {
      nicoTimeoutRef.current = setTimeout(() => {
        setIsEasterEgg(true);
      }, 10000);
    }
  };

  const cancelNicoTimer = () => {
    if (nicoTimeoutRef.current) {
      clearTimeout(nicoTimeoutRef.current);
      nicoTimeoutRef.current = null;
    }
  };

  // Determinar qué imagen mostrar si el easter egg está activo
  let easterEggImage = '';
  if (isEmi) easterEggImage = '/emile.png';
  if (isToto) easterEggImage = '/toto2.png';
  if (isNico) easterEggImage = '/nico2.png';

  const isClickable = (isEmi || isToto) && !isEasterEgg;

  return (
    <div 
      onClick={handleClick}
      onMouseDown={handlePointerDown}
      onMouseUp={cancelNicoTimer}
      onMouseLeave={cancelNicoTimer}
      onTouchStart={handlePointerDown}
      onTouchEnd={cancelNicoTimer}
      onTouchCancel={cancelNicoTimer}
      onContextMenu={(e) => { if (isNico) e.preventDefault(); }} // Evitar menú contextual en móvil al mantener presionado
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        cursor: isClickable ? 'pointer' : 'default',
        userSelect: isNico ? 'none' : 'auto', // Evita selección de texto al mantener presionado
        WebkitUserSelect: isNico ? 'none' : 'auto',
        WebkitTouchCallout: isNico ? 'none' : 'default' // Evitar menú de imagen en iOS Safari
      }}
    >
      {/* Imagen secreta - Aparece con transición de 3 segundos */}
      {(isEmi || isToto || isNico) && (
        <img
          src={easterEggImage}
          alt={`${playerName} easter egg`}
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
        zIndex: 1,
        pointerEvents: isEasterEgg ? 'none' : 'auto'
      }}>
        {defaultPhotoUrl ? (
          <img
            src={defaultPhotoUrl}
            alt={playerName}
            draggable={!isNico} // Evitar que la imagen se arrastre en vez de mantener click
            style={{ width: '100%', height: '100%', objectFit: 'contain', borderBottom: '2px solid transparent' }}
          />
        ) : (
          <img
            src="/default-player.png"
            alt={playerName}
            draggable={!isNico}
            style={{ width: '100%', height: '100%', objectFit: 'contain', borderBottom: '2px solid transparent' }}
          />
        )}
      </div>
    </div>
  );
}
