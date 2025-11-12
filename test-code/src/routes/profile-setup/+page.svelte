<script lang="ts">
    import { session } from '$lib/session';
    import { supabase } from '$lib/supabaseClient';
    import { goto } from '$app/navigation';

    let usernameInput = '';
    let displayNameInput = '';
    let locationInput = '';
    let ageInput: number | null = null; // Bleibt null, wenn leer

    let error = '';
    let isLoading = false;

    const domainMap = {
        'hof-university.de': 'Hof University',
        'gmail.com': 'Unknown'
    };

    let placeOfStudy = 'Unknown';
    const userEmail = $session.user?.email;

    if (userEmail) {
        const domain = userEmail.split('@')[1];
        placeOfStudy = domainMap[domain.toLowerCase()] || 'Unknown';
    }

    async function handleCreateProfile() {
        // --- ÄNDERUNG HIER ---
        // 'ageInput' wurde aus der Pflichtfeld-Prüfung entfernt
        if (!usernameInput || !displayNameInput) {
            error = 'Bitte fülle alle Pflichtfelder aus (ID, Name).';
            return;
        }

        // --- ÄNDERUNG HIER --- (Alters-Check ist jetzt optional)
        if (ageInput !== null && ageInput < 18) {
            error = 'Du musst mindestens 18 Jahre alt sein (oder das Feld leer lassen).';
            return;
        }
        error = '';
        isLoading = true;

        try {
            const { error: insertError } = await supabase.from('profiles').insert({
                username: usernameInput,
                display_name: displayNameInput,
                location: locationInput || null,
                // --- ÄNDERUNG HIER ---
                // Sendet 'ageInput' (was eine Zahl oder null sein kann)
                age: ageInput,
                place_of_study: placeOfStudy
            });

            if (insertError) {
                if (insertError.code === '23505') {
                    error = 'Diese Benutzer-ID (username) ist bereits vergeben. Bitte wähle eine andere.';
                } else {
                    throw insertError;
                }
            } else {
                session.update(s => ({
                    ...s,
                    profile: {
                        username: usernameInput,
                        display_name: displayNameInput,
                        location: locationInput || undefined,
                        age: ageInput, // <-- Alter auf null setzen, falls nicht angegeben
                        place_of_study: placeOfStudy
                    }
                }));
                goto('/dashboard');
            }
        } catch (err) {
            console.error(err);
            error = 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.';
        }
        isLoading = false;
    }
</script>

<main>
    <h1>Willkommen!</h1>
    <p>Bitte vervollständige dein Profil, um fortzufahren.</p>

    <form on:submit|preventDefault class="profile-form">
        <label for="email">E-Mail (kann nicht geändert werden)</label>
        <input type="email" id="email" value={$session.user?.email || ''} disabled />

        <label for="placeOfStudy">Studienort (automatisch)</label>
        <input type="text" id="placeOfStudy" bind:value={placeOfStudy} disabled />

        <label for="username">Eindeutige Benutzer-ID*</label>
        <input type="text" id="username" bind:value={usernameInput} placeholder="z.B. elias_123" required />

        <label for="displayName">Anzeigename*</label>
        <input type="text" id="displayName" bind:value={displayNameInput} placeholder="Elias Schmolke" required />

        <!-- Das '*' (Pflichtfeld-Sternchen) wurde beim Alter entfernt -->
        <label for="age">Alter</label>
        <input type="number" id="age" bind:value={ageInput} placeholder="18" />

        <label for="location">Wohnort (Optional)</label>
        <input type="text" id="location" bind:value={locationInput} placeholder="Schwarzenbach a.d. Saale" />

        <button type="submit" on:click={handleCreateProfile} disabled={isLoading}>
            {#if isLoading}Speichert...{:else}Profil erstellen{/if}
        </button>

        {#if error}<p class="error">{error}</p>{/if}
    </form>
</main>

<!-- Styles (keine Änderung) -->
<style>
    main { font-family: sans-serif; max-width: 500px; margin: 2em auto; padding: 1em; }
    .profile-form { display: grid; gap: 1.2em; }
    label { text-align: left; font-size: 0.9em; font-weight: 500; }
    input { padding: 0.8em; font-size: 1em; border: 1px solid #ccc; border-radius: 4px; }
    input:disabled { background-color: #eee; color: #777; }
    button { font-size: 1.2em; padding: 0.8em; background-color: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; }
    button:disabled { background-color: #aaa; }
    .error { color: red; }
</style>