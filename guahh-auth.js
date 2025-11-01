// Guahh Account Authentication Library (guahh-auth.js)
// v2.2 - Stable, Event-Based
(function() {
    'use strict';
    if (window.guahh) return;

    const GUAHH_LOGIN_URL = 'https://guahhinc.github.io/accounts/index.html';
    const userStorageKey = 'guahhUser';

    const login = (options = {}) => {
        return new Promise((resolve, reject) => {
            let loginUrl;
            try { loginUrl = new URL(GUAHH_LOGIN_URL); } catch (e) { return reject("GuahhAuth Error: Invalid Configuration."); }
            
            if (options.serviceName) { loginUrl.searchParams.append('serviceName', options.serviceName); }

            const width = 500, height = 650;
            const left = (window.screen.width / 2) - (width / 2), top = (window.screen.height / 2) - (height / 2);
            const popup = window.open(loginUrl.href, 'guahhLogin', `width=${width},height=${height},top=${top},left=${left}`);

            const messageListener = (event) => {
                if (event.origin !== loginUrl.origin) return;
                if (event.data && event.data.type === 'GUAHH_LOGIN_SUCCESS') {
                    localStorage.setItem(userStorageKey, JSON.stringify(event.data.user));
                    cleanup();
                    resolve(event.data.user);
                }
            };

            const interval = setInterval(() => {
                if (!popup || popup.closed) {
                    cleanup();
                    reject('Login window was closed.');
                }
            }, 500);

            function cleanup() {
                clearInterval(interval);
                window.removeEventListener('message', messageListener);
                if (popup && !popup.closed) popup.close();
            }

            window.addEventListener('message', messageListener);
        });
    };

    const logout = () => localStorage.removeItem(userStorageKey);
    const getCurrentUser = () => JSON.parse(localStorage.getItem(userStorageKey) || 'null');
    
    window.guahh = { login, logout, getCurrentUser };

    window.dispatchEvent(new CustomEvent('guahh:ready'));
})();
