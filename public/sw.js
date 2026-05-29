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

// ── Scheduled streak-protection timeout ──────────────────────────────
// Stored per-day so we don't double-schedule across reopens.
let _streakTimerId   = null;
let _streakTimerDate = null; // 'YYYY-MM-DD' of the day it was set

// ── Message handler ───────────────────────────────────────────────────
// Accepts three message types from the main thread:
//
//   SHOW_NOTIFICATION       — show immediately
//   SCHEDULE_STREAK_NOTIF   — schedule a 8pm streak-protection push
//   CANCEL_STREAK_NOTIF     — user opened app, cancel pending timer
//
self.addEventListener('message', event => {
  const { type } = event.data || {};

  // ── Immediate notification (existing behaviour) ───────────────────
  if (type === 'SHOW_NOTIFICATION') {
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
    return;
  }

  // ── Schedule streak-protection notification at 8pm ────────────────
  // Payload: { type, streakCount, userName, msUntil8pm, today }
  if (type === 'SCHEDULE_STREAK_NOTIF') {
    const { streakCount = 1, userName = '', msUntil8pm = 0, today = '' } = event.data;

    // Don't double-schedule for the same calendar day
    if (_streakTimerDate === today && _streakTimerId !== null) return;

    // Clear any stale timer from a previous day
    if (_streakTimerId !== null) {
      clearTimeout(_streakTimerId);
      _streakTimerId   = null;
      _streakTimerDate = null;
    }

    if (msUntil8pm <= 0) return; // Already past 8pm — don't schedule

    _streakTimerDate = today;
    _streakTimerId   = setTimeout(() => {
      _streakTimerId   = null;
      _streakTimerDate = null;

      const nameStr = userName ? `, ${userName}` : '';
      self.registration.showNotification('Noa', {
        body:    `Your ${streakCount}-day streak ends at midnight${nameStr}. Noa's waiting.`,
        icon:    '/apple-touch-icon.png',
        badge:   '/apple-touch-icon.png',
        vibrate: [200, 100, 200],
        tag:     'noa-streak-protect',
        data:    { url: '/' },
      });
    }, msUntil8pm);

    return;
  }

  // ── Cancel streak-protection (user opened app — streak is safe) ───
  if (type === 'CANCEL_STREAK_NOTIF') {
    if (_streakTimerId !== null) {
      clearTimeout(_streakTimerId);
      _streakTimerId   = null;
      _streakTimerDate = null;
    }
    return;
  }
});
