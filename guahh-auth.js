// Guahh Account Authentication Library (guahh-auth.js)
const GuahhAuth = () => {
    // This is the URL to your login page on GitHub.
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
            
            // Add the serviceName to the popup URL if it was provided.
            if (options.serviceName) {
                loginUrl.searchParams.append('serviceName', options.serviceName);
            }

            const width = 500, height = 650, left = (screen.width/2)-(width/2), top = (screen.height/2)-(height/2);
            const popup = window.open(loginUrl.href, 'guahhLogin', `width=${width},height=${height},top=${top},left=${left}`);

            const messageListener = (event) => {
                // Security check: only accept messages from our login page.
                if (event.origin !== loginUrl.origin) return;
                
                // If the login was successful...
                if (event.data && event.data.type === 'GUAHH_LOGIN_SUCCESS') {
                    const user = event.data.user;
                    localStorage.setItem(userStorageKey, JSON.stringify(user));
                    cleanup(); // Close the popup and listeners.
                    resolve(user); // Send the user data back to the project.
                }
            };

            // This interval checks if the user manually closed the popup.
            const interval = setInterval(() => {
                if (popup.closed) {
                    cleanup();
                    reject('Login window closed by user.');
                }
            }, 500);

            // A helper function to clean up the listeners and popup.
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
    
    // Make the functions available globally.
    return { login, logout, getCurrentUser };
};

const guahh = GuahhAuth();
