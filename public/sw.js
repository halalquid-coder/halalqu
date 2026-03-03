self.addEventListener('install', (event) => {
    // Skip waiting so the new service worker takes over immediately
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Claim clients so the new service worker controls all open pages
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Just a basic pass-through for now to make it a valid PWA
});
