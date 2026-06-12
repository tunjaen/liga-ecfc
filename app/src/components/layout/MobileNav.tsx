'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Calendar, Trophy } from 'lucide-react';

const items = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/plantilla', label: 'Plantilla', icon: Users },
  { href: '/partidos', label: 'Partidos', icon: Calendar },
  { href: '/clasificacion', label: 'Ranking', icon: Trophy },
];

export function MobileNav() {
  const pathname = usePathname();

  // Hide on admin pages
  if (pathname.startsWith('/admin') || pathname === '/login') {
    return null;
  }

  return (
    <nav className="mobile-nav" id="mobile-navbar">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon className="mobile-nav-icon" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
