import { writable } from 'svelte/store';
import type { User } from '@supabase/supabase-js';

// Definiere, wie ein "leerer" Zustand aussieht
interface SessionState {
    isLoggedIn: boolean;
    user: User | null; // Wir speichern jetzt das Supabase 'User'-Objekt
}

const initialState: SessionState = {
    isLoggedIn: false,
    user: null,
};

// Erstelle den Store
export const session = writable<SessionState>(initialState);

// Wir brauchen keine eigene logout-Funktion mehr,
// da Supabase das über "onAuthStateChange" in +page.svelte regelt.