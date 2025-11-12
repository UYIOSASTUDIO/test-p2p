<script lang="ts">
    import { onMount } from 'svelte';
    import { session } from '$lib/session';
    import { supabase } from '$lib/supabaseClient';
    import type { User } from '@supabase/supabase-js';

    // --- Konfiguration ---
    const allowedDomains = ['hallo.de', 'moin.de', 'gmail.com'];
    // ---------------------

    let emailInput = '';
    let passwordInput = '';
    let currentView: 'login' | 'register' = 'login';
    let error = '';
    let infoMessage = '';

    // === onMount (bleibt gleich) ===
    onMount(() => {
        supabase.auth.onAuthStateChange((_event, sessionData) => {
            if (sessionData) {
                session.set({ isLoggedIn: true, user: sessionData.user });
            } else {
                session.set({ isLoggedIn: false, user: null });
            }
        });
    });

    // === switchView (bleibt gleich) ===
    function switchView(view: 'login' | 'register') {
        currentView = view;
        error = '';
        infoMessage = '';
        emailInput = '';
        passwordInput = '';
    }

    // === handleLogout (bleibt gleich) ===
    async function handleLogout() {
        error = '';
        infoMessage = '';
        await supabase.auth.signOut();
    }

    // === HIER IST DIE VERBESSERTE REGISTRIERUNGS-FUNKTION ===
    async function handleRegister() {
        error = '';
        infoMessage = '';

        // 1. Domain-Check (bleibt gleich)
        try {
            const parts = emailInput.split('@');
            if (parts.length !== 2) throw new Error('Ungültige E-Mail');
            const domain = parts[1].toLowerCase();
            if (!allowedDomains.includes(domain)) {
                error = 'Diese E-Mail-Domain ist nicht berechtigt.';
                return;
            }
        } catch (e) {
            error = 'Ungültige E-Mail-Adresse.';
            return;
        }

        // 2. Passwort-Check (bleibt gleich)
        if (passwordInput.length < 6) {
            error = 'Passwort muss mindestens 6 Zeichen lang sein.';
            return;
        }

        // 3. Supabase Registrierung (mit NEUER Logik)
        const { data, error: authError } = await supabase.auth.signUp({
            email: emailInput,
            password: passwordInput,
        });

        if (authError) {
            // FALL 1: Ein echter Fehler ist aufgetreten
            // (z.B. "Password should be at least 6 characters")
            error = authError.message;

        } else if (data.user?.identities?.length === 0) {
            // FALL 2: KEIN Fehler, aber 'identities' ist ein leeres Array [].
            // Das ist die "Anti-Enumeration"-Antwort von Supabase.
            // Es bedeutet: "Dieser Benutzer existiert bereits und ist bestätigt."
            // Genau der Fall, den Sie beobachtet haben!
            error = 'Diese E-Mail-Adresse wurde schon benutzt. Bitte logge dich ein.';

        } else {
            // FALL 3: ERFOLG! Ein NEUER User wurde erstellt.
            // (data.user.identities ist NICHT leer)
            infoMessage = 'Registrierung erfolgreich! Bitte prüfe deine E-Mails, um deinen Account zu bestätigen.';
            currentView = 'login'; // Wechsle zum Login-Tab
        }
    }

    // === handleLogin (bleibt gleich) ===
    async function handleLogin() {
        error = '';
        infoMessage = '';

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: emailInput,
                password: passwordInput,
            });

            if (authError) {
                // Hier gibt Supabase einen klaren Fehler aus, das ist sicher
                error = 'Falsche E-Mail oder falsches Passwort.';
            }
            // Erfolg wird automatisch von onAuthStateChange behandelt

        } catch (err) {
            error = 'Ein Fehler ist aufgetreten.';
            console.error(err);
        }
    }
</script>

<!-- DEIN HTML- UND STYLE-TEIL BLEIBT EXAKT GLEICH -->
<main>
    <h1>Willkommen zu deiner P2P-App</h1>

    {#if $session.isLoggedIn}
        <h2>Eingeloggt als: {$session.user?.email}</h2>
        <p>Account auf dem Server verifiziert.</p>
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

            <form on:submit|preventDefault>
                <label for="email">E-Mail</label>
                <input
                        type="email"
                        id="email"
                        bind:value={emailInput}
                        placeholder="deine.email@hallo.de"
                />

                <label for="password">Passwort</label>
                <input
                        type="password"
                        id="password"
                        bind:value={passwordInput}
                        placeholder="Wähle ein sicheres Passwort..."
                />

                {#if currentView === 'login'}
                    <button type="submit" on:click={handleLogin}>Einloggen</button>
                {:else}
                    <button type="submit" on:click={handleRegister}>Registrieren</button>
                {/if}

                {#if error}
                    <p class="error">{error}</p>
                {/if}
                {#if infoMessage}
                    <p class="info">{infoMessage}</p>
                {/if}
            </form>
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
    .info {
        color: green;
    }
</style>