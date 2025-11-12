<script lang="ts">
    import { supabase } from '$lib/supabaseClient';

    // --- Configuration (Domain Check) ---
    const allowedDomains = ['hallo.de', 'moin.de', 'gmail.com'];
    // ------------------------------------

    let emailInput = '';
    let passwordInput = '';
    let currentView: 'login' | 'register' = 'login';
    let error = '';
    let infoMessage = '';
    let isLoading = false; // Loading status for buttons

    function switchView(view: 'login' | 'register') {
        currentView = view;
        error = '';
        infoMessage = '';
        emailInput = '';
        passwordInput = '';
    }

    async function handleRegister() {
        isLoading = true;
        error = '';
        infoMessage = '';

        try {
            // 1. Domain Check
            const parts = emailInput.split('@');
            if (parts.length !== 2) throw new Error('Invalid email');
            const domain = parts[1].toLowerCase();
            if (!allowedDomains.includes(domain)) {
                error = 'Diese E-Mail-Domain ist nicht berechtigt.';
                isLoading = false;
                return;
            }
        } catch (e) {
            error = 'Ungültige E-Mail-Adresse.';
            isLoading = false;
            return;
        }

        // 2. Password Check
        if (passwordInput.length < 6) {
            error = 'Passwort muss mindestens 6 Zeichen lang sein.';
            isLoading = false;
            return;
        }

        // 3. Supabase Registration
        const { data, error: authError } = await supabase.auth.signUp({
            email: emailInput,
            password: passwordInput,
        });

        if (authError) {
            if (authError.message.includes('User already registered')) {
                error = 'Diese E-Mail-Adresse wurde schon benutzt. Bitte logge dich ein.';
            } else {
                error = authError.message;
            }
        } else if (data.user?.identities?.length === 0) {
            // Anti-Enumeration check: User exists and is confirmed
            error = 'Diese E-Mail-Adresse wurde schon benutzt. Bitte logge dich ein.';
        } else {
            infoMessage = 'Registrierung erfolgreich! Bitte prüfe deine E-Mails, um deinen Account zu bestätigen.';
            currentView = 'login';
        }
        isLoading = false;
    }

    async function handleLogin() {
        isLoading = true;
        error = '';
        infoMessage = '';

        // Supabase will handle the login and the session listener in +layout.svelte will handle routing
        const { error: authError } = await supabase.auth.signInWithPassword({
            email: emailInput,
            password: passwordInput,
        });

        if (authError) {
            error = 'Falsche E-Mail oder falsches Passwort.';
        }
        isLoading = false;
    }
</script>

<main>
    <h1>Willkommen zu deiner P2P-App</h1>
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
            <input type="email" id="email" bind:value={emailInput} placeholder="deine.email@hallo.de" disabled={isLoading} />

            <label for="password">Passwort</label>
            <input type="password" id="password" bind:value={passwordInput} placeholder="Wähle ein sicheres Passwort..." disabled={isLoading} />

            {#if currentView === 'login'}
                <button type="submit" on:click={handleLogin} disabled={isLoading}>
                    {#if isLoading}Lädt...{:else}Einloggen{/if}
                </button>
            {:else}
                <button type="submit" on:click={handleRegister} disabled={isLoading}>
                    {#if isLoading}Registriere...{:else}Registrieren{/if}
                </button>
            {/if}

            {#if error}<p class="error">{error}</p>{/if}
            {#if infoMessage}<p class="info">{infoMessage}</p>{/if}
        </form>
    </div>
</main>

<style>
    main { font-family: sans-serif; max-width: 400px; margin: 2em auto; text-align: center; }
    .auth-container { border: 1px solid #ccc; border-radius: 8px; overflow: hidden; }
    nav { display: flex; }
    nav button { flex: 1; padding: 1em; font-size: 1em; background-color: #eee; border: none; cursor: pointer; border-bottom: 1px solid #ccc; }
    nav button.active { background-color: #fff; border-bottom-color: transparent; }
    form { padding: 2em; display: grid; gap: 1em; }
    form label { text-align: left; margin-bottom: -0.5em; font-size: 0.9em; }
    input { padding: 0.8em; font-size: 1em; border: 1px solid #ccc; border-radius: 4px; }
    button[type="submit"] { font-size: 1.2em; padding: 0.5em 1em; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 1em; }
    button:disabled { background-color: #aaa; }
    .error { color: red; }
    .info { color: green; }
</style>