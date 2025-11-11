<script lang="ts">
    import { db } from '$lib/db';
    import { session, logout } from '$lib/session';
    import { generateRandomPassword } from '$lib/utils'; // <-- NEU
    import { hashPassword, bufferToHex } from '$lib/cryptoUtils'; // <-- (Wir müssen hashPassword auch auslagern)

    // --- Konfiguration ---
    const allowedDomains = ['hallo.de', 'moin.de', 'gmail.com'];
    // ---------------------

    let emailInput = '';
    let passwordInput = '';
    let currentView: 'login' | 'register' = 'login';
    let error = '';

    // NEUER STATUS für die Registrierung
    let registrationStep: 'email' | 'password' = 'email';
    let tempGeneratedPassword = ''; // <-- Speichert das Passwort, das wir "senden" würden

    // --- Helfer-Funktionen ---
    // (Ich habe hashPassword und bufferToHex in eine neue Datei
    // src/lib/cryptoUtils.ts verschoben, um es sauber zu halten.
    // Du kannst sie auch hier lassen, wenn du willst.)

    // (Bitte erstelle src/lib/cryptoUtils.ts und füge die
    // bufferToHex und hashPassword Funktionen von letztem Mal dort ein)

    function switchView(view: 'login' | 'register') {
        currentView = view;
        error = '';
        emailInput = '';
        passwordInput = '';
        registrationStep = 'email'; // <-- NEU: Registrierung zurücksetzen
    }

    function handleLogout() {
        logout();
        emailInput = '';
        passwordInput = '';
        error = '';
        currentView = 'login';
        registrationStep = 'email'; // <-- NEU: Registrierung zurücksetzen
    }

    // === NEUE "APPLY"-FUNKTION (SCHRITT 1 der Registrierung) ===
    async function handleApplyForRegistration() {
        error = '';

        // 1. Domain-Check
        try {
            const parts = emailInput.split('@');
            if (parts.length !== 2) throw new Error();
            const domain = parts[1].toLowerCase();

            if (!allowedDomains.includes(domain)) {
                error = 'Diese E-Mail-Domain ist nicht zur Registrierung berechtigt.';
                return;
            }
        } catch (e) {
            error = 'Ungültige E-Mail-Adresse.';
            return;
        }

        // 2. Prüfen, ob E-Mail bereits existiert
        const existing = await db.identity.get(emailInput.toLowerCase());
        if (existing) {
            error = 'E-Mail bereits registriert. Bitte logge dich ein.';
            return;
        }

        // 3. Passwort generieren
        tempGeneratedPassword = generateRandomPassword();

        // --- HIER KOMMT DER SERVER-TEIL ---
        // In der ZUKUNFT:
        // await fetch('/api/send-password', {
        //   method: 'POST',
        //   body: JSON.stringify({
        //     email: emailInput,
        //     password: tempGeneratedPassword
        //   })
        // });

        // FÜR UNSEREN TEST (Wir tun nur so, als ob wir senden):
        console.log(`(TEST) Sende Passwort an ${emailInput}: ${tempGeneratedPassword}`);
        alert(`(TEST) Dein Passwort (aus der Konsole) ist: ${tempGeneratedPassword}`);

        // 4. Zur Passworteingabe wechseln
        registrationStep = 'password';
    }

    // === REGISTRIERUNGS-FUNKTION (SCHRITT 2) ===
    // Diese Funktion wird jetzt vom "Passwort"-Feld aufgerufen
    async function handleCompleteRegistration() {
        error = '';

        // 1. Prüfen, ob das eingegebene Passwort mit dem generierten übereinstimmt
        if (passwordInput !== tempGeneratedPassword) {
            error = 'Das eingegebene Passwort ist falsch.';
            return;
        }

        // 2. Passwort-Check (Mindestlänge)
        if (passwordInput.length < 8) { // Wir nutzen die Länge aus utils
            error = 'Passwort ist zu kurz (Sollte nicht passieren).';
            return;
        }

        try {
            // 3. Passwort hashen (Das "echte" Passwort)
            const passwordHash = await hashPassword(passwordInput);

            // 4. Schlüssel generieren
            const keyPair = await crypto.subtle.generateKey(
                { name: 'ECDSA', namedCurve: 'P-384' }, true, ['sign', 'verify']
            );

            const newIdentity = {
                email: emailInput.toLowerCase(),
                privateKey: keyPair.privateKey,
                publicKey: keyPair.publicKey,
                passwordHash: passwordHash
            };

            // 5. In DB speichern
            await db.identity.add(newIdentity);

            // 6. Session setzen
            session.set({ isLoggedIn: true, identity: newIdentity });

            // 7. Aufräumen
            tempGeneratedPassword = '';
            passwordInput = '';
            registrationStep = 'email';

        } catch (err) {
            error = 'Konto konnte nicht erstellt werden (evtl. Race-Condition).';
            console.error(err);
        }
    }

    // === LOGIN-FUNKTION (BLEIBT GLEICH) ===
    async function handleLogin() {
        error = '';
        try {
            const foundIdentity = await db.identity.get(emailInput.toLowerCase());
            if (foundIdentity) {
                const inputHash = await hashPassword(passwordInput);
                if (inputHash === foundIdentity.passwordHash) {
                    session.set({ isLoggedIn: true, identity: foundIdentity });
                } else {
                    error = 'Falsche E-Mail oder falsches Passwort.';
                }
            } else {
                error = 'Falsche E-Mail oder falsches Passwort.';
            }
        } catch (err) {
            error = 'Ein Fehler ist aufgetreten.';
            console.error(err);
        }
    }
