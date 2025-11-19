// Malunita Service Worker - Handles push notifications and notification actions

// Install event
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(self.clients.claim());
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
    // Morning ritual: Open to main page with focus
    targetUrl = '/';
  } else if (action === 'view-tasks') {
    // Midday: Open to main task list
    targetUrl = '/';
  } else if (action === 'review-day') {
    // Evening: Open to main page (Runway Review can be triggered from there)
    targetUrl = '/';
  } else if (action === 'view-insights') {
    // Weekly: Open to weekly insights
    targetUrl = '/weekly-insights';
  } else if (action === 'dismiss') {
    // Just close the notification, don't open app
    return;
  } else {
    // Default click (no action button) - open app based on ritual type
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
      
      // Check if app is already open
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
      
      // App not open, open new window
      console.log('[Service Worker] Opening new window:', targetUrl);
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle background sync (future enhancement)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Sync event:', event.tag);
  
  if (event.tag === 'sync-tasks') {
    event.waitUntil(
      // Could sync tasks with server when back online
      Promise.resolve()
    );
  }
});

console.log('[Service Worker] Loaded');
