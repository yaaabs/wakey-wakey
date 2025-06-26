let wakeLock = null;

async function requestWakeLock() {
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    console.log("Wake lock active");
    wakeLock.addEventListener('release', () => {
      console.log("Wake lock released");
    });
  } catch (err) {
    console.error(`${err.name}, ${err.message}`);
  }
}

function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release();
    wakeLock = null;
  }
}
