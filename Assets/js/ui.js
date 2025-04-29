// ui.js
import { screenData as allScreenData, requestADemoUrl } from "./config.js"; // Import config data
import { users } from "./users.js"; // Assuming users might be needed for some UI logic, otherwise remove

// --- DOM Elements ---
export const screensContainer = document.getElementById("screens-container");
export const modalContainer = document.getElementById("modal-container");
export const modalContentDiv = document.getElementById("modal-content"); // Renamed from modalContent for clarity
export const modalOverlay = document.getElementById("modal-overlay");
export const toastContainer = document.getElementById("toast-container");
export const announcementWelcome = document.getElementById(
  "announcement-welcome"
);
export const announcementBoard = document.getElementById("announcement-board");
// Note: userNamePlaceholder was commented out in the provided code, ensure it exists in index.html if needed by initializeAnnouncements
// const userNamePlaceholder = document.getElementById("welcome-user-name-placeholder");

// --- State ---
let isModalOpen = false;

// --- UI Helper Functions ---
export function isModalCurrentlyOpen() {
  return isModalOpen;
}

// Function to close a specific toast
export function closeToast(toastElement) {
  if (!toastElement) return;
  // Clear auto-close timer if it exists
  const timerId = toastElement.dataset.timerId;
  if (timerId) {
    clearTimeout(parseInt(timerId, 10)); // Parse timerId back to number
    delete toastElement.dataset.timerId; // Clean up dataset
  }
  // Use GSAP for smooth exit animation if available, otherwise fallback
  if (typeof gsap !== "undefined") {
    gsap.to(toastElement, {
      opacity: 0,
      x: 100, // Move out to the right
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => toastElement.remove(),
    });
  } else {
    // Fallback: Use CSS transitions (ensure CSS handles .toast.hide or similar)
    toastElement.classList.remove("show");
    toastElement.addEventListener(
      "transitionend",
      () => toastElement.remove(),
      { once: true }
    );
  }
}

// Function to show toast notifications
export function showToast(title, message, type = "info") {
  if (!toastContainer) {
    console.warn("Toast container not found.");
    return;
  }

  const toast = document.createElement("div");
  // Add base class and type-specific class for styling
  toast.className = `toast toast-${type}`; // e.g., toast-info, toast-danger

  let iconClass = "🔔"; // Default info
  if (type === "warning") iconClass = "⚠️";
  if (type === "danger") iconClass = "⛔";
  if (type === "success") iconClass = "✅";

  toast.innerHTML = `
    <div class="toast-icon">${iconClass}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" aria-label="Close toast">&times;</button>
  `;

  toastContainer.appendChild(toast);

  // Add listener to close button
  toast.querySelector(".toast-close").addEventListener("click", () => {
    closeToast(toast);
  });

  // Animate in using GSAP if available
  if (typeof gsap !== "undefined") {
    gsap.from(toast, {
      opacity: 0,
      x: 100, // Start from the right
      duration: 0.5,
      ease: "power2.out",
    });
  } else {
    // Fallback: Add 'show' class for CSS animation/transition
    requestAnimationFrame(() => {
      toast.classList.add("show");
    });
  }

  // Auto remove after 5 seconds
  const autoCloseTimer = setTimeout(() => {
    // Check if toast still exists before trying to close
    if (toast.parentNode === toastContainer) {
      closeToast(toast);
    }
  }, 5000);

  // Store timer ID for potential cancellation if closed manually
  toast.dataset.timerId = autoCloseTimer.toString(); // Store as string
}

// Function to close the main modal
export function closeModal() {
  if (!isModalOpen || !modalContentDiv || !modalOverlay || !modalContainer)
    return;

  isModalOpen = false; // Set state immediately to prevent race conditions

  // Animate modal out using GSAP
  gsap.to(modalContainer, {
    opacity: 0,
    y: 50, // Move down slightly
    scale: 0.95,
    duration: 0.3,
    ease: "power2.in",
    onComplete: () => {
      modalContainer.style.display = "none"; // Hide after animation
      modalContentDiv.innerHTML = ""; // Clear content
      document.body.classList.remove("modal-open"); // Allow background scroll
    },
  });
  gsap.to(modalOverlay, {
    opacity: 0,
    duration: 0.2, // Faster fade for overlay
    onComplete: () => {
      modalOverlay.style.display = "none";
    },
  });
}