</script>

<main>
    <h1>Willkommen zu deiner P2P-App</h1>

    {#if $session.isLoggedIn}

        <h2>Eingeloggt als: {$session.identity?.email}</h2>
        <button on:click={handleLogout}>Ausloggen</button>

    {:else}

        <div class="auth-container">
            <nav>
                <button on:click={() => switchView('login')} class:active={currentView === 'login'}>
                    Login
                </button>
                <button on:click={() => switchView('register')} class:active={currentView === 'register'}>
                    Registrieren
                </button>
            </nav>

            {#if currentView === 'login'}

                <form on:submit|preventDefault>
                    <label for="email">E-Mail</label>
                    <input type="email" id="email" bind:value={emailInput} />

                    <label for="password">Passwort</label>
                    <input type="password" id="password" bind:value={passwordInput} />

                    <button type="submit" on:click={handleLogin}>Einloggen</button>
                    {#if error}<p class="error">{error}</p>{/if}
                </form>

            {:else}

                <form on:submit|preventDefault>
                    <label for="email">E-Mail</label>
                    <input
                            type="email"
                            id="email"
                            bind:value={emailInput}
                            placeholder="deine.email@hallo.de"
                            disabled={registrationStep === 'password'}
                    />

                    {#if registrationStep === 'email'}
                        <button type="submit" on:click={handleApplyForRegistration}>Bewerben</button>
                    {:else}
                        <label for="password">Passwort (aus E-Mail)</label>
                        <input
                                type="password"
                                id="password"
                                bind:value={passwordInput}
                                placeholder="Passwort aus deiner E-Mail..."
                        />
                        <button type="submit" on:click={handleCompleteRegistration}>Registrieren</button>
                    {/if}

                    {#if error}<p class="error">{error}</p>{/if}
                </form>

            {/if}
        </div>
    {/if}
</main>

<style>
    main {
        font-family: sans-serif;
        max-width: 400px;
        margin: 2em auto;
        text-align: center;
    }
    .auth-container {
        border: 1px solid #ccc;
        border-radius: 8px;
        overflow: hidden;
    }
    nav {
        display: flex;
    }
    nav button {
        flex: 1;
        padding: 1em;
        font-size: 1em;
        background-color: #eee;
        border: none;
        cursor: pointer;
        border-bottom: 1px solid #ccc;
    }
    nav button.active {
        background-color: #fff;
        border-bottom-color: transparent;
    }
    form {
        padding: 2em;
        display: grid;
        gap: 1em;
    }
    form label {
        text-align: left;
        margin-bottom: -0.5em;
        font-size: 0.9em;
    }
    input {
        padding: 0.8em;
        font-size: 1em;
        border: 1px solid #ccc;
        border-radius: 4px;
    }
    input:disabled {
        background-color: #eee;
    }
    button[type="submit"] {
        font-size: 1.2em;
        padding: 0.5em 1em;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        margin-top: 1em;
    }
    .error {
        color: red;
    }
</style>