// src/+layout.svelte
<script lang="ts">
    import { session } from '$lib/session';
    import { supabase } from '$lib/supabaseClient';
    import { onMount } from 'svelte';
    import { goto, navigating } from '$app/navigation';
    import { page } from '$app/stores';

    let sessionLoaded = false;

    onMount(() => {
        // Initialer Check, falls der Benutzer den Browser geschlossen hat
        supabase.auth.getSession().then(({ data: { session: sessionData } }) => {
            handleAuthChange(null, sessionData);
        });

        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (_event, sessionData) => {
                handleAuthChange(_event, sessionData);
            }
        );

        async function handleAuthChange(_event: any, sessionData: any) {
            if (sessionData) {
                // BENUTZER IST EINGELOGGT

                // 1. Versuche, das Profil zu laden
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*') // Selektiere alle Spalten
                    .eq('id', sessionData.user.id)
                    .single();

                // 2. Setze den globalen Store
                session.set({
                    isLoggedIn: true,
                    user: sessionData.user,
                    profile: profile, // ist entweder 'null' oder das Profil
                });

                // 3. Routing-Logik
                const currentPage = $page.url.pathname;

                if (profile) {
                    // Profil existiert: Gehe zum Dashboard (außer wir sind schon da)
                    if (currentPage !== '/dashboard' && currentPage !== '/') {
                        goto('/dashboard');
                    }
                } else {
                    // PROFIL FEHLT: Zwinge ihn zur Profilerstellung
                    if (currentPage !== '/profile-setup' && currentPage !== '/') {
                        goto('/profile-setup');
                    }
                }
            } else {
                // BENUTZER IST AUSGELOGGT ODER FEHLGESCHLAGEN
                session.set({ isLoggedIn: false, user: null, profile: null });
                // Schicke ihn zur Login-Seite
                const currentPage = $page.url.pathname;
                if (currentPage !== '/' && currentPage !== '/profile-setup') {
                    goto('/');
                }
            }
            sessionLoaded = true;
        }

        return () => {
            authListener.subscription.unsubscribe();
        };
    });
</script>

{#if !sessionLoaded || navigating}
    <!-- Schöner Ladebildschirm, während wir die Session prüfen -->
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