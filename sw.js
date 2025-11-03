// Update version number when you make changes to cached files
const CACHE_NAME = "wakeywakey-cache-v2";
const RUNTIME_CACHE = "wakeywakey-runtime-v2";

// Core files needed for the app to work offline
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/css/style.css",
  "/js/script.js",
  // All favicon files for complete PWA experience
  "/favicon/android-chrome-192x192.png",
  "/favicon/android-chrome-512x512.png",
  "/favicon/apple-touch-icon.png",
  "/favicon/favicon-32x32.png",
  "/favicon/favicon-16x16.png",
  "/favicon/favicon.ico",
  "/favicon/Wakey2x.png",
  "/favicon/Wakey2x.jpg",
  // YabuTech branding images
  "/images/YabuTech Circle.png",
  "/images/YabuTech Horizontal.png",
  "/images/YabuTech Square.png"
];

// Install event - cache all essential files
self.addEventListener("install", (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell and assets');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          // Delete old caches
          if (cache !== CACHE_NAME && cache !== RUNTIME_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
    .then(() => {
      console.log('[Service Worker] Activation complete');
      // Claim all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle requests from the same origin
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[Service Worker] Serving from cache:', request.url);
          return cachedResponse;
        }

        // If not in cache, fetch from network
        return fetch(request)
          .then((networkResponse) => {
            // Don't cache non-successful responses
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clone the response - one for the browser, one for the cache
            const responseToCache = networkResponse.clone();

            // Cache runtime requests for better offline experience
            caches.open(RUNTIME_CACHE)
              .then((cache) => {
                console.log('[Service Worker] Caching new resource:', request.url);
                cache.put(request, responseToCache);
              });

            return networkResponse;
          })
          .catch((error) => {
            console.error('[Service Worker] Fetch failed:', error);
            
            // Return a custom offline page if you have one
            // Or return a generic offline message
            return new Response(
              `<html>
                <head>
                  <title>Offline - Wakey Wakey</title>
                  <style>
                    body {
                      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0d0d0d 100%);
                      color: white;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      height: 100vh;
                      margin: 0;
                      text-align: center;
                    }
                    .offline-container {
                      padding: 2rem;
                    }
                    h1 { font-size: 2.5rem; margin-bottom: 1rem; }
                    p { font-size: 1.2rem; margin-bottom: 2rem; }
                    button {
                      background: #8b5fbf;
                      color: white;
                      border: none;
                      padding: 1rem 2rem;
                      font-size: 1rem;
                      border-radius: 8px;
                      cursor: pointer;
                    }
                    button:hover { background: #7a4fa8; }
                  </style>
                </head>
                <body>
                  <div class="offline-container">
                    <h1>😴 You're Offline</h1>
                    <p>Please check your internet connection and try again.</p>
                    <button onclick="window.location.reload()">Retry</button>
                  </div>
                </body>
              </html>`,
              {
                headers: { 'Content-Type': 'text/html' }
              }
            );
          });
      })
  );
});

// Listen for messages from the client to update the service worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
