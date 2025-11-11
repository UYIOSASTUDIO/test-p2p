import Dexie, { type Table } from 'dexie';

// SCHRITT 1: Ändere die Schnittstelle
export interface Identity {
    email: string; // 'email' ist jetzt der primäre Schlüssel
    privateKey: CryptoKey;
    publicKey: CryptoKey;
    passwordHash: string;
}

export class MyDatabase extends Dexie {
    // 'name' ist jetzt der Primärschlüssel (string), nicht 'id' (number)
    identity!: Table<Identity, string>;

    constructor() {
        super('myP2PDatabase');
        this.version(1).stores({
            // SCHRITT 2: Ändere die Definition
            // '&name' bedeutet: 'name' ist der primäre Schlüssel
            // UND er muss eindeutig (unique) sein.
            identity: '&email'
        });
    }
}

export const db = new MyDatabase();