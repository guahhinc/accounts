// Guahh Account Authentication Library (guahh-auth.js)
const GuahhAuth = () => {
    // --- Configuration ---
    // This is the full URL to your Guahh Account index.html page, ONCE it is on GitHub.
    const GUAHH_LOGIN_URL = '--- PASTE YOUR GITHUB PAGES URL TO INDEX.HTML HERE ---'; 

    const userStorageKey = 'guahhUser';

    // --- Public Methods ---
    const login = () => {
        return new Promise((resolve, reject) => {
            if (GUAHH_LOGIN_URL.startsWith('---')) {
                return reject('GuahhAuth Error: GUAHH_LOGIN_URL has not been set in guahh-auth.js.');
            }
            const width = 500, height = 650, left = (screen.width/2)-(width/2), top = (screen.height/2)-(height/2);
            const popup = window.open(GUAHH_LOGIN_URL, 'guahhLogin', `width=${width},height=${height},top=${top},left=${left}`);

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
                if (popup.closed) {
                    cleanup();
                    reject('Login window closed by user.');
                }
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

const guahh = GuahhAuth();
