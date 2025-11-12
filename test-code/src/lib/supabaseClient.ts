// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'
// Präfix zu VITE_PUBLIC_ geändert, um Vercel/Vite zu beruhigen
import { VITE_PUBLIC_SUPABASE_URL, VITE_PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

export const supabase = createClient(VITE_PUBLIC_SUPABASE_URL, VITE_PUBLIC_SUPABASE_ANON_KEY)