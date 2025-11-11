// Dies ist die Länge, die du später einfach ändern kannst (z.B. auf 16)
const PASSWORD_LENGTH = 8;

// Ein Pool sicherer Zeichen
const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Generiert ein sicheres, zufälliges Passwort.
 */
export function generateRandomPassword(): string {
    const array = new Uint32Array(PASSWORD_LENGTH);
    crypto.getRandomValues(array); // Nutzt den sicheren Zufallsgenerator des Browsers

    let password = '';
    for (let i = 0; i < PASSWORD_LENGTH; i++) {
        password += CHARS[array[i] % CHARS.length];
    }
    return password;
}