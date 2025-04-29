// main.js
import { checkLoginStatus, logoutUser } from './auth.js';
import { screenData as allScreenData } from './config.js';
import {
    screensContainer,
    modalContainer,
    modalOverlay,
    announcementBoard,
    showToast, // Ensure showToast is exported from ui.js or defined here
    showNotificationDetails,
    showAllNotificationsSummary,
    openModalForScreen,
    closeModal,
    initializeScreenElements,
    initializeAnnouncements,
    isModalCurrentlyOpen
} from './ui.js'; // Make sure all imports are correct

// --- Function to set up event listeners for a logged-in user ---
function setupLoggedInEventListeners(userPermissions) { // userPermissions is available here
    console.log("Setting up event listeners for logged-in user...");

    // --- Logout Button Listener ---
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', logoutUser);
    } else {
        console.warn("Logout button element not found.");
    }

    // --- Screen Element Click Listener (Event Delegation) ---
    if (screensContainer) {
        screensContainer.addEventListener("click", (event) => {
            const screenDiv = event.target.closest(".screen-element");
            // Allow click even if modal is open? Maybe not. Let's keep !isModalCurrentlyOpen()
            // if (screenDiv && screenDiv.dataset.screenId && !isModalCurrentlyOpen()) { // Re-enable if needed
            if (screenDiv && screenDiv.dataset.screenId) {
                const screenId = screenDiv.dataset.screenId;
                const screen = allScreenData.screens.find(s => s.id === screenId);
                if (screen) {
                    // *** Pass userPermissions to openModalForScreen ***
                    openModalForScreen(screen, userPermissions);
                } else {
                    console.error("Data not found for screen ID:", screenId);
                    // Use showToast if available, otherwise console.error
                    if (typeof showToast === 'function') {
                        showToast("Error", "Could not load screen details.", "danger");
                    } else {
                         console.error("Error: Could not load screen details.");
                    }
                }
            }
        });
    } else {
         console.warn("Screens container element not found.");
    }

    // --- Modal Event Listener (Delegation for close and notification clicks) ---
    if (modalContainer) {
        modalContainer.addEventListener("click", (event) => {
            // Close button inside modal content
            if (event.target.closest(".close-btn")) {
                closeModal();
                return; // Stop further processing if close button is clicked
            }

            // Notification type spans inside modal content
            const notificationSpan = event.target.closest(".notification-types span[data-system][data-type]");
            if (notificationSpan) {
                const systemName = notificationSpan.dataset.system;
                const type = notificationSpan.dataset.type;
                if (systemName && type) {
                    showNotificationDetails(systemName, type); // Assumes this function exists in ui.js
                } else {
                    console.warn("Missing data attributes on notification span:", notificationSpan);
                }
            }
        });
    } else {
        console.warn("Modal container element not found.");
    }

    // --- Modal Overlay Click Listener ---
    if (modalOverlay) {
        modalOverlay.addEventListener("click", closeModal);
    } else {
        console.warn("Modal overlay element not found.");
    }

    // --- Announcement Board Click Listener ---
    if (announcementBoard) {
        announcementBoard.addEventListener("click", (event) => {
             // Ensure click is directly on the board or its badge child to trigger summary
             if (event.target === announcementBoard || event.target.closest('.notification-badge')) {
                 showAllNotificationsSummary(); // Assumes this function exists in ui.js
             }
        });
        // Ensure cursor indicates it's clickable (can also be done in CSS)
        announcementBoard.style.cursor = 'pointer';
    } else {
        console.warn("Announcement board element not found.");
    }

    // --- Keyboard Listener (Escape key for modal) ---
    // Add this listener to the document globally, but only when logged in
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && isModalCurrentlyOpen()) {
            closeModal();
        }
    });

    console.log("Logged-in event listeners successfully set up.");
}


// --- Main Initialization on DOMContentLoaded ---
document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM fully loaded and parsed.");
    try {
        // Check login status (can be sync or async depending on implementation)
        // Using await here in case checkLoginStatus becomes async later
        const loggedInUser = await checkLoginStatus();

        if (!loggedInUser) {
            console.log("No logged-in user found. Halting main.js initialization.");
            // checkLoginStatus should handle the redirect, so just return here.
            return;
        }

        console.log("User is logged in:", loggedInUser.name);
        const userPermissions = loggedInUser.permissions || [];

        // --- Initialization ---
        // Pass screenData here if initializeAnnouncements needs it
        initializeAnnouncements(loggedInUser.name, allScreenData);
        initializeScreenElements(userPermissions || []); // Pass permissions

        // --- Setup Event Listeners ---
        // Call the function that contains all the listener setup logic
        setupLoggedInEventListeners(userPermissions); // Pass permissions

        // --- Example Random Notification Scheduler ---
        // scheduleRandomNotification(); // Uncomment if you want this feature

    } catch (error) {
        console.error("Error during initialization:", error);
         if (typeof showToast === 'function') {
            showToast("Initialization Error", "Failed to load application components.", "danger");
         } else {
            console.error("Initialization Error: Failed to load application components.");
         }
        // Optional: Redirect to login or show a generic error message on the page
        // window.location.href = '/login.html';
    }
}); // End DOMContentLoaded


// --- Example Random Notification Scheduler Function ---
// (Keep this function if you use it, otherwise remove)
function scheduleRandomNotification() {
    // Base random notifications on ALL screens' data, not just permitted ones
    const systemsWithNotifications = allScreenData.screens.filter(s => s.notificationCount > 0);

    if (systemsWithNotifications.length === 0) {
        console.log("No systems currently have notifications to simulate.");
        return;
    }

    const types = ["warning", "danger", "success", "info"];
    const randomInterval = 25000 + Math.floor(Math.random() * 40000); // 25s to 65s

    console.log(`Scheduling next random notification check in ${randomInterval / 1000} seconds.`);

    setTimeout(() => {
        if (Math.random() > 0.5) { // 50% chance
            const randomScreen = systemsWithNotifications[Math.floor(Math.random() * systemsWithNotifications.length)];
            const randomType = types[Math.floor(Math.random() * types.length)];
            const messages = {
                warning: ["Resource usage high", "Configuration drift detected", "License nearing expiration"],
                danger: ["Service unavailable", "Critical vulnerability found", "Data sync failed"],
                success: ["Deployment successful", "Health check passed", "User action completed"],
                info: ["New feature available", "Scheduled maintenance soon", "System update applied"],
            };
            const message = messages[randomType][Math.floor(Math.random() * messages[randomType].length)];

            console.log(`Showing random toast: ${randomScreen.name} - ${message} (${randomType})`);
            if (typeof showToast === 'function') {
                showToast(`${randomScreen.name} Update`, message, randomType);
            }
        } else {
             console.log("Skipping random notification this interval.");
        }
        scheduleRandomNotification(); // Schedule next check
    }, randomInterval);
}

// --- Standalone showToast if not in ui.js ---
// Define showToast here ONLY if it's NOT imported from ui.js
/*
export function showToast(title, message, type = "info") {
    // ... implementation from previous examples ...
}
*/
