import { writable } from 'svelte/store';
import type { Identity } from '$lib/db';

// Dies ist der "Schreibtisch". Er speichert,
// wer *gerade jetzt* eingeloggt ist.

// Definiere, wie ein "leerer" Zustand aussieht
interface SessionState {
    isLoggedIn: boolean;
    identity: Identity | null;
}

const initialState: SessionState = {
    isLoggedIn: false,
    identity: null
};

// Erstelle den Store. Er ist "writable" (beschreibbar).
export const session = writable<SessionState>(initialState);

// Eine einfache Logout-Funktion, die den Store
// auf seinen Anfangszustand zurücksetzt.
export function logout() {
    session.set(initialState);
}