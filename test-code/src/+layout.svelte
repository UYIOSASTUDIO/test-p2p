<script lang="ts">
    import { session } from '$lib/session';
    import { supabase } from '$lib/supabaseClient';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { get } from 'svelte/store';

    let sessionLoaded = false;

    onMount(() => {
        // 1. Initialer Check nach Laden
        supabase.auth.getSession().then(({ data: { session: sessionData } }) => {
            handleAuthChange(null, sessionData);
        }).finally(() => {
            sessionLoaded = true;
        });

        // 2. Listener für Echtzeit Login/Logout
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (_event, sessionData) => {
                handleAuthChange(_event, sessionData);
            }
        );

        // Cleanup
        return () => {
            authListener.subscription.unsubscribe();
        };
    });

    async function handleAuthChange(_event: any, sessionData: any) {

        const currentPage = get(page).url.pathname;

        if (sessionData) {
            // Benutzer eingeloggt → Profil abrufen
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', sessionData.user.id)
                .single();

            session.set({
                isLoggedIn: true,
                user: sessionData.user,
                profile
            });

            // Routing: hat Profil → Dashboard, sonst Profile-Setup
            if (profile) {
                if (currentPage !== '/dashboard') {
                    goto('/dashboard');
                }
            } else {
                if (currentPage !== '/profile-setup') {
                    goto('/profile-setup');
                }
            }

        } else {
            // Benutzer ausgeloggt
            session.set({ isLoggedIn: false, user: null, profile: null });

            if (currentPage !== '/') {
                goto('/');
            }
        }
    }
</script>

{#if !sessionLoaded}
    <div class="loading-screen">
        <h1>Lädt...</h1>
    </div>
{:else}
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
