'use client';

import { useEffect, useState } from 'react';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  heroImages: string[];
}

export function HeroSection({ title, subtitle, heroImages }: HeroSectionProps) {
  const [bgImage, setBgImage] = useState('/fondo-cabecera.avif');

  useEffect(() => {
    if (heroImages && heroImages.length > 0) {
      const randomIndex = Math.floor(Math.random() * heroImages.length);
      setBgImage(heroImages[randomIndex]);
    }
  }, [heroImages]);

  return (
    <section 
      className="hero" 
      id="hero-section"
      style={{
        position: 'relative',
        backgroundImage: `url("${bgImage}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        overflow: 'hidden',
        transition: 'background-image 0.5s ease-in-out'
      }}
    >
      {/* Capa oscura para asegurar que el texto sea legible sobre el fondo */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        zIndex: 0
      }} />
      
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 className="hero-title" style={{ color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          {title}
        </h1>
        <p className="hero-subtitle" style={{ color: 'rgba(255, 255, 255, 0.9)', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
          {subtitle}
        </p>
        <img 
          src="/escudo.png" 
          alt="Escudo ECFC" 
          style={{ 
            width: '120px', 
            height: 'auto', 
            marginTop: 'var(--space-md)',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))'
          }} 
        />
      </div>
    </section>
  );
}