// Function to show notification details using SweetAlert2
export function showNotificationDetails(systemName, type) {
  // Find the screen data
  const screen = allScreenData.screens.find((s) => s.name === systemName);
  if (
    !screen ||
    !screen.notificationBreakdown ||
    !screen.notificationBreakdown[type]
  ) {
    console.warn(`No ${type} notification details found for ${systemName}`);
    showToast(
      "Details Unavailable",
      `Could not retrieve ${type} notification details for ${systemName}.`,
      "warning"
    );
    return;
  }

  let titleText = "";
  let color = "";
  let iconType = "info"; // Swal icon type
  const count = screen.notificationBreakdown[type];

  // Mockup details - replace with real data fetching if needed
  const detailsList = Array.from(
    { length: count },
    (_, i) => `<li>Detail item #${i + 1} for ${type} notification.</li>`
  ).join("");

  switch (type) {
    case "warning":
      titleText = `Warning Notifications (${count})`;
      color = "#f59e0b"; // amber-500
      iconType = "warning";
      break;
    case "danger":
      titleText = `Critical Notifications (${count})`;
      color = "#ef4444"; // red-500
      iconType = "error";
      break;
    case "safe": // Assuming 'safe' maps to success
    case "success":
      titleText = `System OK / Success (${count})`;
      color = "#10b981"; // emerald-500
      iconType = "success";
      break;
    default:
      titleText = `${
        type.charAt(0).toUpperCase() + type.slice(1)
      } Notifications (${count})`;
      color = "#3b82f6"; // blue-500
      iconType = "info";
  }

  // Close the main modal if it's open before showing Swal
  if (isModalOpen) {
    closeModal();
  }

  Swal.fire({
    title: `<span style="color: ${color};">${titleText} for ${systemName}</span>`,
    html: `<div class="text-left p-4">
             <p class="mb-4">The following ${count} ${type} notification(s) require attention:</p>
             <ul class="list-disc pl-5 text-sm max-h-60 overflow-y-auto">
               ${detailsList || "<li>No specific details available.</li>"}
             </ul>
           </div>`,
    icon: iconType,
    confirmButtonText: "Acknowledge",
    confirmButtonColor: color,
    customClass: {
      popup: "swal2-modal-container", // Ensure this class exists or remove
      htmlContainer: "text-left", // Ensure text alignment if needed
    },
    backdrop: true,
    allowOutsideClick: true,
    heightAuto: false, // Prevents scrollbar shift issues
  });
}

// Function to show summary of all notifications using SweetAlert2
export function showAllNotificationsSummary() {
  const screensWithNotifications = allScreenData.screens.filter(
    (s) => s.notificationCount > 0
  );
  const totalNotifications = screensWithNotifications.reduce(
    (acc, s) => acc + (s.notificationCount || 0),
    0
  );

  // Close the main modal if it's open
  if (isModalOpen) {
    closeModal();
  }

  let summaryHTML = `
        <div class="text-left overflow-auto p-2" style="max-height: 400px;">
          <p class="mb-4 text-center font-semibold border-b pb-2">Total Active Notifications: ${totalNotifications}</p>
          ${
            screensWithNotifications.length > 0
              ? screensWithNotifications
                  .map(
                    (screen) => `
              <div class="mb-3 border rounded-lg p-3 shadow-sm bg-white">
                <h3 class="text-md font-bold mb-2 flex justify-between items-center">
                  <span>${screen.name}</span>
                  <span class="text-xs font-normal px-2 py-1 bg-gray-100 text-gray-700 rounded-full">${
                    screen.notificationCount
                  } total</span>
                </h3>
                <div class="pl-2 text-sm space-y-1">
                  ${
                    screen.notificationBreakdown?.warning > 0
                      ? `<div class="flex items-center gap-2 text-amber-600"><span class="font-bold w-6 text-center">⚠️</span> Warning: ${screen.notificationBreakdown.warning}</div>`
                      : ""
                  }
                  ${
                    screen.notificationBreakdown?.danger > 0
                      ? `<div class="flex items-center gap-2 text-red-600"><span class="font-bold w-6 text-center">⛔</span> Critical: ${screen.notificationBreakdown.danger}</div>`
                      : ""
                  }
                  ${
                    screen.notificationBreakdown?.safe > 0 ||
                    screen.notificationBreakdown?.success > 0
                      ? `<div class="flex items-center gap-2 text-green-600"><span class="font-bold w-6 text-center">✅</span> OK/Success: ${
                          screen.notificationBreakdown.safe ||
                          screen.notificationBreakdown.success ||
                          0
                        }</div>`
                      : ""
                  }
                  ${
                    screen.notificationBreakdown?.info > 0
                      ? `<div class="flex items-center gap-2 text-blue-600"><span class="font-bold w-6 text-center">🔔</span> Info: ${screen.notificationBreakdown.info}</div>`
                      : ""
                  }
                </div>
              </div>
            `
                  )
                  .join("")
              : ""
          }
          ${
            totalNotifications === 0
              ? '<p class="text-center text-gray-500 mt-4">No active notifications across all systems.</p>'
              : ""
          }
        </div>`;

  Swal.fire({
    title: "All System Notifications Summary",
    width: "600px",
    html: summaryHTML,
    confirmButtonText: "Close",
    confirmButtonColor: "#091349", // Match primary button style
    backdrop: true,
    allowOutsideClick: true,
    heightAuto: false,
    customClass: {
      popup: "swal2-modal-container-list-of-all-notifications", // Specific class for styling if needed
    },
  });
}

