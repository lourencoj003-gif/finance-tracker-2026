const CACHE = 'noa-v3';

// Shell files guaranteed to exist at these paths
const PRECACHE = ['/', '/index.html', '/noa-icon.svg', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Only handle GET requests; skip API calls so they always hit the network
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).pathname.startsWith('/api/')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Only cache successful same-origin responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return response;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (e.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// ── Push Notifications ────────────────────────────────────────────────

// Receive a push from the server and display as a notification
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data?.json() || {}; } catch (_) {}
  const title = data.title || 'Noa';
  const options = {
    body:    data.body  || '',
    icon:    '/apple-touch-icon.png',
    badge:   '/apple-touch-icon.png',
    vibrate: [180, 80, 180],
    tag:     data.tag   || 'noa-push',
    data:    { url: data.url || '/' },
    requireInteraction: false,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click → open or focus the app
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes(self.location.origin));
      if (existing) { existing.focus(); return; }
      clients.openWindow(target);
    })
  );
});

// Triggered directly from the main thread (for client-side scheduled notifications)
// The main app posts: { type: 'SHOW_NOTIFICATION', title, body, tag }
self.addEventListener('message', event => {
  if (event.data?.type !== 'SHOW_NOTIFICATION') return;
  const { title = 'Noa', body = '', tag = 'noa-local' } = event.data;
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon:    '/apple-touch-icon.png',
      badge:   '/apple-touch-icon.png',
      vibrate: [180, 80, 180],
      tag,
      data:    { url: '/' },
    })
  );
});
