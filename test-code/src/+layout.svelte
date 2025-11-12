<script lang="ts">
    import { session } from '$lib/session';
    import { supabase } from '$lib/supabaseClient';
    import { onMount } from 'svelte';
    import { goto, navigating } from '$app/navigation';
    import { page } from '$app/stores';

    let sessionLoaded = false;

    // WICHTIG: Wir rufen die Logik sofort nach dem Initialisieren auf
    onMount(() => {
        // 1. Initialer Check, falls der Benutzer bereits eingeloggt ist (z.B. nach Browser-Neustart)
        // Wir rufen handleAuthChange einmal auf, um den Zustand zu synchronisieren.
        supabase.auth.getSession().then(({ data: { session: sessionData } }) => {
            handleAuthChange(null, sessionData);
            sessionLoaded = true; // Setze Loaded hier, da onMount nur einmal läuft
        });

        // 2. Auth Listener für Echtzeit-Änderungen (Login/Logout)
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (_event, sessionData) => {
                handleAuthChange(_event, sessionData);
            }
        );

        // Die Hauptlogik, die die Weiterleitung steuert
        async function handleAuthChange(_event: any, sessionData: any) {
            // Wenn das Token in der URL vorhanden ist (nach E-Mail-Klick), verarbeitet Supabase es automatisch.
            // Wir müssen nur prüfen, ob eine gültige Session existiert.

            if (sessionData) {
                // BENUTZER IST EINGELOGGT

                // 1. Versuche, das Profil zu laden
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', sessionData.user.id)
                    .single();

                // 2. Setze den globalen Store
                session.set({
                    isLoggedIn: true,
                    user: sessionData.user,
                    profile: profile,
                });

                // 3. Routing-Logik
                const currentPage = $page.url.pathname;

                if (profile) {
                    // PROFIL EXISTIERT: Gehe zum Dashboard
                    if (currentPage !== '/dashboard') {
                        goto('/dashboard');
                    }
                } else {
                    // PROFIL FEHLT: Zwinge ihn zur Profilerstellung
                    if (currentPage !== '/profile-setup') {
                        goto('/profile-setup');
                    }
                }
            } else {
                // BENUTZER IST AUSGELOGGT ODER FEHLGESCHLAGEN
                session.set({ isLoggedIn: false, user: null, profile: null });

                // Schicke ihn zur Login-Seite (wenn er nicht schon dort ist oder gerade einen Token verarbeitet)
                const currentPage = $page.url.pathname;
                if (currentPage !== '/') {
                    goto('/');
                }
            }
            // Wir müssen sessionLoaded hier NICHT auf false setzen, sonst würde es
            // immer kurz den Ladebildschirm zeigen, wenn der Benutzer eingeloggt ist.
        }

        return () => {
            authListener.subscription.unsubscribe();
        };
    });
</script>

{#if !sessionLoaded || navigating}
    <!-- Zeigt Ladebildschirm nur beim Start und während der Navigation -->
    <div class="loading-screen">
        <h1>Lädt...</h1>
    </div>
{:else}
    <!-- Der Inhalt der aktuellen Seite (z.B. Login, Dashboard...) -->
    <slot />
{/if}

<style>
    .loading-screen {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        font-family: sans-serif;
    }
</style>