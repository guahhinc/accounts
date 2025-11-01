// Guahh Account Authentication Library (guahh-auth.js)
const GuahhAuth = () => {
    const GUAHH_LOGIN_URL = 'https://guahhinc.github.io/accounts/index.html'; 
    const userStorageKey = 'guahhUser';

    /**
     * Opens the Guahh login popup.
     * @param {object} [options] - Optional configuration.
     * @param {string} [options.serviceName] - The name of the service requesting login. This will be added to the user's "Linked Services".
     * @returns {Promise<object>}
     */
    const login = (options = {}) => {
        return new Promise((resolve, reject) => {
            let loginUrl = new URL(GUAHH_LOGIN_URL);
            
            // NEW: Add serviceName to the popup URL if provided.
            if (options.serviceName) {
                loginUrl.searchParams.append('serviceName', options.serviceName);
            }

            const width = 500, height = 650, left = (screen.width/2)-(width/2), top = (screen.height/2)-(height/2);
            const popup = window.open(loginUrl.href, 'guahhLogin', `width=${width},height=${height},top=${top},left=${left}`);

            const messageListener = (event) => {
                if (event.origin !== new URL(GUAHH_LOGIN_URL).origin) return;
                if (event.data && event.data.type === 'GUAHH_LOGIN_SUCCESS') {
                    const user = event.data.user;
                    localStorage.setItem(userStorageKey, JSON.stringify(user));
                    cleanup();
                    resolve(user);
                }
            };

            const interval = setInterval(() => {
                if (popup.closed) { cleanup(); reject('Login window closed by user.'); }
            }, 500);

            function cleanup() {
                clearInterval(interval);
                window.removeEventListener('message', messageListener);
                if (!popup.closed) popup.close();
            }

            window.addEventListener('message', messageListener);
        });
    };

    const logout = () => {
        localStorage.removeItem(userStorageKey);
    };

    const getCurrentUser = () => {
        const savedUser = localStorage.getItem(userStorageKey);
        return savedUser ? JSON.parse(savedUser) : null;
    };
    
    return { login, logout, getCurrentUser };
};

const guahh = GuahhAuth();```

---

### Step 3: Update Your `index.html` Login Page

This page needs to read the `serviceName` from its URL and pass it to the Apps Script during the login `fetch` request.

Replace the `<script>` section at the bottom of your `index.html` file with this updated version.

```html
    <script>
        const webAppUrl = "https://script.google.com/macros/s/AKfycbxJFwty5ELkJhLDXsOr86fvLts6h7Vff9Bbs24674mhGxTWrHNhttMoXgjtC3U_MsYC6A/exec";
        const loginView = document.getElementById('login-view'), createView = document.getElementById('create-view'), accountView = document.getElementById('account-view');
        const createForm = document.getElementById('create-form'), loginForm = document.getElementById('login-form');
        const createMessage = document.getElementById('create-message'), loginMessage = document.getElementById('login-message');
        const isPopup = (window.opener && window.opener !== window);
        
        // NEW: Read the serviceName from the URL when the page loads.
        const serviceNameFromUrl = new URLSearchParams(window.location.search).get('serviceName');

        function showView(viewName) { [loginView, createView, accountView].forEach(v => v.style.display = 'none'); document.getElementById(viewName).style.display = 'block'; }
        function showMessage(el, text, isSuccess) { el.textContent = text; el.className = `message ${isSuccess ? 'success' : 'error'}`; el.style.display = 'block'; }
        function populateAccountView(user) { document.getElementById('acc-pfp').src = user.ProfilePictureURL || 'https://via.placeholder.com/100'; document.getElementById('acc-displayname').textContent = user.DisplayName; document.getElementById('acc-username').textContent = `@${user.Username}`; document.getElementById('acc-email').textContent = user.Email; document.getElementById('acc-desc').textContent = user.Description || 'N/A'; document.getElementById('acc-services').textContent = user.LinkedServices || 'No services linked.'; showView('account-view'); }
        
        createForm.addEventListener('submit', e => { e.preventDefault(); const btn = e.target.querySelector('button'); btn.disabled = true; btn.textContent = 'Creating...'; fetch(webAppUrl, { method: 'POST', body: new FormData(createForm) }).then(res => res.json()).then(data => { if (data.result === 'success') { showMessage(createMessage, 'Account created! Please log in.', true); createForm.reset(); } else { showMessage(createMessage, 'Error: ' + data.error, false); } }).catch(err => showMessage(createMessage, 'Network Error: ' + err.message, false)).finally(() => { btn.disabled = false; btn.textContent = 'Create Account'; }); });

        loginForm.addEventListener('submit', e => {
            e.preventDefault(); const btn = e.target.querySelector('button'); btn.disabled = true; btn.textContent = 'Logging in...';
            
            // Build the URL with login details.
            let url = new URL(webAppUrl);
            url.searchParams.append('action', 'login');
            url.searchParams.append('loginIdentifier', e.target.loginIdentifier.value);
            url.searchParams.append('password', e.target.password.value);
            
            // NEW: Add the serviceName to the fetch request if it exists.
            if (serviceNameFromUrl) {
                url.searchParams.append('serviceName', serviceNameFromUrl);
            }

            fetch(url).then(res => res.json()).then(data => {
                if (data.result === 'success') {
                    if (isPopup) { window.opener.postMessage({ type: 'GUAHH_LOGIN_SUCCESS', user: data.user }, '*'); } else { localStorage.setItem('guahhUser', JSON.stringify(data.user)); populateAccountView(data.user); }
                } else { showMessage(loginMessage, data.message || 'Unknown error.', false); }
            }).catch(err => showMessage(loginMessage, 'Network Error: ' + err.message, false)).finally(() => { btn.disabled = false; btn.textContent = 'Login'; });
        });

        function logout() { localStorage.removeItem('guahhUser'); loginForm.reset(); loginMessage.style.display = 'none'; showView('login-view'); }
        
        document.addEventListener('DOMContentLoaded', () => { if (isPopup) { showView('login-view'); } else { const u = localStorage.getItem('guahhUser'); if (u) { populateAccountView(JSON.parse(u)); } else { showView('login-view'); } } });
    </script>
