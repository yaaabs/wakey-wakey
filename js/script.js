let wakeLock = null;
const toggleSwitch = document.getElementById('toggleSwitch');
const lightbulb = document.getElementById('lightbulb');
const statusText = document.getElementById('statusText');
const body = document.body;
let isActive = false;

// Check if Wake Lock API is supported
function isWakeLockSupported() {
    return 'wakeLock' in navigator;
}

async function requestWakeLock() {
    if (!isWakeLockSupported()) {
        console.error('Wake Lock API is not supported in this browser');
        statusText.textContent = 'Wake Lock not supported in this browser';
        toggleSwitch.checked = false;
        return false;
    }

    try {
        wakeLock = await navigator.wakeLock.request('screen');
        
        wakeLock.addEventListener('release', () => {
            console.log('Wake Lock was released');
            if (isActive) {
                deactivateVisuals();
            }
        });
        
        console.log('Wake Lock is active');
        return true;
    } catch (err) {
        console.error(`Wake Lock error: ${err.name}, ${err.message}`);
        statusText.textContent = `Error: ${err.message}`;
        toggleSwitch.checked = false;
        return false;
    }
}

function activateVisuals() {
    body.classList.add('light-on');
    lightbulb.classList.add('on');
 
    statusText.textContent = '🌞 Wakey wakey! Your screen won\'t sleep.';
    isActive = true;
}

function deactivateVisuals() {
    body.classList.remove('light-on');
    lightbulb.classList.remove('on');
    statusText.textContent = '😴 Zzz... I\'m sleepy.';
    toggleSwitch.checked = false;
    isActive = false;
}

// Main toggle event
toggleSwitch.addEventListener('change', async () => {
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
                console.error('Error releasing wake lock:', err);
            }
        }
        deactivateVisuals();
    }
});

// Re-request wake lock on visibility change (browser/tab changes)
document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && isActive && !wakeLock) {
        console.log('Page became visible, re-requesting wake lock');
        const success = await requestWakeLock();
        if (!success) {
            deactivateVisuals();
        }
    }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (wakeLock) {
        wakeLock.release();
    }
});

// Add subtle sound effect on toggle
function playToggleSound(isOn) {
    if (window.AudioContext || window.webkitAudioContext) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(isOn ? 800 : 400, audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (err) {
            // Audio context might not be available
            console.log('Audio not available');
        }
    }
}

// Add sound to toggle
toggleSwitch.addEventListener('change', () => {
    playToggleSound(toggleSwitch.checked);
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (!isWakeLockSupported()) {
        statusText.textContent = 'Wake Lock API not supported in this browser';
        toggleSwitch.disabled = true;
    } else {
        statusText.textContent = '😴 Zzz... I\'m sleepy.';
    }
});


// About modal handling
document.addEventListener('DOMContentLoaded', function () {
    const modalOverlay = document.getElementById('about-modal-overlay');
    const closeBtn = document.getElementById('about-modal-close');
    const confirmBtn = document.getElementById('about-close-btn');

    // Updated: Use querySelectorAll for both icon and footer link
    const aboutTriggers = document.querySelectorAll('#about-icon, #about-link-footer');

    function openModal() {
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Add event listeners to both triggers
    aboutTriggers.forEach(el => {
        el.addEventListener('click', function (e) {
            e.preventDefault();
            openModal();
        });
    });

    closeBtn.addEventListener('click', closeModal);
    confirmBtn.addEventListener('click', closeModal);

    modalOverlay.addEventListener('click', function (event) {
        if (event.target === modalOverlay) {
            closeModal();
        }
    });
});


if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registered', reg))
      .catch(err => console.log('Service Worker registration failed', err));
  });
}
