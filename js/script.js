let wakeLock = null;
const toggleSwitch = document.getElementById("toggleSwitch");
const lightbulb = document.getElementById("lightbulb");
const statusText = document.getElementById("statusText");
const body = document.body;
let isActive = false;

// Check if Wake Lock API is supported
function isWakeLockSupported() {
  return "wakeLock" in navigator;
}

async function requestWakeLock() {
  if (!isWakeLockSupported()) {
    console.error("Wake Lock API is not supported in this browser");
    statusText.textContent = "Wake Lock not supported in this browser";
    toggleSwitch.checked = false;
    return false;
  }

  try {
    wakeLock = await navigator.wakeLock.request("screen");

    wakeLock.addEventListener("release", () => {
      console.log("Wake Lock was released");
      if (isActive) {
        deactivateVisuals();
      }
    });

    console.log("Wake Lock is active");
    return true;
  } catch (err) {
    console.error(`Wake Lock error: ${err.name}, ${err.message}`);
    statusText.textContent = `Error: ${err.message}`;
    toggleSwitch.checked = false;
    return false;
  }
}

function activateVisuals() {
  body.classList.add("light-on");
  lightbulb.classList.add("on");

  statusText.textContent = "🌞 Wakey wakey! Your screen won't sleep.";
  isActive = true;
}

function deactivateVisuals() {
  body.classList.remove("light-on");
  lightbulb.classList.remove("on");
  statusText.textContent = "😴 Zzz... I'm sleepy.";
  toggleSwitch.checked = false;
  isActive = false;
}

// Main toggle event with sound feedback
toggleSwitch.addEventListener("change", async () => {
  // Play sound feedback
  playToggleSound(toggleSwitch.checked);

  if (toggleSwitch.checked && !isActive) {
    // Trying to activate
    const success = await requestWakeLock();
    if (success && wakeLock) {
      activateVisuals();
    } else {
      toggleSwitch.checked = false;
    }
  } else if (!toggleSwitch.checked && isActive) {
    // Trying to deactivate
    if (wakeLock) {
      try {
        await wakeLock.release();
        wakeLock = null;
      } catch (err) {
        console.error("Error releasing wake lock:", err);
      }
    }
    deactivateVisuals();
  }
});

// Re-request wake lock on visibility change (browser/tab changes)
document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState === "visible" && isActive && !wakeLock) {
    console.log("Page became visible, re-requesting wake lock");
    const success = await requestWakeLock();
    if (!success) {
      deactivateVisuals();
    }
  }
});

// Handle page unload
window.addEventListener("beforeunload", () => {
  if (wakeLock) {
    wakeLock.release();
  }
});

// Add subtle sound effect on toggle
function playToggleSound(isOn) {
  if (window.AudioContext || window.webkitAudioContext) {
    try {
      const audioContext = new (
        window.AudioContext || window.webkitAudioContext
      )();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(
        isOn ? 800 : 400,
        audioContext.currentTime,
      );
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        0.1,
        audioContext.currentTime + 0.01,
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.2,
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (err) {
      // Audio context might not be available
      console.log("Audio not available");
    }
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  if (!isWakeLockSupported()) {
    statusText.textContent = "Wake Lock API not supported in this browser";
    toggleSwitch.disabled = true;
  } else {
    statusText.textContent = "😴 Zzz... I'm sleepy.";
  }
});

// About modal handling
document.addEventListener("DOMContentLoaded", function () {
  const modalOverlay = document.getElementById("about-modal-overlay");
  const closeBtn = document.getElementById("about-modal-close");
  const confirmBtn = document.getElementById("about-close-btn");

  // Updated: Use querySelectorAll for both icon and footer link
  const aboutTriggers = document.querySelectorAll(
    "#about-icon, #about-link-footer",
  );

  function openModal() {
    modalOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modalOverlay.classList.remove("active");
    document.body.style.overflow = "";
  }

  // Add event listeners to both triggers
  aboutTriggers.forEach((el) => {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      openModal();
    });
  });

  closeBtn.addEventListener("click", closeModal);
  confirmBtn.addEventListener("click", closeModal);

  modalOverlay.addEventListener("click", function (event) {
    if (event.target === modalOverlay) {
      closeModal();
    }
  });
});

// Enhanced Service Worker registration with update handling
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("✅ Service Worker registered", reg);

        // Check for updates periodically
        setInterval(() => {
          reg.update();
        }, 60000); // Check every minute

        // Handle service worker updates
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          console.log("🔄 New Service Worker found, installing...");

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New service worker available, show update notification
              console.log("✨ New version available! Refresh to update.");
              showUpdateNotification();
            }
          });
        });
      })
      .catch((err) =>
        console.error("⚠️ Service Worker registration failed:", err),
      );
  });
}

// Show update notification to user
function showUpdateNotification() {
  const updateBanner = document.createElement("div");
  updateBanner.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #8b5fbf, #6a4a9e);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 1rem;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    max-width: 350px;
    animation: slideIn 0.3s ease-out;
  `;

  updateBanner.innerHTML = `
    <div style="flex: 1;">
      <strong style="display: block; margin-bottom: 0.25rem;">✨ Update Available</strong>
      <span style="font-size: 0.9rem; opacity: 0.95;">A new version of Wakey Wakey is ready!</span>
    </div>
    <button id="update-btn" style="
      background: white;
      color: #8b5fbf;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
      font-size: 0.9rem;
      white-space: nowrap;
    ">Update</button>
  `;

  document.body.appendChild(updateBanner);

  // Add animation
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);

  // Handle update button click
  document.getElementById("update-btn").addEventListener("click", () => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });
    }
    window.location.reload();
  });
}
