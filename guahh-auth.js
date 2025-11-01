// Guahh Account Authentication Library (guahh-auth.js)
// v1.3 - Corrected for stability.

// This wrapper ensures our code doesn't conflict with anything else.
(function() {
    // Check if the library is already initialized to prevent errors.
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
            
            if (options.serviceName) {
                loginUrl.searchParams.append('serviceName', options.serviceName);
            }

            const width = 500, height = 650, left = (screen.width/2)-(width/2), top = (screen.height/2)-(height/2);
            const popup = window.open(loginUrl.href, 'guahhLogin', `width=${width},height=${height},top=${top},left=${left}`);

            const messageListener = (event) => {
                // Security check: only accept messages from our trusted login page.
                if (event.origin !== loginUrl.origin) {
                    return;
                }
                
                if (event.data && event.data.type === 'GUAHH_LOGIN_SUCCESS') {
                    const user = event.data.user;
                    localStorage.setItem(userStorageKey, JSON.stringify(user));
                    cleanup();
                    resolve(user);
                }
            };

            const interval = setInterval(() => {
                if (!popup || popup.closed) {
                    cleanup();
                    reject('Login window closed by user.');
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
            localStorage.removeItem(userStorageKey);
            return null;
        }
    };
    
    // Create the global 'guahh' object for other scripts to use.
    window.guahh = {
        login,
        logout,
        getCurrentUser
    };
})();
