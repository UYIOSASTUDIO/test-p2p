// src/lib/supabaseClient.ts

// Wir nutzen die offizielle SvelteKit-Methode
import { createClient } from '@supabase/supabase-js'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

// Die Variablen werden direkt aus Vercel/Umgebung gelesen
export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY)