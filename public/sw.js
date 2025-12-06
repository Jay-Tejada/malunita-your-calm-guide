// Malunita Service Worker - Handles push notifications, caching, and auto-updates

const CACHE_NAME = 'malunita-v1';

// Install: Skip waiting to activate immediately
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

// Activate: Claim all clients immediately
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    Promise.all([
      // Take control of all pages immediately
      self.clients.claim(),
      // Clear old caches
      caches.keys().then((names) => {
        return Promise.all(
          names.map((name) => {
            if (name !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', name);
              return caches.delete(name);
            }
          })
        );
      })
    ])
  );
});

// Fetch: Network-first strategy (always get fresh content)
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip push notification related requests
  if (event.request.url.includes('/api/') || event.request.url.includes('supabase')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache the fresh response
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => {
        // Offline fallback
        return caches.match(event.request);
      })
  );
});

// Push notification received
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');
  
  if (!event.data) {
    console.log('[Service Worker] No data in push event');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[Service Worker] Push data:', data);

    const options = {
      body: data.body,
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/icon-192.png',
      data: data.data || {},
      actions: data.actions || [],
      requireInteraction: false,
      vibrate: [200, 100, 200],
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error('[Service Worker] Error showing notification:', error);
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.action, event.notification.data);
  
  event.notification.close();

  const data = event.notification.data || {};
  const action = event.action;
  const ritualType = data.type;

  // Determine URL based on action and ritual type
  let targetUrl = '/';

  if (action === 'start-planning') {
    targetUrl = '/';
  } else if (action === 'view-tasks') {
    targetUrl = '/';
  } else if (action === 'review-day') {
    targetUrl = '/';
  } else if (action === 'view-insights') {
    targetUrl = '/weekly-insights';
  } else if (action === 'dismiss') {
    return;
  } else {
    if (ritualType === 'morning-ritual') {
      targetUrl = '/';
    } else if (ritualType === 'midday-checkin') {
      targetUrl = '/';
    } else if (ritualType === 'evening-shutdown') {
      targetUrl = '/';
    } else if (ritualType === 'weekly-reset') {
      targetUrl = '/weekly-insights';
    }
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      console.log('[Service Worker] Client list:', clientList.length);
      
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          console.log('[Service Worker] Focusing existing client');
          return client.focus().then(client => {
            if (targetUrl !== '/') {
              console.log('[Service Worker] Navigating to:', targetUrl);
              return client.navigate(targetUrl);
            }
            return client;
          });
        }
      }
      
      console.log('[Service Worker] Opening new window:', targetUrl);
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Listen for update messages
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Handle background sync (future enhancement)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Sync event:', event.tag);
  
  if (event.tag === 'sync-tasks') {
    event.waitUntil(Promise.resolve());
  }
});

console.log('[Service Worker] Loaded');
