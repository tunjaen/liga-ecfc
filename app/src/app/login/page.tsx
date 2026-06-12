'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import type { Metadata } from 'next';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.');
      setLoading(false);
      return;
    }

    router.push('/admin');
    router.refresh();
  };

  return (
    <div className="page-content flex items-center justify-center" style={{ minHeight: '100vh' }}>
      <div className="card-glass animate-scale-in" style={{
        width: '100%',
        maxWidth: '400px',
        padding: 'var(--space-2xl)',
      }}>
        <div className="text-center mb-lg">
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(59, 130, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--space-md)',
          }}>
            <Lock size={24} color="var(--accent-primary)" />
          </div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-xs)' }}>
            Panel de Admin
          </h1>
          <p className="text-sm text-muted">
            Introduce tus credenciales para acceder
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-md">
          <div className="input-group">
            <label htmlFor="email" className="input-label">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="admin@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password" className="input-label">Contraseña</label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && <div className="error-text">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={loading}
            id="login-submit-btn"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="text-center mt-lg">
          <a href="/" className="text-sm text-muted" style={{ textDecoration: 'underline' }}>
            ← Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}
