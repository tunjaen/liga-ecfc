'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Users, Shuffle, ClipboardCheck, LayoutDashboard, LogOut } from 'lucide-react';

const sidebarLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/jugadores', label: 'Jugadores', icon: Users },
  { href: '/admin/matchmaker', label: 'Matchmaker', icon: Shuffle },
  { href: '/admin/registrar', label: 'Registrar Resultado', icon: ClipboardCheck },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="admin-layout">
      {/* Sidebar - Desktop */}
      <aside className="admin-sidebar" id="admin-sidebar">
        <div className="flex flex-col justify-between" style={{ height: '100%' }}>
          <div>
            <div className="text-xs text-muted font-semibold mb-md" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Administración
            </div>
            <nav className="admin-sidebar-links">
              {sidebarLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`admin-sidebar-link ${isActive ? 'active' : ''}`}
                    id={`admin-nav-${link.href.split('/').pop()}`}
                  >
                    <Icon size={18} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <button
            onClick={handleLogout}
            className="admin-sidebar-link"
            style={{ color: 'var(--accent-danger)' }}
            id="admin-logout-btn"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Mobile Admin Nav */}
      <div className="mobile-nav">
        {sidebarLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="mobile-nav-icon" />
              <span>{link.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="admin-content">
        {children}
      </div>
    </div>
  );
}
