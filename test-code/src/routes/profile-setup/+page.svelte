// src/routes/profile-setup/+page.svelte
<script lang="ts">
    import { session } from '$lib/session';
    import { supabase } from '$lib/supabaseClient';
    import { goto } from '$app/navigation';

    // States aus dem Session Store
    let user = $session.user;
    let email = user?.email || '';

    // Formular-Zustände
    let usernameInput = '';
    let displayNameInput = '';
    let ageInput: number | null = null; // Als Zahl oder null speichern
    let locationInput = '';
    let isLoading = false;
    let error = '';

    // Funktion zur Ableitung des Studienortes
    function determinePlaceOfStudy(email: string): string {
        const domain = email.split('@')[1];
        switch (domain) {
            case 'hof-university.de':
                return 'Hof University';
            case 'moin.de': // Beispiel
                return 'Hamburg University of Technology';
            default:
                return 'Unknown';
        }
    }

    const placeOfStudy = determinePlaceOfStudy(email);

    async function handleProfileCreation() {
        isLoading = true;
        error = '';

        // 1. Validierung
        if (usernameInput.length < 3 || displayNameInput.length < 3 || ageInput === null || ageInput <= 16) {
            error = 'Bitte fülle alle Pflichtfelder (außer Wohnort) korrekt aus. Alter muss > 16 sein.';
            isLoading = false;
            return;
        }

        // 2. Daten vorbereiten
        const newProfile = {
            id: user?.id, // Supabase ID vom eingeloggten Benutzer
            username: usernameInput.toLowerCase(), // Eindeutige ID (muss Kleinbuchstaben sein)
            display_name: displayNameInput,
            age: ageInput,
            location: locationInput || null, // Speichere null, wenn leer
            place_of_study: placeOfStudy,
        };

        // 3. In Supabase speichern
        // Wir nutzen 'insert' (da es das erste Mal ist)
        const { error: dbError } = await supabase
            .from('profiles')
            .insert([newProfile]);

        isLoading = false;

        if (dbError) {
            if (dbError.code === '23505') { // Code für Unique Constraint Violation
                error = 'Benutzer-ID (@' + usernameInput + ') ist bereits vergeben. Bitte wähle eine andere.';
            } else {
                error = 'Fehler beim Speichern des Profils. Bitte versuche es erneut.';
                console.error('DB Error:', dbError);
            }
            return;
        }

        // 4. Erfolg: Session aktualisieren und weiterleiten
        // Wir müssen die Session nicht manuell aktualisieren, da das Layout
        // den neuen Zustand beim nächsten Laden selbst erkennt.
        await goto('/dashboard');
    }
</script>

<main>
    <h1>Dein P2P-Profil erstellen</h1>
    <p>Dies sind deine öffentlichen Daten, die andere Benutzer sehen werden.</p>

    <form on:submit|preventDefault={handleProfileCreation}>
        <label for="display_name">Angezeigter Name (darf sich doppeln)</label>
        <input type="text" id="display_name" bind:value={displayNameInput} required disabled={isLoading} />

        <label for="username">@Benutzer-ID (muss eindeutig sein)</label>
        <input type="text" id="username" bind:value={usernameInput} placeholder="Einmalige ID (z.B. elias_h)" required disabled={isLoading} />

        <label for="age">Alter</label>
        <input type="number" id="age" bind:value={ageInput} required disabled={isLoading} min="16" />

        <label for="location">Wohnort (optional)</label>
        <input type="text" id="location" bind:value={locationInput} disabled={isLoading} />

        <div class="read-only-field">
            <label>E-Mail:</label>
            <span>{email}</span>
        </div>

        <div class="read-only-field">
            <label>Studienort:</label>
            <span>{placeOfStudy}</span>
        </div>

        {#if error}
            <p class="error">{error}</p>
        {/if}

        <button type="submit" disabled={isLoading}>
            {#if isLoading}Erstelle Profil...{:else}Profil erstellen{/if}
        </button>
    </form>
</main>

<style>
    main { font-family: sans-serif; max-width: 450px; margin: 2em auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
    form { display: grid; gap: 1em; }
    label { font-weight: bold; margin-top: 10px; }
    input { padding: 10px; border: 1px solid #ccc; border-radius: 4px; }
    .read-only-field { margin-top: 10px; padding: 10px; border: 1px solid #eee; border-radius: 4px; background-color: #f9f9f9; text-align: left; }
    .read-only-field span { font-weight: normal; display: block; margin-top: 5px; color: #555; }
    button { font-size: 1.2em; padding: 10px; background-color: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px; }
    button:disabled { background-color: #aaa; }
    .error { color: red; text-align: center; }
</style>