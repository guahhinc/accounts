// Guahh Account Authentication Library (guahh-auth.js)
// v2.0 - Using an event-based model for maximum stability.
(function() {
    'use strict'; // Enable strict mode to catch common coding errors.

    // Prevent the script from running twice.
    if (window.guahh) {
        return;
    }

    const GUAHH_LOGIN_URL = 'https://guahhinc.github.io/accounts/index.html';
    const userStorageKey = 'guahhUser';

    const login = (options = {}) => {
        return new Promise((resolve, reject) => {
            let loginUrl;
            try {
                loginUrl = new URL(GUAHH_LOGIN_URL);
            } catch (e) {
                console.error("GuahhAuth Error: Invalid GUAHH_LOGIN_URL.", e);
                return reject("GuahhAuth Error: Configuration is invalid.");
            }
            
            if (options.serviceName && typeof options.serviceName === 'string') {
                loginUrl.searchParams.append('serviceName', options.serviceName);
            }

            const width = 500, height = 650;
            const left = (window.screen.width / 2) - (width / 2);
            const top = (window.screen.height / 2) - (height / 2);
            const popup = window.open(loginUrl.href, 'guahhLogin', `width=${width},height=${height},top=${top},left=${left}`);

            const messageListener = (event) => {
                if (event.origin !== loginUrl.origin) return;
                
                if (event.data && event.data.type === 'GUAHH_LOGIN_SUCCESS') {
                    const user = event.data.user;
                    localStorage.setItem(userStorageKey, JSON.stringify(user));
                    cleanup();
                    resolve(user);
                }
            };

            const interval = setInterval(() => {
                // Check if the popup was blocked or closed.
                if (!popup || popup.closed) {
                    cleanup();
                    reject('Login window was closed or blocked by the browser.');
                }
            }, 500);

            function cleanup() {
                clearInterval(interval);
                window.removeEventListener('message', messageListener);
                if (popup && !popup.closed) {
                    popup.close();
                }
            }

            window.addEventListener('message', messageListener);
        });
    };

    const logout = () => {
        localStorage.removeItem(userStorageKey);
    };

    const getCurrentUser = () => {
        try {
            const savedUser = localStorage.getItem(userStorageKey);
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (e) {
            console.error("Error parsing saved Guahh user.", e);
            localStorage.removeItem(userStorageKey); // Clear corrupted data.
            return null;
        }
    };
    
    // Create the global 'guahh' object.
    window.guahh = {
        login,
        logout,
        getCurrentUser
    };

    // ** THE MOST IMPORTANT PART **
    // Announce that the library is loaded and ready for use.
    try {
        const readyEvent = new CustomEvent('guahh:ready');
        window.dispatchEvent(readyEvent);
    } catch(e) {
        console.error("GuahhAuth: Could not dispatch ready event.", e);
    }

})();
