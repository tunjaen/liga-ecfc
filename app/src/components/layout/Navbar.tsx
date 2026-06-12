'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Sun, Moon, MonitorPlay } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

const links = [
  { href: '/', label: 'Inicio' },
  { href: '/plantilla', label: 'Plantilla' },
  { href: '/partidos', label: 'Partidos' },
  { href: '/clasificacion', label: 'Clasificación' },
];

export function Navbar() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-logo">
          <span className="navbar-logo-icon">⚽</span>
          <span className="hide-mobile">Equipos Balanceados</span>
          <span className="hide-desktop">EB</span>
        </Link>

        <div className="navbar-links">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`navbar-link ${
                pathname === link.href ? 'active' : ''
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-sm">
          <a
            href="https://www.youtube.com/@elcocoloco123456"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-icon"
            title="Canal de YouTube"
            style={{ color: '#ef4444' }}
          >
            <MonitorPlay size={20} />
          </a>
          <button 
            onClick={toggleTheme} 
            className="btn btn-ghost btn-icon" 
            title="Cambiar tema"
            aria-label="Cambiar tema"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link
            href={isAdmin ? '/admin' : '/login'}
            className="navbar-admin-btn"
            id="admin-nav-btn"
          >
            <Shield size={16} />
            <span className="hide-mobile">Admin</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
