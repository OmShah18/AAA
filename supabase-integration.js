/* ═══════════════════════════════════════════════
   SUPABASE INTEGRATION — Core Javascript Engine
   ═══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    // ─── CONFIGURATION DEFAULTS ───
    // These are placeholders that can be replaced in code, or overwritten in the browser settings modal.
    const DEFAULT_SUPABASE_URL = "https://ksudtwyrmobmbvyubrvd.supabase.co";
    const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzdWR0d3lybW9ibWJ2eXVicnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNjQ4MTAsImV4cCI6MjA5NDg0MDgxMH0.Hh0OvzLkQ_DdSrCxPYb_ycLctP4uDxzOXWxbDBvKaPY";

    // Load credentials from localStorage or defaults
    let currentSupabaseUrl = localStorage.getItem('ARDENT_SUPABASE_URL') || DEFAULT_SUPABASE_URL;
    let currentSupabaseAnonKey = localStorage.getItem('ARDENT_SUPABASE_ANON_KEY') || DEFAULT_SUPABASE_ANON_KEY;

    let supabaseClient = null;
    let isOfflineMode = true;

    // ─── INITIALIZE CLIENT ───
    function initSupabase() {
        if (typeof supabase !== 'undefined' && currentSupabaseUrl && currentSupabaseAnonKey) {
            try {
                // The global window.supabase has a createClient method
                supabaseClient = supabase.createClient(currentSupabaseUrl, currentSupabaseAnonKey);
                isOfflineMode = false;
                console.log('Supabase Initialized: CONNECTED MODE');
            } catch (err) {
                console.warn('Failed to initialize Supabase, running in OFFLINE mode:', err);
                supabaseClient = null;
                isOfflineMode = true;
            }
        } else {
            console.log('Supabase credentials missing, running in OFFLINE/MOCK mode');
            supabaseClient = null;
            isOfflineMode = true;
        }
        updateDevBadge();
    }

    // ─── NOTIFICATION TOAST ENGINE ───
    function showToast(title, message, type = 'info', duration = 5000) {
        // Create container if it doesn't exist
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        let iconMarkup = '';
        if (type === 'success') {
            iconMarkup = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        } else if (type === 'error') {
            iconMarkup = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
        } else {
            iconMarkup = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
        }

        toast.innerHTML = `
            <div class="toast-icon">${iconMarkup}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        `;

        container.appendChild(toast);

        // Animate using GSAP if available, otherwise CSS fallback
        setTimeout(() => {
            toast.classList.add('active');
        }, 50);

        const closeToast = () => {
            toast.classList.remove('active');
            setTimeout(() => {
                toast.remove();
            }, 600);
        };

        toast.querySelector('.toast-close').addEventListener('click', closeToast);

        // Auto destroy
        setTimeout(closeToast, duration);
    }

    // ─── AUTHENTICATION STATE TRACKER ───
    function getLoggedInUser() {
        if (!isOfflineMode && supabaseClient) {
            // Check active session from Supabase
            // Note: In Supabase v2, auth.getSession() is asynchronous, 
            // but we can check if it's cached in localStorage by Supabase
            const localSessionKey = `sb-${new URL(currentSupabaseUrl).hostname}-auth-token`;
            const localSession = localStorage.getItem(localSessionKey);
            if (localSession) {
                try {
                    const parsed = JSON.parse(localSession);
                    return parsed.user;
                } catch (e) {
                    return null;
                }
            }
        } else {
            // Local Offline session check
            const offlineUser = localStorage.getItem('ARDENT_MOCK_USER');
            if (offlineUser) {
                try {
                    return JSON.parse(offlineUser);
                } catch (e) {
                    return null;
                }
            }
        }
        return null;
    }

    // ─── DEVELOPER CONFIG MODAL & FLOATING BADGE ───
    function createDevUI() {
        // Floating badge
        const badge = document.createElement('div');
        badge.className = 'dev-config-badge hover-target';
        badge.id = 'devConfigBadge';
        badge.innerHTML = `
            <span class="dev-status-dot"></span>
            <span class="dev-badge-text">Supabase Config</span>
        `;
        document.body.appendChild(badge);

        // Glassmorphic Developer configuration modal
        const modal = document.createElement('div');
        modal.className = 'dev-modal-overlay';
        modal.id = 'devConfigModal';
        modal.innerHTML = `
            <div class="dev-modal-panel">
                <div class="dev-modal-header">
                    <h3 class="dev-modal-title">Supabase Database Panel</h3>
                    <button class="dev-modal-close" id="devModalCloseBtn">&times;</button>
                </div>
                <div class="dev-modal-body">
                    <div class="dev-tabs">
                        <button class="dev-tab active" data-tab="credentials">API Connection</button>
                        <button class="dev-tab" data-tab="sql">Database Setup (SQL)</button>
                    </div>

                    <!-- TAB 1: CREDENTIALS -->
                    <div class="dev-tab-content active" id="tab-credentials">
                        <p class="dev-help-text">
                            Connect your own database! Grab these from your Supabase Dashboard under <strong>Settings > API</strong>. If not connected, the website automatically falls back to local storage offline database simulation.
                        </p>
                        
                        <div class="dev-field-group">
                            <label class="dev-field-label" for="devUrl">Supabase URL</label>
                            <input class="dev-input" type="url" id="devUrl" placeholder="https://your-project-ref.supabase.co" value="${currentSupabaseUrl}">
                        </div>

                        <div class="dev-field-group">
                            <label class="dev-field-label" for="devKey">Supabase Anon Key</label>
                            <input class="dev-input" type="password" id="devKey" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." value="${currentSupabaseAnonKey}">
                        </div>

                        <div id="connectionStatus" style="font-family: var(--font-body); font-size: 0.78rem; font-weight: 500; display: none;"></div>
                    </div>

                    <!-- TAB 2: SQL SCHEMA -->
                    <div class="dev-tab-content" id="tab-sql">
                        <p class="dev-help-text">
                            Execute this SQL code in your Supabase project's <strong>SQL Editor</strong> to instantly create the comments table and configure public permissions:
                        </p>
                        <pre class="dev-sql-code">
-- Create the comments table
create table comments (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  blog_id text not null,
  name text not null,
  email text not null,
  website text,
  content text not null,
  user_id uuid
);

-- Enable RLS
alter table comments enable row level security;

-- Set up security policies
create policy "Allow anyone to read comments"
  on comments for select
  using (true);

create policy "Allow anyone to insert comments"
  on comments for insert
  with check (true);
                        </pre>
                        <button class="btn-dev-secondary" id="btnCopySql" style="align-self: flex-start;">Copy to Clipboard</button>
                    </div>
                </div>
                <div class="dev-modal-footer">
                    <button class="btn-dev-secondary" id="btnDisconnectDb">Disconnect</button>
                    <button class="btn-dev-primary" id="btnConnectDb">Connect & Save</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Bind events
        badge.addEventListener('click', () => {
            modal.classList.add('active');
            updateConnectionTestUI();
        });

        document.getElementById('devModalCloseBtn').addEventListener('click', () => {
            modal.classList.remove('active');
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });

        // Tabs logic
        const tabs = modal.querySelectorAll('.dev-tab');
        const tabContents = modal.querySelectorAll('.dev-tab-content');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
            });
        });

        // Copy SQL logic
        document.getElementById('btnCopySql').addEventListener('click', () => {
            const sqlText = modal.querySelector('.dev-sql-code').textContent;
            navigator.clipboard.writeText(sqlText).then(() => {
                showToast('SQL Copied', 'The database schema SQL code was copied to your clipboard.', 'success');
            });
        });

        // Save & Connect logic
        document.getElementById('btnConnectDb').addEventListener('click', async () => {
            const urlInput = document.getElementById('devUrl').value.trim();
            const keyInput = document.getElementById('devKey').value.trim();
            const statusDiv = document.getElementById('connectionStatus');
            const saveBtn = document.getElementById('btnConnectDb');

            if (!urlInput || !keyInput) {
                showToast('Inputs Required', 'Please supply both the URL and Key.', 'error');
                return;
            }

            saveBtn.disabled = true;
            saveBtn.innerHTML = `<span class="spinner-btn-loader"></span>Connecting...`;

            try {
                // Test connection
                const testClient = supabase.createClient(urlInput, keyInput);

                // Simple query to verify auth/keys
                const { error } = await testClient.from('comments').select('count', { count: 'exact', head: true });

                // Note: a 404/400 table error actually means we connected, but table schema is not created.
                // An auth/key error is usually code 401 or network fail.
                if (error && error.message.includes('apiKey')) {
                    throw new Error('Invalid Anon Key API credentials');
                }

                // If we get here, connection parameters are valid!
                localStorage.setItem('ARDENT_SUPABASE_URL', urlInput);
                localStorage.setItem('ARDENT_SUPABASE_ANON_KEY', keyInput);
                currentSupabaseUrl = urlInput;
                currentSupabaseAnonKey = keyInput;

                initSupabase();
                showToast('Database Connected', 'Connected to Supabase successfully!', 'success');
                modal.classList.remove('active');

                // Reload comment listings/forms dynamically
                loadCommentsSection();
                updateLoginStateUI();

            } catch (err) {
                console.error(err);
                statusDiv.style.color = '#e63226';
                statusDiv.style.display = 'block';
                statusDiv.textContent = `Connection failure: ${err.message || 'Check credentials/network'}. You can still save these credentials anyway or use SQL template.`;

                // Still allow saving to ease configuration for users creating schema afterwards
                localStorage.setItem('ARDENT_SUPABASE_URL', urlInput);
                localStorage.setItem('ARDENT_SUPABASE_ANON_KEY', keyInput);
                currentSupabaseUrl = urlInput;
                currentSupabaseAnonKey = keyInput;
                initSupabase();

                showToast('Credentials Saved', 'Credentials saved locally, but database test failed (Is the schema created?).', 'success');
            } finally {
                saveBtn.disabled = false;
                saveBtn.innerHTML = 'Connect & Save';
            }
        });

        // Disconnect logic
        document.getElementById('btnDisconnectDb').addEventListener('click', () => {
            localStorage.removeItem('ARDENT_SUPABASE_URL');
            localStorage.removeItem('ARDENT_SUPABASE_ANON_KEY');
            currentSupabaseUrl = "";
            currentSupabaseAnonKey = "";
            document.getElementById('devUrl').value = "";
            document.getElementById('devKey').value = "";
            initSupabase();
            showToast('Disconnected', 'Disconnected from Supabase. Switched to offline database simulation.', 'success');
            modal.classList.remove('active');

            // Reload UI
            loadCommentsSection();
            updateLoginStateUI();
        });
    }

    function updateDevBadge() {
        const badge = document.getElementById('devConfigBadge');
        if (!badge) return;

        if (isOfflineMode) {
            badge.className = 'dev-config-badge offline hover-target';
            badge.querySelector('.dev-badge-text').textContent = 'Supabase: Offline Mode';
        } else {
            badge.className = 'dev-config-badge online hover-target';
            badge.querySelector('.dev-badge-text').textContent = 'Supabase: Connected';
        }
    }

    function updateConnectionTestUI() {
        const statusDiv = document.getElementById('connectionStatus');
        if (!statusDiv) return;

        if (isOfflineMode) {
            statusDiv.style.color = '#ffca27';
            statusDiv.style.display = 'block';
            statusDiv.textContent = 'Currently in Offline Mode (Simulated DB stored locally). Paste your Supabase credentials to link database.';
        } else {
            statusDiv.style.color = '#2ec4b6';
            statusDiv.style.display = 'block';
            statusDiv.textContent = 'Successfully authenticated and connected with Supabase!';
        }
    }


    // ═══════════════════════════════════════════════
    // LOGIN & REGISTER MODULE
    // ═══════════════════════════════════════════════
    function handleLoginForm() {
        const form = document.querySelector('.login-form');
        if (!form) return;

        // Add interactive sign-up mode toggler
        const wrapper = document.querySelector('.login-glass-panel');
        const loginHeader = wrapper.querySelector('.login-header');
        const formTitle = loginHeader.querySelector('.login-sub');
        const submitBtnText = form.querySelector('.btn-primary .text-anim span');
        const submitBtnTextAfter = form.querySelector('.btn-primary .text-anim');
        const signupLinkParagraph = form.querySelector('.signup-link');

        let isSignUpMode = false;

        // Check if there is a 'Create Account' link, make it interactive
        if (signupLinkParagraph) {
            const signupLink = signupLinkParagraph.querySelector('a');
            if (signupLink) {
                signupLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    isSignUpMode = !isSignUpMode;

                    if (isSignUpMode) {
                        // Switch UI to Sign Up
                        formTitle.textContent = "Create an exclusive account";
                        submitBtnText.textContent = "REGISTER";
                        submitBtnTextAfter.setAttribute('data-text', "REGISTER");
                        signupLinkParagraph.innerHTML = `Already have an account? <a href="#" class="hover-target">Login</a>`;

                        // Dynamically add a name field for registering
                        const formGroup = document.createElement('div');
                        formGroup.className = 'form-group name-field-group';
                        formGroup.innerHTML = `
                            <div class="input-icon-wrapper">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                <input type="text" id="username" name="username" placeholder="Your Full Name" required>
                            </div>
                        `;
                        form.insertBefore(formGroup, form.firstChild);

                        // GSAP Entrance
                        if (typeof gsap !== 'undefined') {
                            gsap.from('.name-field-group', { y: -20, opacity: 0, duration: 0.4, ease: 'power2.out' });
                        }
                    } else {
                        // Switch UI back to Login
                        formTitle.textContent = "Exclusive access awaits";
                        submitBtnText.textContent = "ENTER";
                        submitBtnTextAfter.setAttribute('data-text', "ENTER");
                        signupLinkParagraph.innerHTML = `Don't have an account? <a href="#" class="hover-target">Create Account</a>`;

                        const nameField = form.querySelector('.name-field-group');
                        if (nameField) nameField.remove();
                    }

                    // Re-bind click event to the newly rendered anchor tag
                    const newLink = signupLinkParagraph.querySelector('a');
                    newLink.addEventListener('click', (ev) => {
                        ev.preventDefault();
                        signupLink.click();
                    });
                });
            }
        }

        // Intercept form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            const usernameInput = document.getElementById('username');
            const username = usernameInput ? usernameInput.value.trim() : '';
            const btn = form.querySelector('.btn-primary');

            // Button visual state transition
            const originalBtnContent = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = `<span class="spinner-btn-loader"></span>${isSignUpMode ? 'REGISTERING...' : 'ENTERING...'}`;

            if (isOfflineMode) {
                // simulated offline login/registration
                setTimeout(() => {
                    if (isSignUpMode) {
                        // Register mock user
                        const mockUser = {
                            id: 'mock-uuid-' + Math.random().toString(36).substr(2, 9),
                            email: email,
                            user_metadata: { full_name: username || email.split('@')[0] }
                        };
                        localStorage.setItem('ARDENT_MOCK_USER', JSON.stringify(mockUser));
                        showToast('Account Created', 'Successfully registered in local offline mode!', 'success');
                    } else {
                        // Mock Login verification (accept any credentials for simplicity in offline mode)
                        const mockUser = {
                            id: 'mock-uuid-logged-in',
                            email: email,
                            user_metadata: { full_name: email.split('@')[0].toUpperCase() }
                        };
                        localStorage.setItem('ARDENT_MOCK_USER', JSON.stringify(mockUser));
                        showToast('Welcome Back', `Access granted, user: ${mockUser.user_metadata.full_name}`, 'success');
                    }

                    btn.disabled = false;
                    btn.innerHTML = originalBtnContent;

                    // Redirect to home/index page
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                }, 1200);

            } else {
                // REAL Supabase Auth integration
                try {
                    if (isSignUpMode) {
                        // Real Sign Up
                        const { data, error } = await supabaseClient.auth.signUp({
                            email,
                            password,
                            options: {
                                data: {
                                    full_name: username
                                }
                            }
                        });

                        if (error) throw error;

                        showToast('Verify Email', 'Account created! Please check your email to verify.', 'success');

                        // Instantly transition back to login UI
                        if (signupLinkParagraph) {
                            const newLink = signupLinkParagraph.querySelector('a');
                            if (newLink) newLink.click();
                        }
                    } else {
                        // Real Sign In
                        const { data, error } = await supabaseClient.auth.signInWithPassword({
                            email,
                            password
                        });

                        if (error) throw error;

                        showToast('Welcome', `Access granted, welcome to Automobili Ardent!`, 'success');

                        setTimeout(() => {
                            window.location.href = 'index.html';
                        }, 1000);
                    }
                } catch (err) {
                    console.error('Auth error:', err);
                    showToast('Authentication Failed', err.message || 'Connection failed or incorrect inputs.', 'error');
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = originalBtnContent;
                }
            }
        });

        // Hook up social logins with notifications
        const socialBtns = form.querySelectorAll('.btn-social');
        socialBtns.forEach(socialBtn => {
            socialBtn.addEventListener('click', async () => {
                const label = socialBtn.getAttribute('aria-label') || 'Social Provider';

                if (isOfflineMode) {
                    showToast('Social Login Connect', `${label} simulation active. Authenticating...`, 'info');
                    setTimeout(() => {
                        const mockUser = {
                            id: 'mock-social-uuid',
                            email: 'guest@ardent.com',
                            user_metadata: { full_name: 'ARDENT MEMBER' }
                        };
                        localStorage.setItem('ARDENT_MOCK_USER', JSON.stringify(mockUser));
                        showToast('Welcome Member', `Access granted via quick access!`, 'success');
                        setTimeout(() => { window.location.href = 'index.html'; }, 1000);
                    }, 1000);
                } else {
                    // Try to trigger OAuth (needs configuration in Supabase dashboard)
                    let provider = 'google';
                    if (label.toLowerCase().includes('twitter')) provider = 'twitter';
                    if (label.toLowerCase().includes('discord')) provider = 'discord';

                    try {
                        const { data, error } = await supabaseClient.auth.signInWithOAuth({
                            provider: provider,
                            options: {
                                redirectTo: window.location.origin + '/index.html'
                            }
                        });
                        if (error) throw error;
                    } catch (err) {
                        console.error('OAuth fail:', err);
                        showToast('OAuth Error', `Could not trigger connection. Ensure redirects are configured in Supabase.`, 'error');
                    }
                }
            });
        });
    }

    // ─── HEADER / MENU STATE DYNAMIC LINK ───
    function updateLoginStateUI() {
        const user = getLoggedInUser();
        const menuNav = document.querySelector('.menu-nav-links');
        if (!menuNav) return;

        // Check if there is already an Account or Login link in the overlay
        let accountLinkWrapper = document.getElementById('menuAccountWrapper');

        if (user) {
            // Logged In State
            const userInitials = (user.user_metadata?.full_name || user.email || 'U').substring(0, 2).toUpperCase();

            if (accountLinkWrapper) {
                accountLinkWrapper.innerHTML = `
                    <a href="#" class="m-link hover-target" id="menuBtnLogout" style="color: var(--primary);">
                        <span class="text-anim" data-text="LOGOUT"><span>LOGOUT (${user.user_metadata?.full_name || user.email.split('@')[0]})</span></span>
                    </a>
                `;
            } else {
                accountLinkWrapper = document.createElement('div');
                accountLinkWrapper.className = 'm-link-wrapper';
                accountLinkWrapper.id = 'menuAccountWrapper';
                accountLinkWrapper.innerHTML = `
                    <a href="#" class="m-link hover-target" id="menuBtnLogout" style="color: var(--primary);">
                        <span class="text-anim" data-text="LOGOUT"><span>LOGOUT (${user.user_metadata?.full_name || user.email.split('@')[0]})</span></span>
                    </a>
                `;
                menuNav.appendChild(accountLinkWrapper);
            }

            // Bind logout
            document.getElementById('menuBtnLogout').addEventListener('click', (e) => {
                e.preventDefault();
                logoutUser();
            });

        } else {
            // Logged Out State
            if (accountLinkWrapper) {
                accountLinkWrapper.innerHTML = `
                    <a href="login.html" class="m-link hover-target">
                        <span class="text-anim" data-text="LOGIN"><span>LOGIN / SIGN UP</span></span>
                    </a>
                `;
            } else {
                accountLinkWrapper = document.createElement('div');
                accountLinkWrapper.className = 'm-link-wrapper';
                accountLinkWrapper.id = 'menuAccountWrapper';
                accountLinkWrapper.innerHTML = `
                    <a href="login.html" class="m-link hover-target">
                        <span class="text-anim" data-text="LOGIN"><span>LOGIN / SIGN UP</span></span>
                    </a>
                `;
                menuNav.appendChild(accountLinkWrapper);
            }
        }
    }

    async function logoutUser() {
        if (isOfflineMode) {
            localStorage.removeItem('ARDENT_MOCK_USER');
            showToast('Logged Out', 'Successfully logged out.', 'success');
            updateLoginStateUI();
            loadCommentsSection(); // refresh pre-fill states
        } else {
            try {
                const { error } = await supabaseClient.auth.signOut();
                if (error) throw error;
                showToast('Logged Out', 'Successfully logged out.', 'success');
                updateLoginStateUI();
                loadCommentsSection(); // refresh pre-fill states
            } catch (err) {
                console.error(err);
                showToast('Logout Error', err.message || 'Logout failed.', 'error');
            }
        }
    }


    // ═══════════════════════════════════════════════
    // COMMENTS ENGINE MODULE
    // ═══════════════════════════════════════════════
    function loadCommentsSection() {
        const commentsSection = document.getElementById('blog-comments');
        if (!commentsSection) return;

        const innerContainer = commentsSection.querySelector('.blog-comments-inner');
        if (!innerContainer) return;

        // Detect current blog id/slug
        let blogId = window.location.pathname.split('/').pop().replace('.html', '');
        if (!blogId || blogId === 'blog') {
            // Fallback: check page title to identify separate pages correctly
            blogId = document.title.split('—')[0].trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
        }

        // Insert or grab the comments listing box
        let commentsListWrapper = document.getElementById('commentsListWrapper');
        if (!commentsListWrapper) {
            commentsListWrapper = document.createElement('div');
            commentsListWrapper.className = 'comments-list-container';
            commentsListWrapper.id = 'commentsListWrapper';

            // Insert it before the comments form
            const commentForm = document.getElementById('comment-form');
            innerContainer.insertBefore(commentsListWrapper, commentForm);
        }

        // Setup Login Enforcement & User Details
        const user = getLoggedInUser();
        const fieldsRow = innerContainer.querySelector('.form-row-three');
        const commentForm = document.getElementById('comment-form');
        let prefillPill = document.getElementById('commentFormPrefillPill');
        
        let loginPrompt = document.getElementById('commentLoginPrompt');
        if (!loginPrompt && commentForm) {
            loginPrompt = document.createElement('div');
            loginPrompt.id = 'commentLoginPrompt';
            loginPrompt.className = 'comment-login-prompt';
            loginPrompt.innerHTML = `
                <div style="padding: 2.5rem; background: rgba(255,255,255,0.02); border-radius: 12px; text-align: center; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 2rem;">
                    <h3 style="font-size: 1.25rem; font-weight: 500; margin-bottom: 0.75rem; color: #fff;">Join the Conversation</h3>
                    <p style="color: rgba(255,255,255,0.6); margin-bottom: 1.5rem; font-size: 0.95rem;">You must be logged in to leave a comment.</p>
                    <a href="login.html" class="btn-primary hover-target">
                        <span class="text-anim" data-text="LOGIN OR SIGN UP"><span>LOGIN OR SIGN UP</span></span>
                        <svg class="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </a>
                </div>
            `;
            commentForm.parentNode.insertBefore(loginPrompt, commentForm);
        }

        if (user) {
            if (commentForm) commentForm.style.display = 'block';
            if (loginPrompt) loginPrompt.style.display = 'none';

            // Completely remove the manual input fields
            if (fieldsRow) {
                fieldsRow.remove();
            }

            // Show a greeting pill above form
            if (!prefillPill && commentForm) {
                prefillPill = document.createElement('div');
                prefillPill.className = 'comment-user-pill';
                prefillPill.id = 'commentFormPrefillPill';
                commentForm.insertBefore(prefillPill, commentForm.firstChild);
            }
            if (prefillPill) {
                prefillPill.innerHTML = `
                    <span>Posting as <strong>${user.user_metadata?.full_name || user.email.split('@')[0]}</strong> (${user.email})</span>
                    <button type="button" class="comment-user-logout" id="btnCommentPrefillLogout">Log Out</button>
                `;
                document.getElementById('btnCommentPrefillLogout').addEventListener('click', (e) => {
                    e.preventDefault();
                    logoutUser();
                });
            }
        } else {
            // Hide the form if not logged in
            if (commentForm) commentForm.style.display = 'none';
            if (loginPrompt) loginPrompt.style.display = 'block';
            if (prefillPill) prefillPill.remove();
        }

        // Load comments listing
        fetchComments(blogId);

        // Setup Form interception
        setupCommentFormSubmit(blogId);
    }

    async function fetchComments(blogId) {
        const listWrapper = document.getElementById('commentsListWrapper');
        if (!listWrapper) return;

        // Render loading Skeletons
        listWrapper.innerHTML = `
            <div class="comments-list-header">
                <h3 class="comments-count-title">Comments</h3>
            </div>
            <div class="comments-loading-skeleton">
                <div class="skeleton-card"><div class="skeleton-avatar"></div><div class="skeleton-lines"><div class="skeleton-line title"></div><div class="skeleton-line text-1"></div></div></div>
                <div class="skeleton-card"><div class="skeleton-avatar"></div><div class="skeleton-lines"><div class="skeleton-line title"></div><div class="skeleton-line text-1"></div></div></div>
            </div>
        `;

        let comments = [];

        if (isOfflineMode) {
            // Simulated local comments DB loading
            setTimeout(() => {
                const stored = localStorage.getItem(`comments_mock_${blogId}`);
                if (stored) {
                    try {
                        comments = JSON.parse(stored);
                    } catch (e) {
                        comments = [];
                    }
                } else {
                    // Populate lovely placeholder reviews to start
                    comments = [
                        {
                            id: 'mock-c-1',
                            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                            name: 'Arjun Sen',
                            email: 'arjun@gmail.com',
                            website: 'https://automobilia.in',
                            content: 'Absolutely spectacular photography! Seeing the Guards Red Carrera S alongside the Weissach GT2 RS is standard fuel for any Porsche enthusiast. Odin the Husky definitely stole the show though!'
                        },
                        {
                            id: 'mock-c-2',
                            created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
                            name: 'Marcus Vance',
                            email: 'marcus@vance.net',
                            website: '',
                            content: 'The detail about the thinner guards red paint layer on the GT2 RS is fascinating. This kind of writing is why Automobili Ardent remains peerless. Magnificent work!'
                        }
                    ];
                    localStorage.setItem(`comments_mock_${blogId}`, JSON.stringify(comments));
                }
                renderComments(comments);
            }, 600);

        } else {
            // Real Supabase API call
            try {
                const { data, error } = await supabaseClient
                    .from('comments')
                    .select('*')
                    .eq('blog_id', blogId)
                    .order('created_at', { ascending: true });

                if (error) throw error;
                comments = data || [];
                renderComments(comments);
            } catch (err) {
                console.error('Supabase query error:', err);
                listWrapper.innerHTML = `
                    <div class="no-comments-fallback">
                        <p style="color: #e63226; font-weight: 500;">Failed to fetch comments from database.</p>
                        <p class="dev-help-text" style="margin-top: 5px;">Error: ${err.message || 'Cannot access table \'comments\'.'}</p>
                        <p class="dev-help-text">Click 'Supabase Config' in bottom right to inspect SQL setup instructions.</p>
                    </div>
                `;
            }
        }
    }

    function renderComments(comments) {
        const listWrapper = document.getElementById('commentsListWrapper');
        if (!listWrapper) return;

        if (comments.length === 0) {
            listWrapper.innerHTML = `
                <div class="comments-list-header">
                    <h3 class="comments-count-title">Comments</h3>
                    <span class="comments-count-badge">0</span>
                </div>
                <div class="no-comments-fallback">
                    Be the first to share your thoughts on this masterpiece!
                </div>
            `;
            return;
        }

        let cardsHTML = '';
        comments.forEach(comment => {
            const initials = comment.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

            // Format Date beautifully
            let formattedDate = '';
            try {
                const date = new Date(comment.created_at);
                formattedDate = date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            } catch (e) {
                formattedDate = comment.created_at;
            }

            // Validate website formatting
            let websiteMarkup = '';
            if (comment.website) {
                let url = comment.website.trim();
                if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
                websiteMarkup = `href="${url}" target="_blank" rel="noopener noreferrer"`;
            }

            // Check if comment creator is a verified logged in user
            // In a real scenario, you can check user_id. For mock, if email is logged in, show badge.
            const user = getLoggedInUser();
            const isVerified = (user && comment.email === user.email) || comment.email.endsWith('@automobiliardent.com');
            const verifiedBadge = isVerified ? `<span class="comment-badge-verified">Member</span>` : '';

            cardsHTML += `
                <div class="comment-card" id="comment-${comment.id}">
                    <div class="comment-avatar">${initials}</div>
                    <div class="comment-card-content">
                        <div class="comment-meta">
                            <div class="comment-author-info">
                                ${comment.website ? `<a class="comment-author-name" ${websiteMarkup}>${comment.name}</a>` : `<span class="comment-author-name">${comment.name}</span>`}
                                ${verifiedBadge}
                            </div>
                            <span class="comment-date">${formattedDate}</span>
                        </div>
                        <p class="comment-text">${escapeHtml(comment.content || comment.comment || '')}</p>
                    </div>
                </div>
            `;
        });

        listWrapper.innerHTML = `
            <div class="comments-list-header">
                <h3 class="comments-count-title">Comments</h3>
                <span class="comments-count-badge">${comments.length}</span>
            </div>
            <div class="comments-list">
                ${cardsHTML}
            </div>
        `;

        // Animate comments entry using GSAP
        if (typeof gsap !== 'undefined') {
            gsap.to('.comment-card', {
                opacity: 1,
                y: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: 'power2.out',
                onComplete: function () {
                    document.querySelectorAll('.comment-card').forEach(c => c.classList.add('animated'));
                }
            });
        } else {
            // CSS fallback
            document.querySelectorAll('.comment-card').forEach(c => c.classList.add('animated'));
        }
    }

    function setupCommentFormSubmit(blogId) {
        const form = document.getElementById('comment-form');
        if (!form) return;

        // Clone element to wipe out older event listeners
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);

        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const text = document.getElementById('comment-textarea').value.trim();
            const btn = document.getElementById('btn-comment-submit');
            const user = getLoggedInUser();

            if (!user) {
                showToast('Authentication Required', 'Please log in to post a comment.', 'error');
                return;
            }

            if (!text) {
                showToast('Empty Comment', 'Please write something before posting.', 'error');
                return;
            }

            const name = user.user_metadata?.full_name || user.email.split('@')[0];
            const email = user.email;
            const website = '';

            const newComment = {
                id: 'c-' + Math.random().toString(36).substr(2, 9),
                created_at: new Date().toISOString(),
                blog_id: blogId,
                name: name,
                email: email,
                website: website,
                content: text,
                user_id: user.id
            };

            // Loading state
            const originalBtnContent = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = `<span class="spinner-btn-loader"></span>POSTING COMMENT...`;

            if (isOfflineMode) {
                // simulated save
                setTimeout(() => {
                    let storedComments = [];
                    const stored = localStorage.getItem(`comments_mock_${blogId}`);
                    if (stored) {
                        try { storedComments = JSON.parse(stored); } catch (e) { }
                    }
                    storedComments.push(newComment);
                    localStorage.setItem(`comments_mock_${blogId}`, JSON.stringify(storedComments));

                    // Success handling
                    showToast('Comment Posted', 'Your thoughts were saved successfully (Offline local DB)!', 'success');
                    newForm.reset();
                    btn.disabled = false;
                    btn.innerHTML = originalBtnContent;

                    // Reload list
                    fetchComments(blogId);
                }, 800);

            } else {
                // REAL Supabase upload
                try {
                    // Remove id & created_at keys to let database autogenerate
                    const dbPayload = {
                        blog_id: newComment.blog_id,
                        name: newComment.name,
                        email: newComment.email,
                        website: newComment.website,
                        content: newComment.content,
                        user_id: newComment.user_id
                    };

                    const { error } = await supabaseClient
                        .from('comments')
                        .insert(dbPayload);

                    if (error) throw error;

                    showToast('Comment Posted', 'Comment uploaded securely to Supabase DB!', 'success');

                    // Reset textarea, while preserving email & name if logged in
                    const commentArea = document.getElementById('comment-textarea');
                    if (commentArea) commentArea.value = '';

                    btn.disabled = false;
                    btn.innerHTML = originalBtnContent;

                    // Reload list
                    fetchComments(blogId);

                } catch (err) {
                    console.error('Insert comment error:', err);
                    showToast('Upload Failure', `Failed to upload to Supabase: ${err.message || 'Check connection/schema'}`, 'error');
                    btn.disabled = false;
                    btn.innerHTML = originalBtnContent;
                }
            }
        });
    }

    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function (m) { return map[m]; });
    }


    // ═══════════════════════════════════════════════
    // BOOTSTRAP INITIALIZATION
    // ═══════════════════════════════════════════════
    createDevUI();
    initSupabase();
    updateLoginStateUI();
    loadCommentsSection();
    handleLoginForm();
});
