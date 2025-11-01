// Guahh Account Authentication Library (guahh-auth.js)
// v3.1 - Centralized Authentication Model
(function() {
    'use strict';
    if (window.guahh) return;

    // ** PASTE YOUR NEW GUAHH ACCOUNT API URL HERE **
    const GUAHH_API_URL = 'https://script.google.com/macros/s/AKfycbxJFwty5ELkJhLDXsOr86fvLts6h7Vff9Bbs24674mhGxTWrHNhttMoXgjtC3U_MsYC6A/exec';
    
    // This is the URL to the visual login page on GitHub.
    const GUAHH_LOGIN_PAGE_URL = 'https://guahhinc.github.io/accounts/index.html';
    
    const userStorageKey = 'guahhUser';

    const login = (options = {}) => {
        return new Promise((resolve, reject) => {
            if (GUAHH_API_URL.includes('...')) { return reject("GuahhAuth Error: API URL is not set."); }

            const width = 500, height = 650;
            const left = (window.screen.width / 2) - (width / 2), top = (window.screen.height / 2) - (height / 2);
            const popup = window.open(GUAHH_LOGIN_PAGE_URL, 'guahhLogin', `width=${width},height=${height},top=${top},left=${left}`);

            const messageListener = async (event) => {
                if (event.origin !== new URL(GUAHH_LOGIN_PAGE_URL).origin) return;

                if (event.data && event.data.type === 'GUAHH_PERFORM_LOGIN') {
                    const loginData = event.data.credentials;
                    try {
                        const response = await fetch(GUAHH_API_URL, {
                            method: 'POST',
                            mode: 'cors',
                            redirect: 'follow',
                            body: JSON.stringify({
                                action: 'login',
                                username: loginData.username,
                                password: loginData.password,
                                serviceName: options.serviceName // Pass the service name to the backend
                            })
                        });
                        const result = await response.json();
                        
                        if (result.status === "success") {
                            localStorage.setItem(userStorageKey, JSON.stringify(result.user));
                            cleanup();
                            resolve(result.user);
                        } else {
                            // Send failure message back to popup
                            popup.postMessage({ type: 'GUAHH_LOGIN_FAILED', message: result.message }, '*');
                        }
                    } catch (error) {
                        popup.postMessage({ type: 'GUAHH_LOGIN_FAILED', message: 'Network error.' }, '*');
                    }
                }
            };
            
            const interval = setInterval(() => { if (!popup || popup.closed) { cleanup(); reject('Login window was closed.'); } }, 500);
            function cleanup() { clearInterval(interval); window.removeEventListener('message', messageListener); if (popup && !popup.closed) popup.close(); }
            window.addEventListener('message', messageListener);
        });
    };

    const logout = () => localStorage.removeItem(userStorageKey);
    const getCurrentUser = () => JSON.parse(localStorage.getItem(userStorageKey) || 'null');
    
    window.guahh = { login, logout, getCurrentUser };
    window.dispatchEvent(new CustomEvent('guahh:ready'));
})();
