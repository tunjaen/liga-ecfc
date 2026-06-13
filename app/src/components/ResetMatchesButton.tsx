'use client';

import { createClient } from '@/lib/supabase/client';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

export function ResetMatchesButton() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleReset = async () => {
    if (!window.confirm('¿Estás seguro de que quieres borrar TODOS los partidos, goles y estadísticas? Los jugadores se mantendrán.')) {
      return;
    }
    
    setLoading(true);
    try {
      // Fetch all matches to delete them
      const { data: matches } = await supabase.from('matches').select('id');
      
      if (matches && matches.length > 0) {
        const matchIds = matches.map(m => m.id);
        const { error } = await supabase.from('matches').delete().in('id', matchIds);
        
        if (error) throw error;
        alert('Partidos borrados correctamente. La base de datos está limpia.');
        window.location.reload();
      } else {
        alert('No hay partidos que borrar.');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleReset} 
      disabled={loading}
      className="btn btn-danger btn-sm"
      style={{ marginTop: 'var(--space-md)' }}
    >
      <Trash2 size={16} /> {loading ? 'Borrando...' : 'Reiniciar todos los partidos'}
    </button>
  );
}
