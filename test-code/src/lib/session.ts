// src/lib/session.ts
import { writable } from 'svelte/store';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient'; // WICHTIG: Korrekter Import

// ... (Ihre Profile Interface bleibt gleich)

interface SessionState {
    isLoggedIn: boolean;
    user: User | null;
    profile: Profile | null; // ist entweder 'null' oder das Profil
}

const initialState: SessionState = {
    isLoggedIn: false,
    user: null,
    profile: null,
};

export const session = writable<SessionState>(initialState);

// KORRIGIERTE LOGOUT-FUNKTION
export async function logout() {
    await supabase.auth.signOut(); // <-- DIESE ZEILE HAT GEFEHLT!
    session.set(initialState);
}