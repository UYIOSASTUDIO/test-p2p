// src/lib/session.ts
import { writable } from 'svelte/store';
import type { User } from '@supabase/supabase-js';

// Wir definieren, wie unser 'profiles'-Objekt aussieht
export interface Profile {
    username: string;
    display_name: string;
    location?: string;
    age: number | null; // Erlaubt Null
    place_of_study: string;
}

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

// Muss hier neu definiert werden, da wir die alte db.ts gelöscht haben
export function logout() {
    supabase.auth.signOut();
    session.set(initialState);
}
// Wir müssen den supabase client im session store verfügbar machen
// Das ist ein kleiner Trick, da Svelte Stores sonst keinen Zugriff auf den Client haben
import { supabase } from './supabaseClient';