'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Save, Trash2, Upload, Loader2, Settings } from 'lucide-react';
import type { AppSettings } from '@/lib/settings';

export default function ConfiguracionPage() {
  const supabase = createClient();
  const [settings, setSettings] = useState<AppSettings>({ title: '', subtitle: '', hero_images: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).single();
    if (data) {
      setSettings(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    const { error } = await supabase.from('app_settings').update({
      title: settings.title,
      subtitle: settings.subtitle,
      hero_images: settings.hero_images,
      updated_at: new Date().toISOString()
    }).eq('id', 1);

    if (error) {
      setMessage('Error al guardar: ' + error.message);
    } else {
      setMessage('✅ Ajustes guardados correctamente');
      setTimeout(() => setMessage(''), 3000);
    }
    setSaving(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    setMessage('');
    
    const files = Array.from(e.target.files);
    const newImages = [...settings.hero_images];
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `backgrounds/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('hero-images')
        .upload(filePath, file);
        
      if (uploadError) {
        setMessage('Error al subir imagen: ' + uploadError.message);
        continue;
      }
      
      const { data } = supabase.storage.from('hero-images').getPublicUrl(filePath);
      newImages.push(data.publicUrl);
    }
    
    setSettings({ ...settings, hero_images: newImages });
    setUploading(false);
    // Reset file input
    e.target.value = '';
  };

  const removeImage = (urlToRemove: string) => {
    // If the image is stored in our bucket, we could also delete the file using supabase.storage.from().remove()
    // but for simplicity, we just remove the URL from the array.
    setSettings({
      ...settings,
      hero_images: settings.hero_images.filter(url => url !== urlToRemove)
    });
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center' }}><Loader2 className="animate-spin" style={{ margin: '0 auto' }} /></div>;
  }

  return (
    <div className="page-content">
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="flex items-center gap-sm mb-lg">
          <Settings size={28} className="text-primary" />
          <h1 className="text-2xl font-bold">Configuración</h1>
        </div>
        
        {message && (
          <div className="mb-md" style={{ 
            padding: 'var(--space-md)', 
            borderRadius: 'var(--radius-md)', 
            backgroundColor: message.includes('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
            color: message.includes('Error') ? '#ef4444' : '#10b981',
            fontWeight: '500'
          }}>
            {message}
          </div>
        )}

        <div className="card mb-lg">
          <h2 className="text-xl font-semibold mb-md" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--space-sm)' }}>
            Página Principal (Cabecera)
          </h2>
          
          <div className="form-group mb-md">
            <label className="form-label">Título Principal</label>
            <input 
              type="text" 
              className="form-input" 
              value={settings.title}
              onChange={(e) => setSettings({...settings, title: e.target.value})}
              placeholder="Ej: ECFC"
            />
          </div>
          
          <div className="form-group mb-lg">
            <label className="form-label">Subtítulo</label>
            <input 
              type="text" 
              className="form-input" 
              value={settings.subtitle}
              onChange={(e) => setSettings({...settings, subtitle: e.target.value})}
              placeholder="Ej: La escusa para ir al Blue Moon"
            />
          </div>

          <h3 className="font-semibold mb-sm">Imágenes de Fondo Aleatorias</h3>
          <p className="text-sm text-muted mb-md">
            Sube fotos apaisadas. La web elegirá una al azar cada vez que alguien la visite.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
            {settings.hero_images.map((url, i) => (
              <div key={i} style={{ position: 'relative', aspectRatio: '16/9', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <img src={url} alt={`Fondo ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button 
                  onClick={() => removeImage(url)}
                  style={{ 
                    position: 'absolute', top: '8px', right: '8px', padding: '6px', 
                    background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', 
                    borderRadius: '50%', cursor: 'pointer', display: 'flex'
                  }}
                  title="Eliminar imagen"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            
            <label 
              style={{ 
                aspectRatio: '16/9', 
                borderRadius: 'var(--radius-md)', 
                border: '2px dashed var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                transition: 'background 0.2s',
                backgroundColor: 'rgba(255,255,255,0.02)'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
            >
              {uploading ? <Loader2 className="animate-spin mb-sm" /> : <Upload className="mb-sm" />}
              <span className="text-sm font-medium">{uploading ? 'Subiendo...' : 'Añadir imágenes'}</span>
              <span className="text-xs mt-xs opacity-70">JPG, PNG, WEBP</span>
              <input 
                type="file" 
                accept="image/*" 
                multiple
                onChange={handleImageUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border-color)' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleSave}
              disabled={saving}
              style={{ padding: '0.75rem 1.5rem' }}
            >
              {saving ? <Loader2 className="animate-spin mr-sm" size={18} /> : <Save className="mr-sm" size={18} />}
              Guardar Configuración
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
