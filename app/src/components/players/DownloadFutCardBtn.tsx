'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { toPng } from 'html-to-image';

interface Props {
  targetId: string;
  playerName: string;
}

export function DownloadFutCardBtn({ targetId, playerName }: Props) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const element = document.getElementById(targetId);
      
      if (!element) {
        throw new Error('Card element not found');
      }

      const rect = element.getBoundingClientRect();
      
      // Generar PNG usando html-to-image asegurando que el fondo sea transparente
      // Pasamos el tamaño exacto y reseteamos el margin para evitar recortes en desktop
      const dataUrl = await toPng(element, { 
        backgroundColor: 'transparent',
        cacheBust: true, // Ayuda con imágenes externas como flagcdn
        pixelRatio: 2, // Para mayor calidad (Retina display)
        width: rect.width,
        height: rect.height,
        style: {
          margin: '0',
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          maxWidth: 'none',
          transform: 'none'
        }
      });

      // Crear un enlace virtual para forzar la descarga
      const link = document.createElement('a');
      link.download = `jugador-${playerName.toLowerCase().replace(/\s+/g, '-')}-fut.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error al descargar la carta:', err);
      alert('Hubo un problema al generar la imagen. Inténtalo de nuevo.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex justify-center mt-sm">
      <button 
        onClick={handleDownload} 
        disabled={isDownloading}
        className="btn btn-primary flex items-center gap-sm"
        style={{ width: '100%' }}
      >
        <Download size={20} />
        {isDownloading ? 'Generando imagen...' : 'Descargar Carta'}
      </button>
    </div>
  );
}