// Function to open the main modal for a screen (Handles permissions)
export function openModalForScreen(screen, userPermissions) {
  if (
    isModalOpen ||
    !modalContentDiv ||
    !modalOverlay ||
    !modalContainer ||
    !screen
  ) {
    console.warn(
      "Modal elements not found, screen data missing, or modal is already open."
    );
    return;
  }

  const hasPermission = userPermissions.includes(screen.id);
  console.log(
    `Opening modal for ${screen.name}. User has permission: ${hasPermission}`
  );

  // --- Build Modal Content ---
  let modalContentHTML = `
      <button class="close-btn" aria-label="Close modal">&times;</button>
      <div class="modal-header">
          <h2>${screen.name}</h2>
          <p class="modal-subheading">${screen.subHeading}</p>
          ${
            !hasPermission
              ? '<span class="not-subscribed-badge">You are currently not subscribed to this package</span>'
              : ""
          }
      </div>
  `;

  // --- Conditional Sections ---
  // Notification Breakdown (Only if permitted and notifications exist)
  if (
    hasPermission &&
    screen.notificationCount > 0 &&
    screen.notificationBreakdown
  ) {
    const notificationTypesHTML = Object.entries(screen.notificationBreakdown)
      .filter(([type, count]) => count > 0) // Only show types with count > 0
      .map(([type, count]) => {
        let icon = "🔔"; // Default (info)
        let className = `notification-type-${type}`; // Base class
        if (type === "warning") {
          icon = "⚠️";
          className += " type-warning";
        }
        if (type === "danger") {
          icon = "⛔";
          className += " type-danger";
        }
        if (type === "safe" || type === "success") {
          icon = "✅";
          className += " type-safe";
        } // Combine safe/success visually
        // Add more types if needed (e.g., info)

        return `<span class="${className}" data-system="${
          screen.name
        }" data-type="${type}" role="button" tabindex="0">${icon} ${
          type.charAt(0).toUpperCase() + type.slice(1)
        }: ${count}</span>`;
      })
      .join("");

    if (notificationTypesHTML) {
      // Only add section if there are types to show
      modalContentHTML += `
              <div class="notification-summary">
                  <h4>Notifications:</h4>
                  <div class="notification-types">
                      ${notificationTypesHTML}
                  </div>
              </div>
          `;
    }
  }

  // Features List (Always shown)
  if (screen.features && screen.features.length > 0) {
    modalContentHTML += `
          <div class="features-list">
              <h4>Features:</h4>
              <ul>
                  ${screen.features
                    .map((feature) => `<li>${feature}</li>`)
                    .join("")}
              </ul>
          </div>
      `;
  } else {
    modalContentHTML += `
          <div class="features-list">
              <h4>Features:</h4>
              <p class="text-sm text-gray-500 italic">No specific features listed.</p>
          </div>
      `;
  }

  // Action Buttons (Conditional primary button)
    modalContentHTML += `
      <div class="modal-actions">
          ${
            hasPermission
              ? // If user HAS permission, show the "Go to" button
                `<a href="${screen.homeRedirect}" target="_blank" rel="noopener noreferrer" class="modal-button primary">Go to ${screen.name}</a>`
              : // If user does NOT have permission, show the "Request Demo" button
                `<a href="${requestADemoUrl}" target="_blank" rel="noopener noreferrer" class="modal-button secondary">Request Demonstration</a>`
          }
          
          <!-- Removed the always-visible secondary button -->
      </div>
  `;

  // --- Display Modal ---
  modalContentDiv.innerHTML = modalContentHTML;
  modalOverlay.style.display = "block"; // Show overlay
  modalContainer.style.display = "block"; // Show container
  document.body.classList.add("modal-open"); // Prevent background scroll

  isModalOpen = true; // Set state after elements are ready

  // Animate modal in using GSAP
  gsap.fromTo(
    modalContainer,
    { opacity: 0, y: 50, scale: 0.95 },
    { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out", clearProps: "opacity,scale" }
  );
  gsap.to(modalOverlay, { opacity: 1, duration: 0.3 }); // Fade in overlay

  // Optional: Show an info toast when modal opens (Consider if this is needed)
  // showToast(
  //   `${screen.name} Details`,
  //   `Viewing details for ${screen.subHeading}`,
  //   "info"
  // );
}

// Function to create and animate screen elements (Handles Permissions)
export function initializeScreenElements(userPermissions) {
  if (!screensContainer) {
    console.error("Screens container element not found!");
    return;
  }
  screensContainer.innerHTML = ""; // Clear any existing screens first

  console.log("Initializing all screens. User Permissions:", userPermissions);

  allScreenData.screens.forEach((screen, index) => {
    const hasPermission = userPermissions.includes(screen.id);
    const screenDiv = document.createElement("div");

    // Apply base class and ID for positioning/styling
    screenDiv.className = "screen-element"; // Use 'screen-element' as the base class
    screenDiv.id = screen.id; // Assign the ID (e.g., "screen_1") - CRITICAL FOR POSITIONING
    screenDiv.dataset.screenId = screen.id; // Keep dataset for click handling

    // Set background image style
    screenDiv.style.background = `url('${screen.image}') no-repeat center center`;
    screenDiv.style.backgroundSize = "contain"; // Or 'cover' depending on desired effect

    // Add disabled class and aria-label if user does not have permission
    if (!hasPermission) {
      screenDiv.classList.add("disabled-screen");
      screenDiv.setAttribute(
        "aria-label",
        `${screen.name} (Subscription required)`
      );
    } else {
      screenDiv.setAttribute("aria-label", `Open details for ${screen.name}`);
    }

    // Add notification badge if user has permission and there are notifications
    if (hasPermission && screen.notificationCount > 0) {
      const badge = document.createElement("span");
      badge.className = "notification-badge"; // Use the correct class name
      badge.innerText = screen.notificationCount;
      screenDiv.appendChild(badge); // Append badge directly to screenDiv
    }

    screensContainer.appendChild(screenDiv);

    // Animate the screen elements in with GSAP
    gsap.fromTo(
      screenDiv,
      { opacity: 0, y: 30, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        delay: 0.1 + index * 0.08,
        ease: "power2.out",
      }
    );
  });
}

// Function to initialize announcements
export function initializeAnnouncements(loggedInUserName, screenConfig) {
  // Added screenConfig based on previous fixes
  if (!announcementWelcome || !announcementBoard) {
    console.warn("Required announcement elements not found in the DOM.");
    return; // Exit if elements are missing
  }

  // --- Update Welcome Message ---
  const welcomeSpan = announcementWelcome.querySelector("span");
  // *** MAKE SURE THIS ELEMENT EXISTS IN index.html ***
  const userNameElement = document.getElementById(
    "welcome-user-name-placeholder"
  );

  if (welcomeSpan && userNameElement) {
    userNameElement.textContent = loggedInUserName; // Update only the name part
  } else if (welcomeSpan) {
    // Fallback if placeholder span doesn't exist (less ideal)
    const homeLink = welcomeSpan.querySelector("a");
    // Find the pipe separator to insert the name before it
    const pipeNode = Array.from(welcomeSpan.childNodes).find(
      (node) =>
        node.nodeType === Node.TEXT_NODE && node.textContent.includes("|")
    );
    if (pipeNode) {
      pipeNode.textContent = ` Welcome ${loggedInUserName} | `;
    } else {
      // If no pipe, just prepend (might mess up layout)
      welcomeSpan.insertBefore(
        document.createTextNode(`Welcome ${loggedInUserName} | `),
        welcomeSpan.firstChild
      );
    }
    console.warn(
      "Could not find #welcome-user-name-placeholder span. Using fallback method to update welcome message."
    );
  } else {
    console.warn("Could not find welcome message span to update.");
  }

  // 1. Animate Announcements In
  gsap.from(announcementWelcome, {
    y: -20, // Start from slightly above
    opacity: 0,
    duration: 0.8,
    ease: "power2.out",
    delay: 0.3,
  });
  gsap.from(announcementBoard, {
    y: -20,
    opacity: 0,
    duration: 0.8,
    ease: "power2.out",
    delay: 0.5, // Stagger the second announcement
  });

  // 2. Calculate and Display Total Notifications on Board (Based on ALL screens)
  const totalNotificationCount = screenConfig.screens.reduce(
    (acc, screen) => acc + (screen.notificationCount || 0),
    0
  );

  // Clear existing badge if any
  const existingBadge = announcementBoard.querySelector(".notification-badge");
  if (existingBadge) existingBadge.remove();

  if (totalNotificationCount > 0) {
    const announcementBadge = document.createElement("span");
    announcementBadge.className = "notification-badge";
    // Keep inline with text (adjust CSS if needed)
    announcementBadge.style.position = "static";
    announcementBadge.style.marginLeft = "8px";
    announcementBadge.innerText = totalNotificationCount;
    announcementBoard.appendChild(announcementBadge);
  }
}
