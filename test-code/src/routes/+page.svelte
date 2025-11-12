<script lang="ts">
    import { onMount } from 'svelte';
    import { session } from '$lib/session';
    import { supabase } from '$lib/supabaseClient'; // <-- NEU: Importiere Supabase
    import type { User } from '@supabase/supabase-js';

    // --- Konfiguration (Behalten wir bei!) ---
    const allowedDomains = ['hallo.de', 'moin.de', 'gmail.com'];
    // ---------------------

    let emailInput = '';
    let passwordInput = '';
    let currentView: 'login' | 'register' = 'login';
    let error = '';
    let infoMessage = ''; // Für Erfolgsmeldungen (z.B. "Check deine E-Mail")

    // === NEU: Beim Laden der Seite auf Session prüfen ===
    onMount(() => {
        // Diese Funktion prüft den Login-Status, wenn die Seite lädt
        // UND immer, wenn er sich ändert (z.B. nach Login/Logout).
        supabase.auth.onAuthStateChange((_event, sessionData) => {
            if (sessionData) {
                // Jemand ist eingeloggt!
                session.set({ isLoggedIn: true, user: sessionData.user });
            } else {
                // Niemand ist eingeloggt.
                session.set({ isLoggedIn: false, user: null });
            }
        });
    });

    function switchView(view: 'login' | 'register') {
        currentView = view;
        error = '';
        infoMessage = '';
        emailInput = '';
        passwordInput = '';
    }

    // === NEUE LOGOUT-FUNKTION ===
    async function handleLogout() {
        error = '';
        infoMessage = '';
        await supabase.auth.signOut();
        // onAuthStateChange wird den Rest erledigen.
    }

    // === NEUE REGISTRIERUNGS-FUNKTION ===
    async function handleRegister() {
        error = '';
        infoMessage = '';

        // 1. Domain-Check (deine Logik!)
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

        // 2. Passwort-Check
        if (passwordInput.length < 6) {
            error = 'Passwort muss mindestens 6 Zeichen lang sein.';
            return;
        }

        // 3. Supabase Registrierung
        const { data, error: authError } = await supabase.auth.signUp({
            email: emailInput,
            password: passwordInput,
        });

        if (authError) {
            error = authError.message;
        } else {
            // ERFOLG!
            infoMessage = 'Registrierung erfolgreich! Bitte prüfe deine E-Mails, um deinen Account zu bestätigen.';
            currentView = 'login'; // Wechsle zum Login-Tab
        }
    }

    // === NEUE LOGIN-FUNKTION ===
    async function handleLogin() {
        error = '';
        infoMessage = '';

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: emailInput,
                password: passwordInput,
            });

            if (authError) {
                error = authError.message;
            } else {
                // Erfolg! onAuthStateChange wird den Login-Status automatisch aktualisieren.
                // Wir müssen hier nichts weiter tun.
            }
        } catch (err) {
            error = 'Ein Fehler ist aufgetreten.';
            console.error(err);
        }
    }
</script>

<main>
    <h1>Willkommen zu deiner P2P-App</h1>

    <!-- $session.isLoggedIn kommt jetzt von onAuthStateChange -->
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

            <!-- Wir brauchen jetzt E-Mail UND Passwort für die Registrierung -->
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