// DUMMY guahh-auth.js for debugging purposes.
console.log("Dummy guahh-auth.js script has started executing.");

// Create a fake 'guahh' object immediately with simple placeholder functions.
window.guahh = {
    login: function() {
        alert("TEST SUCCESSFUL: The login button is now working.");
        // Return a rejected promise so the calling code doesn't hang or show an error.
        return Promise.reject("This is a dummy function.");
    },
    logout: function() {
        alert("Dummy logout function called.");
    },
    getCurrentUser: function() {
        console.log("Dummy getCurrentUser function called, returning null.");
        return null; // Always return "not logged in" for this test.
    }
};

console.log("Dummy guahh-auth.js script has finished. The 'guahh' object should now be available.");
