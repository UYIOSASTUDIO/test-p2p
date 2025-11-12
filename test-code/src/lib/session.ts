import { writable } from 'svelte/store';
import type { User } from '@supabase/supabase-js';

// Wir definieren, wie unser 'profiles'-Objekt aussieht
export interface Profile {
    username: string;
    display_name: string;
    location?: string;
    age: number;
    place_of_study: string;
}

interface SessionState {
    isLoggedIn: boolean;
    user: User | null;
    profile: Profile | null; // <-- HIER speichern wir die Profil-Daten
}

const initialState: SessionState = {
    isLoggedIn: false,
    user: null,
    profile: null,
};

export const session = writable<SessionState>(initialState);