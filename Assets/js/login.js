// Assets/js/login.js
import { users } from './users.js'; // Import the user data

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    if (!loginForm) {
        console.error("Login form not found!");
        return;
    }

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent the default form submission

        const enteredUsername = usernameInput.value.trim();
        const enteredPassword = passwordInput.value;

        // --- Basic Validation ---
        if (!enteredUsername || !enteredPassword) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Information',
                text: 'Please enter both username/email and password.',
                confirmButtonColor: '#3085d6'
            });
            return;
        }

        // --- Find User (INSECURE CHECK) ---
        const foundUser = users.find(user =>
            (user.email === enteredUsername || user.name === enteredUsername) && // Allow login with email or name
            user.password === enteredPassword // Direct password comparison (INSECURE!)
        );

        if (foundUser) {
            // --- Login Successful ---
            console.log('Login successful for:', foundUser.name);

            // Store user info (excluding password) in sessionStorage
            // sessionStorage is cleared when the browser tab is closed
            sessionStorage.setItem('loggedInUser', JSON.stringify({
                name: foundUser.name,
                email: foundUser.email,
                permissions: foundUser.permissions
            }));

            // Redirect to the main index page
            window.location.href = 'index.html'; // Or '/index.html' depending on your setup

        } else {
            // --- Login Failed ---
            console.warn('Login failed for:', enteredUsername);
            Swal.fire({
                icon: 'error',
                title: 'Login Failed',
                text: 'Invalid username/email or password.',
                confirmButtonColor: '#d33'
            });
            // Optionally clear the password field
            passwordInput.value = '';
        }
    });
});
