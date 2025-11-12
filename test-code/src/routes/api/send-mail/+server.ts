// Datei: src/routes/api/send-email/+server.ts

import { Resend } from 'resend';
import { RESEND_API_KEY } from '$env/static/private'; // Holt den Key aus der .env Datei
import { json, error } from '@sveltejs/kit';

const resend = new Resend(RESEND_API_KEY);

export async function POST({ request }) {
    const { email, password } = await request.json();

    if (!email || !password) {
        throw error(400, 'E-Mail oder Passwort fehlt');
    }

    try {
        // HINWEIS: Zum Testen MUSS 'to: [email]' deine
        // verifizierte E-Mail-Adresse von Resend sein.
        const data = await resend.emails.send({
            from: 'P2P App <onboarding@resend.dev>', // Test-Absender von Resend
            to: [email], // Die E-Mail des Benutzers
            subject: 'Dein Passwort für die P2P App',
            html: `
        <h1>Willkommen!</h1>
        <p>Dein temporäres Passwort für die P2P App lautet:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">
          ${password}
        </p>
      `
        });

        console.log('E-Mail gesendet:', data);
        return json({ success: true });

    } catch (e) {
        console.error('Fehler beim Senden:', e);
        throw error(500, 'E-Mail konnte nicht gesendet werden.');
    }
}