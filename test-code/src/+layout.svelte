<script lang="ts">
    import { session } from '$lib/session';
    import { supabase } from '$lib/supabaseClient';
    import { onMount } from 'svelte';
    import { goto, navigating } from '$app/navigation';
    import { page } from '$app/stores';

    let sessionLoaded = false;

    onMount(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (_event, sessionData) => {
                if (sessionData) {
                    // BENUTZER IST EINGELOGGT

                    // 1. Versuche, das Profil zu laden
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select()
                        .eq('id', sessionData.user.id)
                        .single();

                    // 2. Setze den globalen Store
                    session.set({
                        isLoggedIn: true,
                        user: sessionData.user,
                        profile: profile, // ist entweder 'null' oder das Profil
                    });

                    // 3. Routing-Logik
                    if (profile) {
                        // Profil existiert: Gehe zum Dashboard (außer wir sind schon da)
                        if ($page.route.id !== '/dashboard') {
                            goto('/dashboard');
                        }
                    } else {
                        // NEUER Benutzer: Zwinge ihn zur Profilerstellung
                        if ($page.route.id !== '/profile-setup') {
                            goto('/profile-setup');
                        }
                    }
                } else {
                    // BENUTZER IST AUSGELOGGT
                    session.set({ isLoggedIn: false, user: null, profile: null });
                    // Schicke ihn zur Login-Seite
                    if ($page.route.id !== '/') {
                        goto('/');
                    }
                }
                sessionLoaded = true;
            }
        );

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