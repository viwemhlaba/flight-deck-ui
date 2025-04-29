// Assets/js/auth.js
import { users } from './users.js'; // Assuming users are still needed for login
const USER_STORAGE_KEY = 'loggedInUser';
export function checkLoginStatus() {
    const userDataString = sessionStorage.getItem('loggedInUser');

    if (!userDataString) {
        // Not logged in, redirect to login page
        console.log("User not logged in. Redirecting to login.html");
        // Make sure the path to login.html is correct relative to index.html
        window.location.replace('login.html');
        return null; // Indicate not logged in
    }

    try {
        const userData = JSON.parse(userDataString);
        console.log("User logged in:", userData.name);
        return userData; // Return user data (including permissions)
    } catch (error) {
        console.error("Error parsing user data from sessionStorage:", error);
        // Clear potentially corrupted data and redirect
        sessionStorage.removeItem('loggedInUser');
        window.location.replace('login.html');
        return null;
    }

    
}

export function loginUser(username, password) {
    console.log(`Attempting login for: ${username}`);
    const user = users.find(
        (u) => (u.username === username || u.email === username) && u.password === password
    );

    if (user) {
        console.log("Login successful:", user.name);
        const userData = {
            id: user.id,
            name: user.name,
            permissions: user.permissions,
            // Add other relevant non-sensitive data if needed
            // Avoid storing the password!
        };
        // Store in sessionStorage as per your checkLoginStatus logic
        sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
        return userData;
    } else {
        console.log("Login failed: Invalid credentials");
        return null;
    }
}

export function logoutUser() {
    sessionStorage.removeItem('loggedInUser');
    console.log("User logged out. Redirecting to login.html");
    window.location.replace('/login.html');
}

// Optional: Add a logout button listener somewhere in your main UI (e.g., in main.js)
// Example:
// const logoutButton = document.getElementById('logout-button'); // Assuming you add such a button
// if (logoutButton) {
//     logoutButton.addEventListener('click', logoutUser);
// }
