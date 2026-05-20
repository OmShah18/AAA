(function() {
    // Synchronous auth check to prevent page flickering
    const path = window.location.pathname;
    const isLoginPage = path.includes('login');
    const hash = window.location.hash;
    
    // Allow OAuth callback redirects to be handled by supabase-integration.js
    const hasAuthTokens = hash && (hash.includes('access_token') || hash.includes('type=recovery') || hash.includes('type=signup'));
    if (hasAuthTokens) return;

    // Default Supabase settings
    const DEFAULT_SUPABASE_URL = "https://ksudtwyrmobmbvyubrvd.supabase.co";
    let currentSupabaseUrl = localStorage.getItem('ARDENT_SUPABASE_URL') || DEFAULT_SUPABASE_URL;
    
    let user = null;
    
    // Check Supabase Local Storage
    const projectRef = new URL(currentSupabaseUrl).hostname.split('.')[0];
    const localSessionKey = `sb-${projectRef}-auth-token`;
    const localSession = localStorage.getItem(localSessionKey);
    if (localSession) {
        try {
            user = JSON.parse(localSession).user;
        } catch (e) {}
    }
    
    // Check Mock Local Storage if no supabase user
    if (!user) {
        const offlineUser = localStorage.getItem('ARDENT_MOCK_USER');
        if (offlineUser) {
            try {
                user = JSON.parse(offlineUser);
            } catch (e) {}
        }
    }
    
    if (!user && !isLoginPage) {
        window.location.replace('login.html');
    } else if (user && isLoginPage) {
        window.location.replace('index.html');
    }
})();


// --- Speed Optimization: Lazy Load Database ---
// We load Supabase AFTER the window loads and initial GSAP animations start.
// This prevents the heavy 150KB database library from blocking the main thread
// and eliminates any jitter during the preloader/hero animations.
window.addEventListener('load', () => {
    setTimeout(() => {
        const script1 = document.createElement('script');
        script1.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
        script1.onload = () => {
            const script2 = document.createElement('script');
            script2.src = "supabase-integration.js";
            document.body.appendChild(script2);
        };
        document.body.appendChild(script1);
    }, 100);
});
