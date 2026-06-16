import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { ThemeProvider } from '@/components/ThemeProvider';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Equipos Balanceados ⚽ | ECFC',
  description:
    'Plataforma de gestión y balanceo de equipos para fútbol amateur. Genera equipos equilibrados, consulta estadísticas, goleadores y clasificaciones.',
  keywords: ['fútbol', 'equipos', 'balanceo', 'amateur', 'estadísticas', 'matchmaker'],
  openGraph: {
    title: 'Equipos Balanceados ⚽ | ECFC ⚽',
    description: 'Datos, estadísticas y rendimiento dentro y fuera del campo',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body>
        <ThemeProvider>
          <Navbar />
          <main>{children}</main>
          <MobileNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
