    let wakeLock = null;
    const btn = document.getElementById('toggleBtn');
    let isActive = false;

    async function requestWakeLock() {
      try {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => {
          console.log('Wake Lock was released');
          btn.textContent = 'Activate Wake Lock';
          isActive = false;
        });
        console.log('Wake Lock is active');
      } catch (err) {
        console.error(`${err.name}, ${err.message}`);
      }
    }

    btn.addEventListener('click', () => {
      if (!isActive) {
        requestWakeLock();
        btn.textContent = 'Deactivate Wake Lock';
        isActive = true;
      } else {
        if (wakeLock) {
          wakeLock.release();
          wakeLock = null;
        }
        btn.textContent = 'Activate Wake Lock';
        isActive = false;
      }
    });

    // Re-request on visibility change (browser/tab changes)
    document.addEventListener('visibilitychange', () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    });
