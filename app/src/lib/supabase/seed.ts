import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local manually to keep it simple and dependency-free
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('No se encontró el archivo .env.local');
    process.exit(1);
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const env: Record<string, string> = {};
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      env[key] = val;
    }
  });

  return env;
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl.includes('your-project')) {
  console.error('ERROR: Por favor configura NEXT_PUBLIC_SUPABASE_URL en tu archivo .env.local');
  process.exit(1);
}

if (!supabaseAnonKey || supabaseAnonKey.includes('your-anon-key')) {
  console.error('ERROR: Por favor configura NEXT_PUBLIC_SUPABASE_ANON_KEY en tu archivo .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const players = [
  { name: 'Vito', defense: 6, attack: 7, fitness: 7 },
  { name: 'Andres', defense: 6, attack: 7, fitness: 6 },
  { name: 'Javi', defense: 6, attack: 7, fitness: 6 },
  { name: 'Gonzalo', defense: 7, attack: 4, fitness: 5 },
  { name: 'Toto', defense: 7, attack: 5, fitness: 6 },
  { name: 'Borja', defense: 8, attack: 7, fitness: 7 },
  { name: 'Nico', defense: 5, attack: 5, fitness: 4 },
  { name: 'Fernando', defense: 4, attack: 3, fitness: 6 },
  { name: 'Miky', defense: 6, attack: 6, fitness: 6 },
  { name: 'Andoni', defense: 5, attack: 6, fitness: 5 },
  { name: 'Edu', defense: 6, attack: 7, fitness: 7 },
  { name: 'Emi', defense: 8, attack: 6, fitness: 8 },
  { name: 'Ryan', defense: 7, attack: 5, fitness: 6 },
  { name: 'Victor', defense: 6, attack: 6, fitness: 7 },
  { name: 'Alex', defense: 6, attack: 8, fitness: 8 },
  { name: 'Seba', defense: 7, attack: 7, fitness: 7 },
  { name: 'Leo', defense: 6, attack: 6, fitness: 6 },
  { name: 'Jose uruguayo', defense: 7, attack: 6, fitness: 5 },
];

async function seed() {
  console.log(`Insertando ${players.length} jugadores en la base de datos...`);
  
  const { data, error } = await supabase
    .from('players')
    .insert(players.map(p => ({
      name: p.name,
      defense: p.defense,
      attack: p.attack,
      fitness: p.fitness,
      is_active: true
    })))
    .select();

  if (error) {
    console.error('Error al insertar jugadores:', error.message);
    process.exit(1);
  }

  console.log(`¡Éxito! Se insertaron ${data.length} jugadores.`);
}

seed();
