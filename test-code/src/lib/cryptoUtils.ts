// src/lib/cryptoUtils.ts

/**
 * Wandelt ein ArrayBuffer (aus der Crypto-API)
 * in einen speicherbaren Hex-String um.
 */
export function bufferToHex(buffer: ArrayBuffer): string {
    return [...new Uint8Array(buffer)]
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Erstellt einen SHA-256 Hash von einem Passwort-String.
 */
export async function hashPassword(password: string): Promise<string> {
    const data = new TextEncoder().encode(password); // Passwort in Daten umwandeln
    const hashBuffer = await crypto.subtle.digest('SHA-256', data); // Hashen
    return bufferToHex(hashBuffer); // In Hex-String umwandeln
}