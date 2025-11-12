<script lang="ts">
    import { session } from '$lib/session';
    import { supabase } from '$lib/supabaseClient';
    import { goto } from '$app/navigation';

    // Hole das Profil aus dem Store
    const profile = $session.profile;

    async function handleLogout() {
        await supabase.auth.signOut();
        // Das Layout (+layout.svelte) wird den Benutzer zu '/' weiterleiten
    }
</script>

<main>
    <h1>Willkommen, {$session.profile?.display_name}!</h1>
    <p>Du bist im Dashboard.</p>

    <h2>Dein Profil</h2>
    {#if profile}
        <ul>
            <li><strong>Benutzer-ID:</strong> {profile.username}</li>
            <li><strong>E-Mail:</strong> {$session.user?.email}</li>
            <li><strong>Alter:</strong> {profile.age}</li>
            <li><strong>Wohnort:</strong> {profile.location || 'Nicht angegeben'}</li>
            <li><strong>Studienort:</strong> {profile.place_of_study}</li>
        </ul>
    {:else}
        <p>Profil wird geladen...</p>
    {/if}

    <button on:click={handleLogout}>Ausloggen</button>
</main>

<style>
    main { font-family: sans-serif; max-width: 600px; margin: 2em auto; padding: 1em; }
    ul { list-style-type: none; padding: 0; }
    li { background-color: #f4f4f4; border: 1px solid #ddd; padding: 10px; margin-bottom: 5px; border-radius: 4px; }
    button { font-size: 1em; padding: 0.5em 1em; background-color: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 1em; }
</style>