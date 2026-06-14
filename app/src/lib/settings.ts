import { createClient } from '@supabase/supabase-js';

export interface AppSettings {
  title: string;
  subtitle: string;
  hero_images: string[];
}

export async function getAppSettings(): Promise<AppSettings> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('app_settings')
      .select('title, subtitle, hero_images')
      .eq('id', 1)
      .single();

    if (error) {
      console.error('Error fetching app settings:', error);
      return { title: 'ECFC', subtitle: 'La escusa para ir al Blue Moon', hero_images: [] };
    }

    return {
      title: data.title || 'ECFC',
      subtitle: data.subtitle || 'La escusa para ir al Blue Moon',
      hero_images: data.hero_images || [],
    };
  } catch (error) {
    console.error('Failed to get app settings:', error);
    return { title: 'ECFC', subtitle: 'La escusa para ir al Blue Moon', hero_images: [] };
  }
}
